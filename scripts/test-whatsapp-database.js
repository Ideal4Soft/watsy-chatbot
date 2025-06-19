/**
 * WhatsApp Database Schema Testing Suite
 *
 * This script tests the database schema and basic CRUD operations
 * for the WhatsApp device management system.
 */

const { PrismaClient } = require("../src/generated/prisma");

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const prisma = new PrismaClient();
const TEST_USER_ID = "test-user-whatsapp-db";
const TEST_DEVICE_NAME = "Test WhatsApp Device";

// Logging utilities
const log = (message, data = null) => {
  console.log(`✓ ${message}`);
  if (data) {
    console.log("  ", JSON.stringify(data, null, 2));
  }
};

const error = (message, err = null) => {
  console.error(`✗ ${message}`);
  if (err) {
    console.error("  ", err);
  }
};

const section = (title) => {
  console.log(`\n🔧 ${title}...`);
};

// ============================================================================
// CLEANUP UTILITIES
// ============================================================================

async function cleanupTestData() {
  try {
    // Remove test devices
    await prisma.whatsAppDevice.deleteMany({
      where: {
        OR: [{ userId: TEST_USER_ID }, { name: { contains: "Test" } }],
      },
    });

    // Remove test user if exists
    await prisma.user.deleteMany({
      where: { id: TEST_USER_ID },
    });

    log("Cleaned up test data");
  } catch (err) {
    error("Failed to cleanup test data", err);
  }
}

// ============================================================================
// TEST USER SETUP
// ============================================================================

async function createTestUser() {
  try {
    const user = await prisma.user.create({
      data: {
        id: TEST_USER_ID,
        email: "whatsapp-db-test@watsy.com",
        firstName: "WhatsApp",
        lastName: "DB Tester",
        password: "hashed_password_placeholder",
        emailVerified: new Date(),
        subscription: {
          create: {
            plan: "FREE",
            status: "ACTIVE",
          },
        },
      },
    });

    log("Test user created", {
      id: user.id,
      email: user.email,
    });

    return user;
  } catch (err) {
    error("Failed to create test user", err);
    throw err;
  }
}

// ============================================================================
// DATABASE SCHEMA TESTS
// ============================================================================

async function testDeviceCreation() {
  try {
    // Test WhatsApp device creation
    const device = await prisma.whatsAppDevice.create({
      data: {
        userId: TEST_USER_ID,
        name: TEST_DEVICE_NAME,
        status: "DISCONNECTED",
      },
    });

    if (!device || !device.id) {
      throw new Error("Device creation failed - no device returned");
    }

    log("Device created successfully", {
      id: device.id,
      name: device.name,
      status: device.status,
      userId: device.userId,
    });

    return device;
  } catch (err) {
    error("Device creation test failed", err);
    throw err;
  }
}

