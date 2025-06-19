# WhatsApp Device Management Guide

## Overview

The Watsy-Chatbot platform provides comprehensive WhatsApp device management capabilities, allowing you to connect, monitor, and manage multiple WhatsApp devices for your chatbot operations. This guide covers everything you need to know about device pairing, management, and troubleshooting.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Device Pairing](#device-pairing)
3. [Device Management](#device-management)
4. [Security Features](#security-features)
5. [Troubleshooting](#troubleshooting)
6. [Best Practices](#best-practices)
7. [API Reference](#api-reference)

## Getting Started

### Prerequisites

- Active Watsy-Chatbot account
- WhatsApp installed on your mobile device
- Stable internet connection
- Modern web browser with JavaScript enabled

### Accessing Device Management

1. Log in to your Watsy-Chatbot dashboard
2. Navigate to **"WhatsApp Devices"** from the main menu
3. You'll see the device management dashboard with real-time status updates

## Device Pairing

### Method 1: QR Code Pairing (Recommended)

QR code pairing is the fastest and most secure method to connect your WhatsApp device.

#### Steps:

1. **Create a New Device**

   - Click the **"Add Device"** button
   - Enter a descriptive name for your device (e.g., "Business Phone", "Support Line")
   - Click **"Create Device"**

2. **Generate QR Code**

   - Click **"Connect"** on your newly created device
   - Select the **"QR Code"** tab in the pairing dialog
   - A QR code will be generated automatically

3. **Scan with WhatsApp**

   - Open WhatsApp on your mobile device
   - Go to **Settings** > **Linked Devices**
   - Tap **"Link a Device"**
   - Scan the QR code displayed on your screen

4. **Confirmation**
   - Your device status will change to "Connected" once pairing is successful
   - You'll receive a confirmation notification

#### Important Notes:

- QR codes expire after 5 minutes for security
- Click **"Refresh QR Code"** if it expires
- Ensure your phone and computer are on the same network for best results

### Method 2: Pairing Code

Use this method if you cannot scan QR codes or prefer manual entry.

#### Steps:

1. **Generate Pairing Code**

   - Click **"Connect"** on your device
   - Select the **"Pairing Code"** tab
   - Enter your phone number (with country code)
   - Click **"Generate Pairing Code"**

2. **Enter Code in WhatsApp**

   - Open WhatsApp on your mobile device
   - Go to **Settings** > **Linked Devices** > **"Link a Device"**
   - Select **"Link with phone number instead"**
   - Enter the 8-character code displayed on your screen

3. **Validation**
   - Enter the confirmation code from WhatsApp into the platform
   - Click **"Validate Code"** to complete pairing

## Device Management

### Device Dashboard

The device dashboard provides a comprehensive overview of all your connected WhatsApp devices:

#### Device Information:

- **Device Name**: Custom name you assigned
- **Phone Number**: Associated WhatsApp number
- **Status**: Current connection state
- **Messages Today**: Number of messages sent today
- **Connection Attempts**: Recent connection attempts
- **Last Connected**: Last successful connection time

#### Device Status Indicators:

| Status          | Description                     | Action Required              |
| --------------- | ------------------------------- | ---------------------------- |
| 🟢 Connected    | Device is active and ready      | None                         |
| 🟡 Connecting   | Device is attempting to connect | Wait for completion          |
| ⚫ Disconnected | Device is offline               | Click "Connect" to reconnect |
| 🔴 Failed       | Connection failed               | Check troubleshooting guide  |
| 🚫 Banned       | Device banned by WhatsApp       | Contact support              |

### Device Actions

#### Connect Device

- Click the **"Connect"** button on a disconnected device
- Follow the pairing process (QR code or pairing code)
- Monitor the status indicator for connection progress

#### Disconnect Device

- Click the **"Disconnect"** button on a connected device
- Device will safely disconnect from WhatsApp
- You can reconnect later without re-pairing

#### Remove Device

- Click the **trash icon** to permanently remove a device
- This action cannot be undone
- You'll need to re-pair if you want to use the device again

### Real-time Updates

The dashboard provides real-time status updates through WebSocket connections:

- **Connection Status**: Live updates when devices connect/disconnect
- **Message Counts**: Real-time message statistics
- **Error Notifications**: Immediate alerts for connection issues

## Security Features

### Device Authorization

Every device operation is protected by multiple security layers:

- **User Authentication**: Only authenticated users can manage devices
- **Device Ownership**: Users can only manage their own devices
- **Session Validation**: Device sessions are validated for integrity
- **Rate Limiting**: Protection against excessive connection attempts

### Session Management

- **Automatic Expiration**: Sessions expire after 30 days of inactivity
- **Secure Storage**: Session data is encrypted and securely stored
- **Token Rotation**: Authentication tokens are regularly rotated
- **Audit Logging**: All device operations are logged for security

### Rate Limiting

To prevent abuse and ensure system stability:

- **Connection Attempts**: Maximum 10 attempts per hour per device
- **Device Creation**: Maximum 5 devices per user account
- **API Requests**: Rate limiting on all device management endpoints

## Troubleshooting

### Common Issues

#### QR Code Won't Scan

**Symptoms**: WhatsApp can't read the QR code

**Solutions**:

1. Ensure good lighting and clear screen visibility
2. Try refreshing the QR code
3. Check that your phone camera is working properly
4. Use the pairing code method instead

#### Device Shows "Failed" Status

**Symptoms**: Device status shows as "Failed" after connection attempt

**Solutions**:

1. Check your internet connection
2. Verify WhatsApp is properly installed and updated
3. Try disconnecting and reconnecting
4. Clear browser cache and cookies
5. Contact support if issue persists

#### Connection Keeps Dropping

**Symptoms**: Device frequently disconnects and reconnects

**Solutions**:

1. Check network stability
2. Ensure WhatsApp app stays active on your phone
3. Verify phone battery optimization settings
4. Check for WhatsApp updates

#### Rate Limit Exceeded

**Symptoms**: "Too many connection attempts" error

**Solutions**:

1. Wait for the rate limit window to reset (1 hour)
2. Avoid rapid connection attempts
3. Check for automated scripts or bots

### Error Codes

| Code                | Description               | Solution                  |
| ------------------- | ------------------------- | ------------------------- |
| DEVICE_NOT_FOUND    | Device doesn't exist      | Verify device ID          |
| UNAUTHORIZED_ACCESS | Permission denied         | Check user authentication |
| RATE_LIMIT_EXCEEDED | Too many requests         | Wait and retry            |
| SESSION_EXPIRED     | Session no longer valid   | Reconnect device          |
| PAIRING_TIMEOUT     | Pairing process timed out | Start pairing again       |

### Getting Help

If you continue experiencing issues:

1. **Check System Status**: Visit our status page for known issues
2. **Review Logs**: Check the browser console for error messages
3. **Contact Support**: Reach out with device ID and error details
4. **Community Forum**: Search for similar issues and solutions

## Best Practices

### Device Naming

- Use descriptive names (e.g., "Customer Support", "Sales Team")
- Include location or purpose for easy identification
- Avoid special characters or very long names

### Security

- Regularly review connected devices
- Remove unused or old devices
- Monitor device activity for suspicious behavior
- Keep WhatsApp app updated on your mobile device

### Performance

- Limit the number of active devices based on your needs
- Monitor message quotas and usage
- Disconnect devices when not in use for extended periods

### Maintenance

- Regularly check device status
- Update device information as needed
- Review and clean up old session data
- Monitor connection quality and stability

## API Reference

### Device Management Endpoints

#### Create Device

```typescript
createWhatsAppDevice({
  name: string,
  description: string,
});
```

#### Connect Device

```typescript
connectWhatsAppDevice({
  deviceId: string,
});
```

#### Generate QR Code

```typescript
generateDeviceQRCode({
  deviceId: string,
});
```

#### Generate Pairing Code

```typescript
generateDevicePairingCode({
  deviceId: string,
  phoneNumber: string,
});
```

### WebSocket Events

#### Connection Events

- `device.connected`: Device successfully connected
- `device.disconnected`: Device disconnected
- `device.pairing`: Device in pairing mode
- `device.error`: Connection error occurred

#### Message Events

- `message.received`: New message received
- `message.sent`: Message sent successfully
- `message.delivered`: Message delivered to recipient
- `message.read`: Message read by recipient

### Security Headers

All API requests require proper authentication:

```
Authorization: Bearer <access_token>
X-User-ID: <user_id>
X-Device-ID: <device_id>
```

## Support

For additional help and support:

- **Documentation**: [docs.watsy.com](https://docs.watsy.com)
- **Support Email**: support@watsy.com
- **Community Forum**: [community.watsy.com](https://community.watsy.com)
- **Status Page**: [status.watsy.com](https://status.watsy.com)

## Changelog

### Version 1.0.0 (June 19, 2025)

- Initial release of WhatsApp Device Management system
- QR code and pairing code authentication methods
- Real-time device status monitoring
- Comprehensive security features
- Session management and persistence
- Rate limiting and abuse prevention

---

_Last updated: June 19, 2025_
_Version: 1.0.0_
