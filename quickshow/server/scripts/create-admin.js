import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const email = 'admin@gmail.com';
    const password = '123456789';
    
    // Check if user exists
    let adminUser = await User.findOne({ email });
    
    if (adminUser) {
      console.log('Admin user already exists. Updating password and permissions...');
      const salt = await bcrypt.genSalt(12);
      adminUser.password = await bcrypt.hash(password, salt);
      adminUser.isAdmin = true;
      adminUser.isVerified = true;
      await adminUser.save();
    } else {
      console.log('Creating new admin user...');
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      adminUser = await User.create({
        name: 'Super Admin',
        email,
        password: hashedPassword,
        isAdmin: true,
        isVerified: true
      });
    }
    
    console.log('Admin user created/updated successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
