import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const clearUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await User.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} users.`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error clearing users:', error);
    process.exit(1);
  }
};

clearUsers();
