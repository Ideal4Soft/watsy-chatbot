# Troubleshooting Guide

This guide covers common issues and solutions for the Watsy-Chatbot platform.

## Table of Contents

- [Database Issues](#database-issues)
- [Authentication Problems](#authentication-problems)
- [Development Environment](#development-environment)
- [Build and Deployment](#build-and-deployment)
- [WhatsApp Integration](#whatsapp-integration)

## Database Issues

### Connection Problems

#### ❌ "Database connection failed"

**Symptoms:**
- Cannot connect to PostgreSQL
- Prisma client errors
- Database timeout errors

**Solutions:**

1. **Check PostgreSQL Service**
   ```bash
   # Start Docker services
   docker-compose up -d
   
   # Check service status
   docker-compose ps
   ```

2. **Verify Environment Variables**
   ```bash
   # Check .env.local file
   cat .env.local | grep DATABASE_URL
   ```

3. **Test Connection**
   ```bash
   npm run test:connections
   ```

#### ❌ "Prisma client not generated"

**Symptoms:**
- Import errors for Prisma client
- Type errors in database operations

**Solutions:**
```bash
# Generate Prisma client
npm run db:generate

# Apply migrations
npm run db:migrate
```

### Migration Issues

#### ❌ "Migration failed"

**Solutions:**
```bash
# Reset database (⚠️ DESTRUCTIVE)
npm run db:reset

# Or manually fix migrations
npx prisma migrate reset
npx prisma migrate dev
```

## Authentication Problems

### Login Issues

#### ❌ "Invalid credentials"

**Common Causes:**
- Incorrect email/password
- User account not active
- Database seeding not completed

**Solutions:**

1. **Verify Admin User Exists**
   ```bash
   npm run db:studio
   # Check Users table for admin@watsy-chatbot.com
   ```

2. **Re-seed Database**
   ```bash
   npm run db:seed
   ```

3. **Check Default Credentials**
   - Email: `admin@watsy-chatbot.com`
   - Password: `Admin123!@#`

#### ❌ "JWT token errors"

**Symptoms:**
- "Invalid token" errors
- Automatic logout
- Authentication middleware failures

**Solutions:**

1. **Check Environment Variables**
   ```bash
   # Verify JWT secrets are set
   echo $JWT_SECRET
   echo $JWT_REFRESH_SECRET
   ```

2. **Clear Browser Storage**
   - Clear cookies and localStorage
   - Try incognito/private browsing

### Session Problems

#### ❌ "Session expired immediately"

**Causes:**
- Clock synchronization issues
- Invalid JWT configuration
- Browser security settings

**Solutions:**
1. Check system time synchronization
2. Verify JWT expiration settings
3. Check browser security settings

## Development Environment

### Node.js Issues

#### ❌ "Module not found" errors

**Solutions:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
```

#### ❌ "TypeScript compilation errors"

**Solutions:**
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Regenerate types
npm run db:generate
```

### Docker Issues

#### ❌ "Port already in use"

**Solutions:**
```bash
# Check what's using the port
netstat -tulpn | grep :5433

# Stop conflicting services
docker-compose down

# Use different ports in docker-compose.yml
```

#### ❌ "Docker service won't start"

**Solutions:**
```bash
# Check Docker logs
docker-compose logs [service-name]

# Restart Docker Desktop
# Or restart Docker daemon on Linux
```

## Build and Deployment

### Build Failures

#### ❌ "Build failed with TypeScript errors"

**Solutions:**
```bash
# Fix TypeScript errors
npm run lint
npx tsc --noEmit

# Check for missing dependencies
npm install
```

#### ❌ "CSS/Tailwind issues"

**Solutions:**
```bash
# Regenerate Tailwind CSS
rm -rf .next
npm run dev

# Check Tailwind configuration
npx tailwindcss --help
```

### Performance Issues

#### ❌ "Slow build times"

**Solutions:**
- Use Turbopack: `npm run dev` (already enabled)
- Clear build cache: `rm -rf .next`
- Check for large dependencies

## WhatsApp Integration

### Connection Issues

#### ❌ "WhatsApp connection failed"

**Common Causes:**
- Invalid session data
- Rate limiting
- WhatsApp account restrictions

**Solutions:**

1. **Clear Session Data**
   ```bash
   # Reset WhatsApp sessions
   npm run db:studio
   # Clear whatsAppDevices table
   ```

2. **Check Rate Limits**
   - Wait before retrying
   - Verify rate limiting configuration

3. **Verify Account Status**
   - Check if WhatsApp account is active
   - Ensure account is not banned

### QR Code Issues

#### ❌ "QR code not generating"

**Solutions:**
1. Check WebSocket connection
2. Verify device creation process
3. Clear browser cache

#### ❌ "QR code expired"

**Solutions:**
1. Generate new QR code
2. Check QR code expiration settings
3. Ensure stable internet connection

## Getting Additional Help

### Debug Mode

Enable debug logging for detailed information:

```bash
# Enable debug mode
DEBUG=* npm run dev

# Or for specific modules
DEBUG=prisma:* npm run dev
```

### Log Analysis

Check application logs:

```bash
# Docker logs
docker-compose logs -f

# Application logs
tail -f logs/application.log
```

### Community Support

1. **GitHub Issues**: Report bugs and request features
2. **Discussions**: Ask questions and share solutions
3. **Documentation**: Check all documentation files
4. **Stack Overflow**: Search for similar issues

### Professional Support

For production environments or complex issues:

1. Review [deployment documentation](./deployment.md)
2. Consider professional support services
3. Implement proper monitoring and alerting

---

**Need more help?** Check the [main documentation](../README.md) or open an issue in the repository.
