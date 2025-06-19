#!/usr/bin/env node

/**
 * Connection Test Script for Watsy-Chatbot Development Environment
 * Tests PostgreSQL and Redis connections using environment variables
 */

const { Client } = require('pg');
const redis = require('redis');
require('dotenv').config({ path: '.env.local' });

async function testPostgreSQL() {
  console.log('🔍 Testing PostgreSQL connection...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ PostgreSQL connected successfully!');
    console.log(`   Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    
    // Test database exists
    const dbResult = await client.query('SELECT current_database()');
    console.log(`   Database: ${dbResult.rows[0].current_database}`);
    
    await client.end();
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  }
  
  return true;
}

async function testRedis() {
  console.log('🔍 Testing Redis connection...');
  
  const client = redis.createClient({
    url: process.env.REDIS_URL,
  });

  try {
    await client.connect();
    const pong = await client.ping();
    console.log('✅ Redis connected successfully!');
    console.log(`   Response: ${pong}`);
    
    // Test set/get operation
    await client.set('test:connection', 'success');
    const value = await client.get('test:connection');
    console.log(`   Test operation: ${value}`);
    
    // Clean up test key
    await client.del('test:connection');
    
    await client.disconnect();
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    return false;
  }
  
  return true;
}

async function main() {
  console.log('🚀 Watsy-Chatbot Development Environment Connection Test\n');
  
  // Check environment variables
  console.log('📋 Environment Configuration:');
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   REDIS_URL: ${process.env.REDIS_URL ? '✅ Set' : '❌ Missing'}`);
  console.log('');
  
  const postgresOk = await testPostgreSQL();
  console.log('');
  const redisOk = await testRedis();
  
  console.log('\n📊 Connection Test Results:');
  console.log(`   PostgreSQL: ${postgresOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Redis: ${redisOk ? '✅ PASS' : '❌ FAIL'}`);
  
  if (postgresOk && redisOk) {
    console.log('\n🎉 All services are ready for development!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some services failed. Please check your Docker setup.');
    process.exit(1);
  }
}

main().catch(console.error);
