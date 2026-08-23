import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });
import mongoose from 'mongoose';
import User from '../models/User.js';

await mongoose.connect(process.env.MONGODB_URI);
const users = await User.find({}, 'clerkId name email isAdmin').lean();
console.log('Users in MongoDB:');
users.forEach(u => {
  const tag = u.isAdmin ? '[ADMIN]' : '[USER ]';
  console.log(`  ${tag} ${u.name} | ${u.email} | clerkId: ${u.clerkId}`);
});
await mongoose.disconnect();
