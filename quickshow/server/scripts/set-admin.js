/**
 * Set admin status for a user in MongoDB by Clerk user ID.
 * Usage: node scripts/set-admin.js <clerkUserId>
 * Example: node scripts/set-admin.js user_2abc123def456
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });
import mongoose from 'mongoose';
import User from '../models/User.js';

const clerkId = process.argv[2];

if (!clerkId) {
  console.error('❌ Usage: node scripts/set-admin.js <clerkUserId>');
  console.error('   Example: node scripts/set-admin.js user_2abc123def456');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set in .env');
  process.exit(1);
}

try {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  const user = await User.findOneAndUpdate(
    { clerkId },
    { isAdmin: true },
    { new: true }
  );

  if (!user) {
    console.error(`❌ User with Clerk ID "${clerkId}" not found in MongoDB.`);
    console.log('   Make sure the user has signed in at least once so their record exists.');
    process.exit(1);
  }

  console.log(`✅ isAdmin set to true for user: ${user.name} (${user.email})`);
  console.log(`   Clerk ID: ${user.clerkId}`);
  console.log(`   MongoDB _id: ${user._id}`);

} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
} finally {
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}
