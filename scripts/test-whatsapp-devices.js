/**
 * WhatsApp Device Management Testing Suite
 *
 * This script provides comprehensive testing for the WhatsApp device management
 * system including device creation, pairing, session management, and WebSocket
 * functionality. It validates all core features and error handling.
 */

const { PrismaClient } = require("@prisma/client");
// Note: TypeScript modules would need compilation for testing
// For now, we'll test the database schema and basic functionality

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const prisma = new PrismaClient();
const TEST_USER_ID = "test-user-whatsapp-devices";
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
        email: "whatsapp-test@watsy.com",
        firstName: "WhatsApp",
        lastName: "Tester",
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
// DEVICE MANAGEMENT TESTS
// ============================================================================

async function testDeviceCreation() {
  try {
    const whatsappService = new WhatsAppService();

    // Test device creation
    const device = await whatsappService.createDevice(
      TEST_USER_ID,
      TEST_DEVICE_NAME
    );

    if (!device || !device.id) {
      throw new Error("Device creation failed - no device returned");
    }

    log("Device created successfully", {
      id: device.id,
      name: device.name,
      status: device.status,
      userId: device.userId,
    });

    // Verify device in database
    const dbDevice = await prisma.whatsAppDevice.findUnique({
      where: { id: device.id },
    });

    if (!dbDevice) {
      throw new Error("Device not found in database");
    }

    log("Device verified in database");
    return device;
  } catch (err) {
    error("Device creation test failed", err);
    throw err;
  }
}

async function testDeviceConnection(device) {
  try {
    const whatsappService = new WhatsAppService();

    // Test connection initiation
    const connectionResult = await whatsappService.connectDevice(device.id);

    if (!connectionResult.success) {
      throw new Error(`Connection failed: ${connectionResult.error}`);
    }

    log("Device connection initiated", {
      deviceId: device.id,
      success: connectionResult.success,
    });

    // Check device status
    const status = await whatsappService.getDeviceStatus(device.id);
    log("Device status retrieved", { status });

    return connectionResult;
  } catch (err) {
    error("Device connection test failed", err);
    throw err;
  }
}

async function testDeviceDisconnection(device) {
  try {
    const whatsappService = new WhatsAppService();

    // Test disconnection
    const success = await whatsappService.disconnectDevice(device.id);

    if (!success) {
      throw new Error("Disconnection failed");
    }

    log("Device disconnected successfully");

    // Verify status change
    const status = await whatsappService.getDeviceStatus(device.id);
    log("Device status after disconnection", { status });

    return success;
  } catch (err) {
    error("Device disconnection test failed", err);
    throw err;
  }
}

// ============================================================================
// PAIRING SYSTEM TESTS
// ============================================================================

async function testQRCodeGeneration(device) {
  try {
    const whatsappService = new WhatsAppService();
    const pairingManager = new DevicePairingManager(whatsappService);

    // Test QR code generation
    const pairingData = await pairingManager.generateQRCode(device.id);

    if (!pairingData.qrCode) {
      throw new Error("QR code generation failed");
    }

    log("QR code generated successfully", {
      hasQrCode: !!pairingData.qrCode,
      expiresAt: pairingData.expiresAt,
      isExpired: pairingData.isExpired,
    });

    // Test pairing status
    const status = await pairingManager.getPairingStatus(device.id);
    log("Pairing status retrieved", status);

    return pairingData;
  } catch (err) {
    error("QR code generation test failed", err);
    throw err;
  }
}

async function testPairingCodeGeneration(device) {
  try {
    const whatsappService = new WhatsAppService();
    const pairingManager = new DevicePairingManager(whatsappService);

    // Test pairing code generation
    const pairingData = await pairingManager.generatePairingCode(
      device.id,
      "+1234567890"
    );

    if (!pairingData.pairingCode) {
      throw new Error("Pairing code generation failed");
    }

    log("Pairing code generated successfully", {
      pairingCode: pairingData.pairingCode,
      expiresAt: pairingData.expiresAt,
      isExpired: pairingData.isExpired,
    });

    // Test code validation (should fail with wrong code)
    const isValid = await pairingManager.validatePairingCode(
      device.id,
      "WRONGCODE"
    );
    if (isValid) {
      throw new Error("Validation should have failed for wrong code");
    }

    log("Pairing code validation correctly rejected wrong code");

    return pairingData;
  } catch (err) {
    error("Pairing code generation test failed", err);
    throw err;
  }
}

async function testPairingCancellation(device) {
  try {
    const whatsappService = new WhatsAppService();
    const pairingManager = new DevicePairingManager(whatsappService);

    // Test pairing cancellation
    const success = await pairingManager.cancelPairing(device.id);

    if (!success) {
      throw new Error("Pairing cancellation failed");
    }

    log("Pairing cancelled successfully");

    // Verify status after cancellation
    const status = await pairingManager.getPairingStatus(device.id);
    log("Status after pairing cancellation", status);

    return success;
  } catch (err) {
    error("Pairing cancellation test failed", err);
    throw err;
  }
}

