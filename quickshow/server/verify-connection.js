// Quick MongoDB Connection Verification
// Run this after updating the password in .env

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const uri = process.env.MONGODB_URI;

console.log('\n🔍 MongoDB Connection Verification\n');

if (!uri) {
  console.log('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

// Check for placeholder
if (uri.includes('<YOUR_PASSWORD>') || uri.includes('<') || uri.includes('>')) {
  console.log('❌ Password is still a placeholder!');
  console.log('   Please replace <YOUR_PASSWORD> with your actual MongoDB Atlas password');
  console.log('\n📝 Steps:');
  console.log('   1. Go to https://cloud.mongodb.com/');
  console.log('   2. Navigate to: Database Access → aj386092_db_user');
  console.log('   3. Click "Edit" → "Edit Password"');
  console.log('   4. Copy the password');
  console.log('   5. Edit server/.env line 7');
  console.log('   6. Replace <YOUR_PASSWORD> with the actual password\n');
  process.exit(1);
}

console.log('✅ Password appears to be configured (not a placeholder)');
console.log('🔌 Attempting connection...\n');

try {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  
  console.log('✅ SUCCESS! MongoDB is connected');
  console.log(`   Host: ${mongoose.connection.host}`);
  console.log(`   Database: ${mongoose.connection.name}`);
  console.log(`   State: Connected\n`);
  
  await mongoose.connection.close();
  process.exit(0);
} catch (err) {
  console.log('❌ Connection failed:', err.message);
  
  if (err.message.includes('authentication failed')) {
    console.log('\n🔑 Authentication Error - Password is incorrect');
    console.log('   Please reset password in MongoDB Atlas and update .env\n');
  } else if (err.message.includes('ECONNREFUSED') || err.message.includes('querySrv')) {
    console.log('\n🌐 Network Error - Cannot reach MongoDB Atlas');
    console.log('   Possible causes:');
    console.log('   - Firewall blocking MongoDB');
    console.log('   - IP not whitelisted in Atlas Network Access');
    console.log('   - DNS resolution issues\n');
  }
  
  process.exit(1);
}
