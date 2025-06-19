/**
 * Authentication Flow Test Script
 *
 * This script tests the complete authentication flow including:
 * - User registration
 * - User login
 * - Token validation
 * - Password hashing verification
 * - Database operations
 */

const { PrismaClient } = require("../src/generated/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const prisma = new PrismaClient();

// Test configuration
const TEST_USER = {
  email: "test@watsy.com",
  password: "TestPassword123!",
  firstName: "Test",
  lastName: "User",
};

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(message, data = null) {
  console.log(`✓ ${message}`);
  if (data) {
    console.log("  ", JSON.stringify(data, null, 2));
  }
}

function error(message, err = null) {
  console.error(`✗ ${message}`);
  if (err) {
    console.error("  ", err.message || err);
  }
}

async function cleanup() {
  try {
    // Delete test user if exists
    await prisma.user.deleteMany({
      where: { email: TEST_USER.email },
    });
    log("Cleaned up test data");
  } catch (err) {
    // Ignore cleanup errors
  }
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testPasswordHashing() {
  console.log("\n🔐 Testing Password Hashing...");

  try {
    // Test password hashing
    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(TEST_USER.password, salt);

    log("Password hashed successfully", {
      original: TEST_USER.password,
      hashed: hashedPassword.substring(0, 20) + "...",
      saltRounds,
    });

    // Test password verification
    const isValid = await bcrypt.compare(TEST_USER.password, hashedPassword);
    const isInvalid = await bcrypt.compare("wrongpassword", hashedPassword);

    if (isValid && !isInvalid) {
      log("Password verification working correctly");
    } else {
      error("Password verification failed");
      return false;
    }

    return hashedPassword;
  } catch (err) {
    error("Password hashing test failed", err);
    return false;
  }
}

async function testJWTTokens() {
  console.log("\n🎫 Testing JWT Tokens...");

  try {
    if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
      error("JWT secrets not configured");
      return false;
    }

    // Test access token
    const accessPayload = {
      userId: "test-user-id",
      email: TEST_USER.email,
      role: "USER",
      firstName: TEST_USER.firstName,
      lastName: TEST_USER.lastName,
    };

    const accessToken = jwt.sign(accessPayload, JWT_SECRET, {
      expiresIn: "15m",
      issuer: "watsy-chatbot",
      audience: "watsy-users",
    });

    log("Access token generated", {
      token: accessToken.substring(0, 50) + "...",
      payload: accessPayload,
    });

    // Verify access token
    const decodedAccess = jwt.verify(accessToken, JWT_SECRET, {
      issuer: "watsy-chatbot",
      audience: "watsy-users",
    });

    log("Access token verified successfully", {
      userId: decodedAccess.userId,
      email: decodedAccess.email,
      exp: new Date(decodedAccess.exp * 1000).toISOString(),
    });

    // Test refresh token
    const refreshPayload = {
      userId: "test-user-id",
    };

    const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, {
      expiresIn: "7d",
      issuer: "watsy-chatbot",
      audience: "watsy-refresh",
    });

    log("Refresh token generated");

    // Verify refresh token
    const decodedRefresh = jwt.verify(refreshToken, JWT_REFRESH_SECRET, {
      issuer: "watsy-chatbot",
      audience: "watsy-refresh",
    });

    log("Refresh token verified successfully", {
      userId: decodedRefresh.userId,
      exp: new Date(decodedRefresh.exp * 1000).toISOString(),
    });

    return { accessToken, refreshToken };
  } catch (err) {
    error("JWT token test failed", err);
    return false;
  }
}

async function testUserRegistration() {
  console.log("\n👤 Testing User Registration...");

  try {
    const hashedPassword = await testPasswordHashing();
    if (!hashedPassword) return false;

    // Create test user
    const emailVerificationToken = randomBytes(32).toString("hex");

    const user = await prisma.user.create({
      data: {
        email: TEST_USER.email,
        password: hashedPassword,
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
        emailVerificationToken,
        role: "USER",
        subscription: {
          create: {
            plan: "FREE",
            status: "ACTIVE",
          },
        },
      },
      include: {
        subscription: true,
      },
    });

    log("User created successfully", {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      subscription: user.subscription?.plan,
    });

    return user;
  } catch (err) {
    error("User registration test failed", err);
    return false;
  }
}

async function testUserLogin() {
  console.log("\n🔑 Testing User Login...");

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: TEST_USER.email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      error("Test user not found");
      return false;
    }

    log("User found in database", {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
    });

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      TEST_USER.password,
      user.password
    );
    if (!isPasswordValid) {
      error("Password verification failed");
      return false;
    }

    log("Password verified successfully");

    // Generate tokens
    const tokens = await testJWTTokens();
    if (!tokens) return false;

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    log("Login simulation completed successfully");

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens,
    };
  } catch (err) {
    error("User login test failed", err);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log("\n🗄️  Testing Database Connection...");

  try {
    // Test basic connection
    await prisma.$connect();
    log("Database connected successfully");

    // Test query
    const userCount = await prisma.user.count();
    log("Database query executed", { userCount });

    return true;
  } catch (err) {
    error("Database connection test failed", err);
    return false;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runTests() {
  console.log("🚀 Starting Authentication Flow Tests...\n");

  try {
    // Cleanup before starting
    await cleanup();

    // Run tests
    const dbTest = await testDatabaseConnection();
    if (!dbTest) return;

    const passwordTest = await testPasswordHashing();
    if (!passwordTest) return;

    const jwtTest = await testJWTTokens();
    if (!jwtTest) return;

    const registrationTest = await testUserRegistration();
    if (!registrationTest) return;

    const loginTest = await testUserLogin();
    if (!loginTest) return;

    console.log("\n✅ All authentication tests passed successfully!");

    // Show summary
    console.log("\n📊 Test Summary:");
    console.log("  ✓ Database connection");
    console.log("  ✓ Password hashing and verification");
    console.log("  ✓ JWT token generation and verification");
    console.log("  ✓ User registration with subscription");
    console.log("  ✓ User login simulation");
  } catch (err) {
    error("Test runner failed", err);
  } finally {
    // Cleanup after tests
    await cleanup();
    await prisma.$disconnect();
    console.log("\n🧹 Cleanup completed");
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testPasswordHashing,
  testJWTTokens,
  testUserRegistration,
  testUserLogin,
  testDatabaseConnection,
};
