# Watsy-Chatbot Platform

A comprehensive WhatsApp chatbot SaaS platform built with Next.js 14+, featuring multi-tenant architecture, real-time messaging, visual flow builder, and subscription management.

## 🚀 Features

- **Multi-tenant SaaS Architecture** - Support for multiple organizations
- **WhatsApp Integration** - Unofficial WhatsApp Web API using @whiskeysockets/baileys
- **Visual Flow Builder** - Drag-and-drop chatbot configuration with React Flow
- **Real-time Messaging** - WebSocket-based live communication
- **Subscription Management** - Stripe integration with multiple tiers
- **Analytics Dashboard** - Comprehensive reporting and metrics
- **Role-based Access Control** - User, Admin, and Super Admin roles
- **Multi-factor Authentication** - TOTP-based MFA for enhanced security

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3.4 with App Router and TypeScript
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache/Queue**: Redis 7+ for caching and rate limiting
- **State Management**: Zustand + TanStack Query
- **Authentication**: JWT with refresh tokens
- **Payments**: Stripe integration
- **File Storage**: AWS S3 (configurable)
- **Email**: SendGrid integration
- **Monitoring**: Sentry for error tracking

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm
- **Docker** and Docker Compose
- **Git** for version control

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Ideal4Soft/watsy-chatbot.git
cd watsy-chatbot
```

### 2. Environment Setup

Copy the environment template and configure your local settings:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your specific configuration values. The default development setup uses:

- PostgreSQL: `ahmed:ahmed@localhost:5433/watsy_chatbot`
- Redis: `redis://default:ahmed@localhost:6379`

### 3. Start Development Services

Start the PostgreSQL and Redis services using Docker Compose:

```bash
# Start core services (PostgreSQL + Redis)
docker-compose up -d

# Or start with pgAdmin for database management
docker-compose --profile tools up -d
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🐳 Docker Services

The development environment includes the following services:

### Core Services

- **PostgreSQL** (port 5433) - Main database
- **Redis** (port 6379) - Caching and rate limiting

### Optional Tools (use `--profile tools`)

- **pgAdmin** (port 5050) - Database management interface
  - Email: `admin@watsy.com`
  - Password: `admin`

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start with tools (includes pgAdmin)
docker-compose --profile tools up -d

# View service logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ This will delete all data)
docker-compose down -v

# Restart a specific service
docker-compose restart [service-name]
```

## 🔧 Development Commands

```bash
# Development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint

# Type checking
npx tsc --noEmit

# Test database and Redis connections
npm run test:connections

# Docker management
npm run docker:up      # Start services
npm run docker:down    # Stop services
npm run docker:logs    # View logs
```

## 🌿 Git Workflow

We follow **Git Flow** branching strategy for organized development:

### Branch Structure

- **`main`** - Production-ready code (protected)
- **`develop`** - Integration branch for new features (default for development)
- **`feature/*`** - New feature development
- **`bugfix/*`** - Bug fixes in development
- **`release/*`** - Prepare for production release
- **`hotfix/*`** - Critical fixes for production

### Development Workflow

1. **Start new feature**:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Work on your feature**:

   ```bash
   # Make changes
   git add .
   git commit -m "feat(scope): description of changes"
   ```

3. **Submit for review**:
   ```bash
   git push origin feature/your-feature-name
   # Create Pull Request to develop branch
   ```

### Commit Message Convention

We use **Conventional Commits** for clear commit history:

```
<type>[optional scope]: <description>

[optional body]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Examples**:

```bash
feat(auth): add JWT refresh token functionality
fix(whatsapp): resolve message sending timeout
docs(readme): update Docker setup instructions
```

### Branch Naming

- `feature/user-authentication`
- `feature/whatsapp-integration`
- `bugfix/login-validation-error`
- `hotfix/critical-security-fix`
- `release/v1.0.0`

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Development workflow
- Branch strategy
- Commit standards
- Pull request process
- Code review guidelines

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch from `develop`
3. Make your changes following our guidelines
4. Submit a pull request to `develop`

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages and layouts
├── components/          # Reusable UI components
├── lib/                # Server-side utilities and database clients
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── schemas/            # Data validation schemas (Zod)
└── styles/             # Global CSS beyond Tailwind

docker/
├── postgres/           # PostgreSQL configuration
│   └── init/          # Database initialization scripts
└── redis/             # Redis configuration

scripts/                # Development and testing scripts
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📚 Documentation

- **[Admin Setup Guide](docs/admin-setup.md)** - Database seeding and admin user management
- **[Contributing Guidelines](CONTRIBUTING.md)** - Development workflow and standards

## 🆘 Support

- **Documentation**: Check this README and project documentation
- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Ask questions in GitHub Discussions

---

**Happy coding!** 🚀
