# WhatsApp Device Management - Technical Guide

## Architecture Overview

The WhatsApp Device Management system is built using a modern, scalable architecture with the following key components:

### Core Technologies

- **Next.js 14+** with App Router and Server Components
- **TypeScript** for type safety and developer experience
- **Prisma ORM** with PostgreSQL for data persistence
- **@whiskeysockets/baileys** for WhatsApp Web API integration
- **WebSocket** for real-time communication
- **Zustand** for client-side state management
- **shadcn/ui** for UI components

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │  Server Actions │    │   WhatsApp API  │
│   (React/Next)  │◄──►│   (Next.js)     │◄──►│   (Baileys)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   Database      │    │   Session       │
│   (Real-time)   │    │   (PostgreSQL)  │    │   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Database Schema

### WhatsApp Device Model

```sql
model WhatsAppDevice {
  id                    String                @id @default(cuid())
  userId                String
  name                  String
  phoneNumber           String?
  status                WhatsAppDeviceStatus  @default(DISCONNECTED)
  lastConnectedAt       DateTime?
  lastDisconnectedAt    DateTime?
  connectionAttempts    Int                   @default(0)
  sessionData           Json?
  qrCode                String?
  qrCodeExpires         DateTime?
  deviceInfo            Json?
  batteryLevel          Int?
  isCharging            Boolean?
  messagesSentToday     Int                   @default(0)
  lastMessageSentAt     DateTime?
  rateLimitResetAt      DateTime              @default(now())
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt

  // Relations
  user                  User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  contacts              Contact[]
  messages              Message[]
  chatbots              Chatbot[]

  @@map("whatsapp_devices")
}
```

### Device Status Enum

```sql
enum WhatsAppDeviceStatus {
  DISCONNECTED
  CONNECTING
  CONNECTED
  FAILED
  BANNED
}
```

## Core Services

### 1. WhatsApp Service (`src/lib/whatsapp/service.ts`)

Main service for managing WhatsApp connections using Baileys library.

#### Key Methods:

```typescript
class WhatsAppService {
  // Device management
  async createDevice(userId: string, deviceName: string): Promise<WhatsAppDevice>
  async connectDevice(deviceId: string): Promise<ConnectionResult>
  async disconnectDevice(deviceId: string): Promise<boolean>
  async removeDevice(deviceId: string): Promise<boolean>
  
  // Status monitoring
  async getDeviceStatus(deviceId: string): Promise<WhatsAppDeviceStatus>
  async listUserDevices(userId: string): Promise<WhatsAppDevice[]>
}
```

#### Connection Flow:

1. Initialize Baileys socket with auth state
2. Setup event handlers for connection updates
3. Handle QR code generation and pairing
4. Manage session persistence
5. Monitor connection health

### 2. Device Pairing Manager (`src/lib/whatsapp/pairing.ts`)

Handles device pairing through QR codes and pairing codes.

#### Key Features:

- **QR Code Generation**: Creates secure QR codes with expiration
- **Pairing Code Alternative**: Manual code entry for devices without cameras
- **Timeout Management**: Automatic cleanup of expired pairing sessions
- **Security Validation**: Ensures secure pairing process

#### Pairing Flow:

```typescript
// QR Code Method
const pairingData = await pairingManager.generateQRCode(deviceId)
// User scans QR code with WhatsApp
// Connection established automatically

// Pairing Code Method
const pairingData = await pairingManager.generatePairingCode(deviceId, phoneNumber)
const isValid = await pairingManager.validatePairingCode(deviceId, userEnteredCode)
```

### 3. Session Manager (`src/lib/whatsapp/session-manager.ts`)

Manages persistent session storage and restoration.

#### Features:

- **File-based Storage**: Sessions stored as encrypted JSON files
- **Database Backup**: Fallback storage in database
- **Automatic Cleanup**: Removes expired sessions
- **Integrity Validation**: Checksums for session data validation

#### Session Lifecycle:

```typescript
// Save session
await sessionManager.saveSession(deviceId, sessionData)

// Load session
const result = await sessionManager.loadSession(deviceId)

// Validate session
const isValid = await sessionManager.isSessionValid(deviceId)

// Cleanup expired
const cleanedCount = await sessionManager.cleanupExpiredSessions()
```

### 4. Security Manager (`src/lib/whatsapp/security.ts`)

Comprehensive security layer for device operations.

#### Security Features:

- **Device Authorization**: Multi-layer access control
- **Rate Limiting**: Prevents abuse and excessive requests
- **Session Validation**: Ensures session integrity
- **Audit Logging**: Complete audit trail
- **Suspicious Activity Detection**: Automated threat detection

#### Security Checks:

```typescript
// Authorize device access
const authResult = await securityManager.authorizeDeviceAccess(userId, deviceId)

// Check rate limits
const rateLimitResult = await securityManager.checkConnectionRateLimit(deviceId)

// Validate session
const sessionResult = await securityManager.validateDeviceSession(deviceId)

// Detect suspicious activity
const suspiciousResult = await securityManager.detectSuspiciousActivity(userId)
```

### 5. WebSocket Server (`src/lib/whatsapp/websocket-server.ts`)

Real-time communication for device status updates.

#### Features:

- **JWT Authentication**: Secure WebSocket connections
- **Event Broadcasting**: Real-time device events
- **Connection Management**: Automatic reconnection and cleanup
- **Message Queuing**: Reliable message delivery

