// MongoDB Connection Diagnostic Tool
// This script analyzes the MongoDB connection string without exposing credentials

import dotenv from 'dotenv';
import dns from 'dns';
import { promisify } from 'util';

dotenv.config();

const resolveSrv = promisify(dns.resolveSrv);
const resolve4 = promisify(dns.resolve4);

const uri = process.env.MONGODB_URI;

console.log('🔍 MongoDB Connection Diagnostic\n');
console.log('=' .repeat(60));

// 1. Check if URI exists
if (!uri) {
  console.log('❌ MONGODB_URI is not set in .env file');
  process.exit(1);
}

// 2. Parse URI structure
const uriRegex = /^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)(\?.*)?$/;
const match = uri.match(uriRegex);

if (!match) {
  console.log('❌ Invalid MongoDB URI format');
  console.log('   Expected: mongodb+srv://username:password@host/database?options');
  process.exit(1);
}

const [, username, password, hostname, database, queryString] = match;

console.log('✅ URI Structure: Valid\n');
console.log('📋 Connection Details (sanitized):');
console.log('   Protocol:  mongodb+srv');
console.log(`   Username:  ${username}`);
console.log(`   Password:  ${password === '<YOUR_PASSWORD>' ? '❌ PLACEHOLDER - NOT CONFIGURED' : '✅ [Set - length: ' + password.length + ']'}`);
console.log(`   Hostname:  ${hostname}`);
console.log(`   Database:  ${database}`);
console.log(`   Options:   ${queryString || 'none'}`);
console.log();

// 3. Check for placeholder password
if (password === '<YOUR_PASSWORD>' || password.includes('<') || password.includes('>')) {
  console.log('❌ CRITICAL ERROR: Password is still a placeholder!');
  console.log('   Current value: <YOUR_PASSWORD>');
  console.log('\n🔧 TO FIX:');
  console.log('   1. Go to https://cloud.mongodb.com/');
  console.log('   2. Sign in with your MongoDB Atlas account');
  console.log('   3. Navigate to: Database Access → Database Users');
  console.log('   4. Find user: ' + username);
  console.log('   5. If you forgot password: Click "Edit" → "Edit Password"');
  console.log('   6. Copy your actual password');
  console.log('   7. Replace <YOUR_PASSWORD> in server/.env with the real password');
  console.log('   8. Restart the server\n');
  process.exit(1);
}

console.log('✅ Password: Configured (not a placeholder)\n');

// 4. Test DNS resolution for MongoDB Atlas
console.log('🌐 Testing DNS Resolution...');
try {
  const srvRecord = `_mongodb._tcp.${hostname}`;
  console.log(`   Resolving: ${srvRecord}`);
  
  const records = await resolveSrv(srvRecord);
  
  if (records && records.length > 0) {
    console.log(`✅ DNS SRV Record Found: ${records.length} server(s)`);
    records.forEach((record, i) => {
      console.log(`   Server ${i + 1}: ${record.name}:${record.port} (priority: ${record.priority})`);
    });
    console.log();
    
    // Try to resolve the actual server IPs
    console.log('🌐 Resolving Server IPs...');
    for (const record of records.slice(0, 2)) {
      try {
        const ips = await resolve4(record.name);
        console.log(`✅ ${record.name} → ${ips.join(', ')}`);
      } catch (err) {
        console.log(`❌ ${record.name} → DNS resolution failed`);
      }
    }
    console.log();
  } else {
    console.log('❌ No SRV records found');
  }
} catch (err) {
  console.log(`❌ DNS Resolution Failed: ${err.message}`);
  console.log('\n⚠️  POSSIBLE CAUSES:');
  console.log('   1. Network firewall blocking DNS queries');
  console.log('   2. Corporate proxy blocking MongoDB Atlas');
  console.log('   3. DNS server not responding');
  console.log('   4. MongoDB cluster hostname is incorrect');
  console.log('\n🔧 TROUBLESHOOTING:');
  console.log('   1. Check if you can access: https://cloud.mongodb.com/');
  console.log('   2. Try: ping ' + hostname);
  console.log('   3. Check network/firewall settings');
  console.log('   4. Verify cluster hostname in MongoDB Atlas dashboard\n');
}

// 5. Attempt actual connection
console.log('🔌 Attempting MongoDB Connection...');
try {
  const mongoose = await import('mongoose');
  
  const conn = await mongoose.default.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  
  console.log('✅ MongoDB Connection: SUCCESS!');
  console.log(`   Connected to: ${conn.connection.host}`);
  console.log(`   Database: ${conn.connection.name}`);
  console.log(`   Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
  
  await conn.connection.close();
  console.log('\n✅ All checks passed! MongoDB is properly configured.\n');
  process.exit(0);
} catch (err) {
  console.log(`❌ Connection Failed: ${err.message}`);
  
  if (err.message.includes('authentication failed')) {
    console.log('\n❌ AUTHENTICATION ERROR:');
    console.log('   Username or password is incorrect');
    console.log('\n🔧 TO FIX:');
    console.log('   1. Go to MongoDB Atlas → Database Access');
    console.log('   2. Verify username: ' + username);
    console.log('   3. Reset password if needed');
    console.log('   4. Update MONGODB_URI in server/.env');
  } else if (err.message.includes('ECONNREFUSED') || err.message.includes('querySrv')) {
    console.log('\n❌ NETWORK/DNS ERROR:');
    console.log('   Cannot reach MongoDB Atlas servers');
    console.log('\n🔧 POSSIBLE SOLUTIONS:');
    console.log('   1. Check firewall/network settings');
    console.log('   2. Use VPN if corporate network blocks MongoDB');
    console.log('   3. Add your IP to Atlas Network Access whitelist');
    console.log('   4. Use MongoDB connection string with direct hosts instead of SRV');
  } else if (err.message.includes('IP') || err.message.includes('whitelist')) {
    console.log('\n❌ IP WHITELIST ERROR:');
    console.log('   Your IP address is not whitelisted in MongoDB Atlas');
    console.log('\n🔧 TO FIX:');
    console.log('   1. Go to MongoDB Atlas → Network Access');
    console.log('   2. Click "Add IP Address"');
    console.log('   3. Either add current IP or use 0.0.0.0/0 (allow all - for development only)');
  }
  
  console.log('\n');
  process.exit(1);
}