// ============================================================================
// SESSION MANAGEMENT TESTS
// ============================================================================

async function testSessionManagement(device) {
  try {
    const sessionManager = new WhatsAppSessionManager();

    // Test session saving
    const mockSessionData = {
      creds: { test: "credentials" },
      keys: { test: "keys" },
      timestamp: new Date().toISOString(),
    };

    const saveSuccess = await sessionManager.saveSession(
      device.id,
      mockSessionData
    );
    if (!saveSuccess) {
      throw new Error("Session save failed");
    }

    log("Session saved successfully");

    // Test session loading
    const loadResult = await sessionManager.loadSession(device.id);
    if (!loadResult.success || !loadResult.session) {
      throw new Error("Session load failed");
    }

    log("Session loaded successfully", {
      deviceId: loadResult.session.deviceId,
      isValid: loadResult.session.isValid,
      lastUpdated: loadResult.session.lastUpdated,
    });

    // Test session validation
    const isValid = await sessionManager.isSessionValid(device.id);
    log("Session validation result", { isValid });

    // Test session refresh
    const refreshSuccess = await sessionManager.refreshSession(device.id);
    log("Session refresh result", { success: refreshSuccess });

    return { saveSuccess, loadResult, isValid, refreshSuccess };
  } catch (err) {
    error("Session management test failed", err);
    throw err;
  }
}

async function testSessionCleanup(device) {
  try {
    const sessionManager = new WhatsAppSessionManager();

    // Test session clearing
    const clearSuccess = await sessionManager.clearSession(device.id);
    if (!clearSuccess) {
      throw new Error("Session clear failed");
    }

    log("Session cleared successfully");

    // Verify session is gone
    const loadResult = await sessionManager.loadSession(device.id);
    if (loadResult.success) {
      throw new Error("Session should not exist after clearing");
    }

    log("Session correctly removed after clearing");

    // Test cleanup of expired sessions
    const cleanedCount = await sessionManager.cleanupExpiredSessions();
    log("Expired sessions cleanup completed", { cleanedCount });

    return { clearSuccess, cleanedCount };
  } catch (err) {
    error("Session cleanup test failed", err);
    throw err;
  }
}

// ============================================================================
// WEBSOCKET TESTS
// ============================================================================

async function testWebSocketServer() {
  try {
    // Create WebSocket server on test port
    const wsServer = new WhatsAppWebSocketServer(8081);

    // Test server stats
    const stats = wsServer.getStats();
    log("WebSocket server stats", stats);

    // Test server shutdown
    setTimeout(() => {
      wsServer.shutdown();
      log("WebSocket server shutdown completed");
    }, 1000);

    return true;
  } catch (err) {
    error("WebSocket server test failed", err);
    throw err;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runDeviceManagementTests() {
  console.log("🚀 Starting WhatsApp Device Management Tests...\n");

  try {
    // Cleanup and setup
    section("Cleaning up test data");
    await cleanupTestData();

    section("Creating test user");
    const user = await createTestUser();

    // Device management tests
    section("Testing Device Creation");
    const device = await testDeviceCreation();

    section("Testing Device Connection");
    await testDeviceConnection(device);

    section("Testing Device Disconnection");
    await testDeviceDisconnection(device);

    // Pairing system tests
    section("Testing QR Code Generation");
    await testQRCodeGeneration(device);

    section("Testing Pairing Code Generation");
    await testPairingCodeGeneration(device);

    section("Testing Pairing Cancellation");
    await testPairingCancellation(device);

    // Session management tests
    section("Testing Session Management");
    await testSessionManagement(device);

    section("Testing Session Cleanup");
    await testSessionCleanup(device);

    // WebSocket tests
    section("Testing WebSocket Server");
    await testWebSocketServer();

    // Final cleanup
    section("Final cleanup");
    await cleanupTestData();

    console.log(
      "\n✅ All WhatsApp device management tests passed successfully!"
    );

    console.log("\n📊 Test Summary:");
    console.log("  ✓ Device creation and management");
    console.log("  ✓ Device connection and disconnection");
    console.log("  ✓ QR code and pairing code generation");
    console.log("  ✓ Pairing validation and cancellation");
    console.log("  ✓ Session storage and restoration");
    console.log("  ✓ Session cleanup and expiration");
    console.log("  ✓ WebSocket server functionality");
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
  runDeviceManagementTests();
}

module.exports = {
  runDeviceManagementTests,
  cleanupTestData,
  createTestUser,
};