#### WebSocket Events:

```typescript
// Client subscribes to device events
ws.send(JSON.stringify({
  type: 'subscribe',
  payload: { deviceId: 'device-123' }
}))

// Server broadcasts device events
{
  type: 'event',
  payload: {
    eventType: 'connection',
    deviceId: 'device-123',
    data: { status: 'CONNECTED' }
  }
}
```

## Server Actions

### Device Management Actions (`src/app/actions/whatsapp-devices.ts`)

Secure server actions for device operations with comprehensive validation.

#### Key Actions:

```typescript
// Create device
export async function createWhatsAppDevice(input: CreateDeviceInput)

// Device operations
export async function connectWhatsAppDevice(input: ConnectDeviceInput)
export async function disconnectWhatsAppDevice(input: DisconnectDeviceInput)
export async function removeWhatsAppDevice(input: RemoveDeviceInput)

// Pairing operations
export async function generateDeviceQRCode(input: QRCodeInput)
export async function generateDevicePairingCode(input: PairingCodeInput)
export async function validateDevicePairingCode(input: ValidateCodeInput)

// Status monitoring
export async function getUserWhatsAppDevices()
export async function getWhatsAppDeviceDetails(deviceId: string)
```

#### Security Integration:

All server actions include:
- User authentication verification
- Device ownership validation
- Rate limiting checks
- Audit logging
- Input validation with Zod schemas

## Frontend Components

### Device Dashboard (`src/components/whatsapp/device-dashboard.tsx`)

Main interface for device management with real-time updates.

#### Features:

- **Device Grid**: Visual representation of all devices
- **Status Indicators**: Real-time status with color coding
- **Action Buttons**: Connect, disconnect, remove operations
- **WebSocket Integration**: Live updates without page refresh

### Device Pairing Dialog (`src/components/whatsapp/device-pairing-dialog.tsx`)

Modal interface for device pairing with multiple methods.

#### Components:

- **QR Code Display**: Generates and displays QR codes
- **Pairing Code Input**: Manual code entry interface
- **Timeout Management**: Visual countdown and refresh options
- **Error Handling**: User-friendly error messages

### Security Considerations

#### Authentication & Authorization

1. **JWT Tokens**: All requests authenticated with JWT
2. **Device Ownership**: Users can only access their devices
3. **Role-based Access**: Different permissions for user roles
4. **Session Validation**: Regular session integrity checks

#### Data Protection

1. **Encryption**: Session data encrypted at rest
2. **Secure Transmission**: HTTPS/WSS for all communications
3. **Token Rotation**: Regular rotation of authentication tokens
4. **Audit Logging**: Complete audit trail for compliance

#### Rate Limiting

1. **Connection Attempts**: Max 10 per hour per device
2. **API Requests**: Rate limiting on all endpoints
3. **Device Creation**: Max 5 devices per user
4. **WebSocket Connections**: Connection limits per user

## Testing Strategy

### Database Testing (`scripts/test-whatsapp-database.js`)

Validates database schema and CRUD operations:

```bash
npm run test:whatsapp-database
```

Tests include:
- User and device creation
- Device status updates
- Session data management
- Relationship queries
- Data integrity validation

### Integration Testing

Comprehensive testing of all system components:

```bash
npm run test:whatsapp-devices
```

Test coverage:
- Device lifecycle management
- Pairing system functionality
- Session management
- Security features
- WebSocket communication

## Deployment Considerations

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# WhatsApp
WHATSAPP_SESSIONS_PATH="./sessions"

# WebSocket
NEXT_PUBLIC_WS_URL="ws://localhost:8080"
```

### Production Setup

1. **Database Migration**: Run Prisma migrations
2. **Session Storage**: Configure persistent session directory
3. **WebSocket Server**: Deploy WebSocket server separately
4. **Load Balancing**: Configure sticky sessions for WebSocket
5. **Monitoring**: Setup logging and monitoring
6. **Security**: Configure CORS, rate limiting, and security headers

### Scaling Considerations

1. **Database Optimization**: Proper indexing and query optimization
2. **Session Storage**: Consider Redis for session storage at scale
3. **WebSocket Clustering**: Use Redis adapter for multi-instance WebSocket
4. **Rate Limiting**: Distributed rate limiting with Redis
5. **Monitoring**: Comprehensive monitoring and alerting

## Performance Optimization

### Database Queries

- Proper indexing on frequently queried fields
- Efficient pagination for device lists
- Connection pooling for high concurrency
- Query optimization with Prisma

### WebSocket Performance

- Connection pooling and management
- Message batching for high-frequency updates
- Automatic reconnection with exponential backoff
- Memory management for long-running connections

### Frontend Optimization

- Component memoization for expensive renders
- Efficient state management with Zustand
- Lazy loading of non-critical components
- Optimistic UI updates for better UX

## Monitoring & Observability

### Logging

- Structured logging with correlation IDs
- Security event logging for audit trails
- Performance metrics and timing
- Error tracking and alerting

### Metrics

- Device connection success rates
- Session persistence metrics
- WebSocket connection health
- API response times and error rates

### Alerting

- Failed device connections
- Security violations
- System performance degradation
- High error rates or unusual patterns

---

*Technical Guide Version: 1.0.0*
*Last Updated: June 19, 2025*
