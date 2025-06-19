/**
 * Prisma Database Seeding Script
 * 
 * This script initializes the database with essential data including:
 * - Default Admin user for system administration
 * - Initial configuration data
 * 
 * Usage: npm run db:seed
 */

import { PrismaClient, UserRole } from '../src/generated/prisma'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Default Admin User Configuration
const DEFAULT_ADMIN = {
  email: 'admin@watsy-chatbot.com',
  password: 'Admin123!@#',
  firstName: 'System',
  lastName: 'Administrator',
  role: UserRole.ADMIN,
  isActive: true,
  emailVerified: new Date()
} as const

/**
 * Hash password using bcryptjs (consistent with auth system)
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Create default admin user if it doesn't exist
 */
async function createDefaultAdmin() {
  console.log('🔍 Checking for existing admin user...')
  
  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: DEFAULT_ADMIN.email }
  })

  if (existingAdmin) {
    console.log(`✅ Admin user already exists: ${DEFAULT_ADMIN.email}`)
    console.log(`   - User ID: ${existingAdmin.id}`)
    console.log(`   - Role: ${existingAdmin.role}`)
    console.log(`   - Active: ${existingAdmin.isActive}`)
    console.log(`   - Email Verified: ${existingAdmin.emailVerified ? 'Yes' : 'No'}`)
    return existingAdmin
  }

  console.log('🔐 Hashing admin password...')
  const hashedPassword = await hashPassword(DEFAULT_ADMIN.password)

  console.log('👤 Creating default admin user...')
  const adminUser = await prisma.user.create({
    data: {
      email: DEFAULT_ADMIN.email,
      password: hashedPassword,
      firstName: DEFAULT_ADMIN.firstName,
      lastName: DEFAULT_ADMIN.lastName,
      role: DEFAULT_ADMIN.role,
      isActive: DEFAULT_ADMIN.isActive,
      emailVerified: DEFAULT_ADMIN.emailVerified
    }
  })

  console.log('✅ Default admin user created successfully!')
  console.log(`   - Email: ${adminUser.email}`)
  console.log(`   - User ID: ${adminUser.id}`)
  console.log(`   - Role: ${adminUser.role}`)
  console.log(`   - Created: ${adminUser.createdAt}`)
  
  return adminUser
}

/**
 * Verify admin user can authenticate
 */
async function verifyAdminUser(userId: string) {
  console.log('🔍 Verifying admin user authentication...')
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
      isActive: true,
      emailVerified: true
    }
  })

  if (!user) {
    throw new Error('Admin user not found after creation')
  }

  // Verify password hash
  const isPasswordValid = await bcrypt.compare(DEFAULT_ADMIN.password, user.password)
  if (!isPasswordValid) {
    throw new Error('Password verification failed')
  }

  console.log('✅ Admin user authentication verified')
  return true
}

/**
 * Main seeding function
 */
async function main() {
  console.log('🌱 Starting database seeding...')
  console.log('=====================================')
  
  try {
    // Create default admin user
    const adminUser = await createDefaultAdmin()
    
    // Verify the admin user
    await verifyAdminUser(adminUser.id)
    
    console.log('=====================================')
    console.log('🎉 Database seeding completed successfully!')
    console.log('')
    console.log('📋 ADMIN LOGIN CREDENTIALS:')
    console.log(`   Email: ${DEFAULT_ADMIN.email}`)
    console.log(`   Password: ${DEFAULT_ADMIN.password}`)
    console.log('')
    console.log('⚠️  SECURITY NOTICE:')
    console.log('   Please change the default password after first login!')
    console.log('   See docs/admin-setup.md for security recommendations.')
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    throw error
  }
}

/**
 * Cleanup function
 */
async function cleanup() {
  await prisma.$disconnect()
}

// Execute seeding
main()
  .catch((error) => {
    console.error('💥 Fatal error during seeding:', error)
    process.exit(1)
  })
  .finally(cleanup)
