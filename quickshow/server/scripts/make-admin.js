/**
 * make-admin.js
 * Run: node scripts/make-admin.js your@email.com
 * Promotes a user to admin in MongoDB.
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/make-admin.js your@email.com');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
console.log('MongoDB connected');

const user = await User.findOneAndUpdate(
  { email: email.toLowerCase() },
  { $set: { isAdmin: true } },
  { new: true }
);

if (!user) {
  console.error(`No user found with email: ${email}`);
  console.log('Tip: Sign in on the website first so your account is created in MongoDB.');
} else {
  console.log(`SUCCESS: ${user.name} (${user.email}) is now an admin!`);
  console.log('   MongoDB _id:', user._id.toString());
  console.log('   Clerk ID:   ', user.clerkId);
}

await mongoose.disconnect();
process.exit(0);
