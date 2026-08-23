import mongoose from 'mongoose';

const connectDB = async () => {
  // If MONGODB_URI is not configured, skip connection but continue running
  if (!process.env.MONGODB_URI) {
    console.warn(`⚠️  MONGODB_URI not configured. Database features will not be available.`);
    console.warn(`    Configure MONGODB_URI in .env to enable MongoDB features.`);
    return null;
  }

  try {
    console.log('MongoDB: attempting connection...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Do not let an unreachable Atlas cluster keep every API request waiting.
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      family: 4 // Force IPv4 to fix DNS/routing timeout issues with Atlas
    });
    console.log('MongoDB: connected');
    return conn;
  } catch (error) {
    console.error(`MongoDB: connection failed - ${error.message}`);
    console.warn(`⚠️  Server starting without database connection.`);
    console.warn(`    API endpoints will return error responses.`);
    return null;
  }
};

export default connectDB;