async function testDeviceUpdates(device) {
  try {
    // Test device status update
    const updatedDevice = await prisma.whatsAppDevice.update({
      where: { id: device.id },
      data: {
        status: "CONNECTING",
        phoneNumber: "+1234567890",
        lastConnectedAt: new Date(),
      },
    });

    log("Device updated successfully", {
      id: updatedDevice.id,
      status: updatedDevice.status,
      phoneNumber: updatedDevice.phoneNumber,
      lastConnectedAt: updatedDevice.lastConnectedAt,
    });

    // Test session data update
    const sessionData = {
      creds: { test: "credentials" },
      keys: { test: "keys" },
      timestamp: new Date().toISOString(),
    };

    const deviceWithSession = await prisma.whatsAppDevice.update({
      where: { id: device.id },
      data: {
        sessionData: sessionData,
        qrCode: "data:image/png;base64,test-qr-code",
        qrCodeExpires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    log("Device session data updated", {
      id: deviceWithSession.id,
      hasSessionData: !!deviceWithSession.sessionData,
      hasQrCode: !!deviceWithSession.qrCode,
      qrCodeExpires: deviceWithSession.qrCodeExpires,
    });

    return updatedDevice;
  } catch (err) {
    error("Device update test failed", err);
    throw err;
  }
}

async function testDeviceQueries(device) {
  try {
    // Test finding device by ID
    const foundDevice = await prisma.whatsAppDevice.findUnique({
      where: { id: device.id },
    });

    if (!foundDevice) {
      throw new Error("Device not found by ID");
    }

    log("Device found by ID", {
      id: foundDevice.id,
      name: foundDevice.name,
    });

    // Test finding devices by user
    const userDevices = await prisma.whatsAppDevice.findMany({
      where: { userId: TEST_USER_ID },
      orderBy: { createdAt: "desc" },
    });

    log("User devices retrieved", {
      count: userDevices.length,
      devices: userDevices.map((d) => ({
        id: d.id,
        name: d.name,
        status: d.status,
      })),
    });

    // Test device count
    const deviceCount = await prisma.whatsAppDevice.count({
      where: { userId: TEST_USER_ID },
    });

    log("Device count retrieved", { count: deviceCount });

    return userDevices;
  } catch (err) {
    error("Device query test failed", err);
    throw err;
  }
}

async function testRelatedModels(device) {
  try {
    // Test creating a contact for the device
    const contact = await prisma.contact.create({
      data: {
        deviceId: device.id,
        phoneNumber: "+9876543210",
        name: "Test Contact",
        messageCount: 5,
        lastMessageAt: new Date(),
      },
    });

    log("Contact created for device", {
      id: contact.id,
      phoneNumber: contact.phoneNumber,
      name: contact.name,
      deviceId: contact.deviceId,
    });

    // Test creating a message
    const message = await prisma.message.create({
      data: {
        deviceId: device.id,
        userId: TEST_USER_ID,
        type: "TEXT",
        content: "Test message content",
        fromNumber: "+1234567890",
        toNumber: "+9876543210",
        fromName: "Test Sender",
        toName: "Test Recipient",
        direction: "OUTGOING",
        status: "SENT",
        sentAt: new Date(),
      },
    });

    log("Message created for device", {
      id: message.id,
      type: message.type,
      content: message.content,
      direction: message.direction,
      status: message.status,
    });

    // Test querying device with related data
    const deviceWithRelations = await prisma.whatsAppDevice.findUnique({
      where: { id: device.id },
      include: {
        contacts: true,
        messages: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    log("Device with relations retrieved", {
      id: deviceWithRelations.id,
      contactsCount: deviceWithRelations.contacts.length,
      messagesCount: deviceWithRelations.messages.length,
      user: deviceWithRelations.user,
    });

    return { contact, message };
  } catch (err) {
    error("Related models test failed", err);
    throw err;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runDatabaseTests() {
  console.log("🚀 Starting WhatsApp Database Schema Tests...\n");

  try {
    // Cleanup and setup
    section("Cleaning up test data");
    await cleanupTestData();

    section("Creating test user");
    const user = await createTestUser();

    // Database schema tests
    section("Testing Device Creation");
    const device = await testDeviceCreation();

    section("Testing Device Updates");
    await testDeviceUpdates(device);

    section("Testing Device Queries");
    await testDeviceQueries(device);

    section("Testing Related Models");
    await testRelatedModels(device);

    // Final cleanup
    section("Final cleanup");
    await cleanupTestData();

    console.log("\n✅ All database schema tests passed successfully!");

    console.log("\n📊 Test Summary:");
    console.log("  ✓ User creation with subscription");
    console.log("  ✓ WhatsApp device CRUD operations");
    console.log("  ✓ Device status and session updates");
    console.log("  ✓ Device queries and filtering");
    console.log("  ✓ Contact and message relationships");
    console.log("  ✓ Complex queries with relations");
  } catch (err) {
    error("Test suite failed", err);

    // Cleanup on failure
    try {
      await cleanupTestData();
    } catch (cleanupErr) {
      error("Cleanup after failure also failed", cleanupErr);
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runDatabaseTests();
}

module.exports = {
  runDatabaseTests,
  cleanupTestData,
  createTestUser,
};
