import mongoose from 'mongoose';

const connectDB = async () => {
  // If MONGODB_URI is not configured, skip connection but continue running
  if (!process.env.MONGODB_URI) {
    console.warn(`⚠️  MONGODB_URI not configured. Database features will not be available.`);
    console.warn(`    Configure MONGODB_URI in .env to enable MongoDB features.`);
    return null;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn(`⚠️  Server starting without database connection.`);
    console.warn(`    API endpoints will return error responses.`);
    return null;
  }
};

export default connectDB;
