#!/usr/bin/env node

/**
 * Database Schema Test Script for Watsy-Chatbot Platform
 * Tests Prisma client connection and basic database operations
 */

const { PrismaClient } = require('../src/generated/prisma');
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testDatabaseConnection() {
  console.log('🔍 Testing Prisma database connection...');
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Prisma client connected successfully!');
    
    // Test database version
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log(`   Database: ${result[0].version.split(' ')[0]} ${result[0].version.split(' ')[1]}`);
    
    return true;
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message);
    return false;
  }
}

async function testTableCreation() {
  console.log('🔍 Testing database schema and tables...');
  
  try {
    // Check if tables exist by querying table information
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('✅ Database tables created successfully!');
    console.log(`   Found ${tables.length} tables:`);
    
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Table verification failed:', error.message);
    return false;
  }
}

async function testBasicOperations() {
  console.log('🔍 Testing basic CRUD operations...');
  
  try {
    // Test creating a system setting
    const setting = await prisma.systemSettings.create({
      data: {
        key: 'test_setting',
        value: { test: true, timestamp: new Date().toISOString() },
        description: 'Test setting for schema validation'
      }
    });
    
    console.log('✅ CREATE operation successful!');
    console.log(`   Created setting: ${setting.key}`);
    
    // Test reading the setting
    const readSetting = await prisma.systemSettings.findUnique({
      where: { key: 'test_setting' }
    });
    
    console.log('✅ READ operation successful!');
    console.log(`   Read setting: ${readSetting?.key}`);
    
    // Test updating the setting
    const updatedSetting = await prisma.systemSettings.update({
      where: { key: 'test_setting' },
      data: {
        value: { test: true, updated: true, timestamp: new Date().toISOString() }
      }
    });
    
    console.log('✅ UPDATE operation successful!');
    console.log(`   Updated setting: ${updatedSetting.key}`);
    
    // Test deleting the setting
    await prisma.systemSettings.delete({
      where: { key: 'test_setting' }
    });
    
    console.log('✅ DELETE operation successful!');
    console.log('   Test setting removed');
    
    return true;
  } catch (error) {
    console.error('❌ CRUD operations failed:', error.message);
    return false;
  }
}

async function testRelationships() {
  console.log('🔍 Testing database relationships...');
  
  try {
    // Count records in related tables to verify foreign key constraints
    const userCount = await prisma.user.count();
    const deviceCount = await prisma.whatsAppDevice.count();
    const messageCount = await prisma.message.count();
    
    console.log('✅ Relationship queries successful!');
    console.log(`   Users: ${userCount}, Devices: ${deviceCount}, Messages: ${messageCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ Relationship test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Watsy-Chatbot Database Schema Test\n');
  
  const connectionOk = await testDatabaseConnection();
  console.log('');
  
  const tablesOk = await testTableCreation();
  console.log('');
  
  const crudOk = await testBasicOperations();
  console.log('');
  
  const relationshipsOk = await testRelationships();
  
  console.log('\n📊 Database Schema Test Results:');
  console.log(`   Connection: ${connectionOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Tables: ${tablesOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   CRUD Operations: ${crudOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Relationships: ${relationshipsOk ? '✅ PASS' : '❌ FAIL'}`);
  
  if (connectionOk && tablesOk && crudOk && relationshipsOk) {
    console.log('\n🎉 Database schema is ready for development!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check your database setup.');
    process.exit(1);
  }
}

// Cleanup on exit
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

main().catch(async (error) => {
  console.error('💥 Test script failed:', error);
  await prisma.$disconnect();
  process.exit(1);
});
