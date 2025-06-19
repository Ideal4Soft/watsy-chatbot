# Admin User Setup Guide

This guide covers the setup and management of admin users in the Watsy-Chatbot platform, including initial seeding, security best practices, and user management.

## Table of Contents

- [Quick Start](#quick-start)
- [Database Seeding](#database-seeding)
- [Default Admin Credentials](#default-admin-credentials)
- [First Login & Security Setup](#first-login--security-setup)
- [Creating Additional Admin Users](#creating-additional-admin-users)
- [Security Recommendations](#security-recommendations)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

Before running the admin setup, ensure you have:

1. **Database Running**: PostgreSQL instance is running and accessible
2. **Environment Variables**: Properly configured `.env.local` file
3. **Dependencies Installed**: Run `npm install` to install all dependencies
4. **Database Migrated**: Run `npm run db:migrate` to apply database schema

### Initialize Admin User

```bash
# Run the database seeding script
npm run db:seed
```

This will create the default admin user if it doesn't already exist.

## Database Seeding

### Available Commands

```bash
# Seed the database with default admin user
npm run db:seed

# Reset database and re-seed (⚠️ DESTRUCTIVE - removes all data)
npm run db:reset

# Generate Prisma client
npm run db:generate

# Apply database migrations
npm run db:migrate

# Open Prisma Studio for database management
npm run db:studio
```

### Seed Script Features

The seeding script (`prisma/seed.ts`) provides:

- ✅ **Idempotency**: Won't create duplicate admin users
- ✅ **Password Hashing**: Uses bcryptjs with 12 salt rounds
- ✅ **Verification**: Confirms user creation and authentication
- ✅ **Error Handling**: Comprehensive error reporting
- ✅ **Logging**: Detailed console output for debugging

### Seed Script Output

When successful, you'll see output like:

```
🌱 Starting database seeding...
=====================================
🔍 Checking for existing admin user...
🔐 Hashing admin password...
👤 Creating default admin user...
✅ Default admin user created successfully!
   - Email: admin@watsy-chatbot.com
   - User ID: clr123abc...
   - Role: ADMIN
   - Created: 2024-01-15T10:30:00.000Z
🔍 Verifying admin user authentication...
✅ Admin user authentication verified
=====================================
🎉 Database seeding completed successfully!

📋 ADMIN LOGIN CREDENTIALS:
   Email: admin@watsy-chatbot.com
   Password: Admin123!@#

⚠️  SECURITY NOTICE:
   Please change the default password after first login!
   See docs/admin-setup.md for security recommendations.
```

## Default Admin Credentials

### Initial Login Details

- **Email**: `admin@watsy-chatbot.com`
- **Password**: `Admin123!@#`
- **Role**: `ADMIN`
- **Status**: Active, Email Verified

### User Profile Details

- **First Name**: System
- **Last Name**: Administrator
- **Email Verified**: ✅ Yes
- **Account Status**: ✅ Active

## First Login & Security Setup

### 🔐 Immediate Security Steps

After your first login, **immediately** perform these security steps:

#### 1. Change Default Password

1. Navigate to **Profile Settings** (`/profile`)
2. Go to the **Change Password** section
3. Enter the current password: `Admin123!@#`
4. Create a strong new password that meets requirements:
   - At least 8 characters
   - Contains uppercase letter (A-Z)
   - Contains lowercase letter (a-z)
   - Contains number (0-9)
   - Contains special character (!@#$%^&*)

#### 2. Update Profile Information

1. Change **First Name** and **Last Name** to your actual name
2. Update **Email** to your organization's admin email (optional)
3. Add a **Profile Avatar** URL if desired

#### 3. Review Account Settings

1. Verify **Email Verification** status
2. Confirm **Account Status** is Active
3. Review **Role Permissions**

## Creating Additional Admin Users

### Through the Web Interface

1. **Login** as an existing admin user
2. Navigate to **User Management** (when implemented)
3. Click **Create New User**
4. Fill in user details:
   - Email address
   - First and Last name
   - Select **ADMIN** role
   - Set initial password
5. **Send invitation** or provide credentials securely

### Through Database (Advanced)

For direct database access, you can create admin users using Prisma Studio:

```bash
# Open Prisma Studio
npm run db:studio
```

1. Navigate to the **User** table
2. Click **Add Record**
3. Fill in required fields:
   - `email`: Unique email address
   - `password`: Hashed password (use bcryptjs)
   - `firstName` and `lastName`
   - `role`: Select `ADMIN`
   - `isActive`: `true`
   - `emailVerified`: Current timestamp

## Security Recommendations

### Production Environment

#### 🔒 Password Security

- **Change Default Password**: Never use default credentials in production
- **Strong Passwords**: Enforce complex password requirements
- **Password Rotation**: Implement regular password change policies
- **Multi-Factor Authentication**: Consider implementing MFA for admin accounts

#### 🛡️ Access Control

- **Principle of Least Privilege**: Only grant admin access when necessary
- **Regular Audits**: Review admin user list regularly
- **Session Management**: Implement proper session timeouts
- **IP Restrictions**: Consider IP whitelisting for admin access

#### 📊 Monitoring & Logging

- **Login Monitoring**: Track admin login attempts and failures
- **Activity Logging**: Log all admin actions and changes
- **Alert Systems**: Set up alerts for suspicious admin activity
- **Regular Backups**: Maintain secure database backups

### Development Environment

- **Separate Credentials**: Use different admin credentials for dev/staging/prod
- **Environment Isolation**: Keep development data separate from production
- **Secure Storage**: Store credentials in environment variables, not code
- **Team Access**: Provide individual admin accounts for team members

## Troubleshooting

### Common Issues

#### ❌ "Admin user already exists"

**Cause**: The admin user has already been created.

**Solution**: This is normal behavior. The script prevents duplicate users.

```bash
# Check existing users in Prisma Studio
npm run db:studio
```

#### ❌ "Database connection failed"

**Cause**: PostgreSQL is not running or connection string is incorrect.

**Solutions**:
1. Start PostgreSQL service
2. Verify `DATABASE_URL` in `.env.local`
3. Check database credentials and host

```bash
# Test database connection
npm run test:database
```

#### ❌ "Password hashing failed"

**Cause**: bcryptjs dependency issue or insufficient system resources.

**Solutions**:
1. Reinstall dependencies: `npm install`
2. Check Node.js version compatibility
3. Verify system has sufficient memory

#### ❌ "Prisma client not generated"

**Cause**: Prisma client needs to be regenerated after schema changes.

**Solution**:
```bash
npm run db:generate
```

#### ❌ "Migration required"

**Cause**: Database schema is out of sync.

**Solution**:
```bash
npm run db:migrate
```

### Debug Mode

For detailed debugging, you can run the seed script with additional logging:

```bash
# Enable debug mode
DEBUG=* npm run db:seed
```

### Manual Verification

To manually verify the admin user was created correctly:

```bash
# Open Prisma Studio
npm run db:studio

# Or use the test script
npm run test:auth
```

### Getting Help

If you encounter issues not covered here:

1. Check the [main documentation](../README.md)
2. Review the [troubleshooting guide](./troubleshooting.md)
3. Check the application logs
4. Open an issue in the project repository

---

## Next Steps

After setting up your admin user:

1. 📖 Read the [User Management Guide](./user-management.md)
2. 🔧 Configure [WhatsApp Integration](./whatsapp-setup.md)
3. 🚀 Deploy to [Production Environment](./deployment.md)
4. 📊 Set up [Monitoring & Analytics](./monitoring.md)
