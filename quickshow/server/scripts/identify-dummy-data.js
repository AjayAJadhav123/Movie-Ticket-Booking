import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quickshow';

async function listAll() {
  try {
    await mongoose.connect(MONGO_URI);
    
    const db = mongoose.connection.db;
    
    const cinemas = await db.collection('cinemas').find().toArray();
    console.log('Cinemas:', cinemas.map(c => c.name));
    
    const screens = await db.collection('screens').find().toArray();
    console.log('Screens:', screens.map(s => s.name));
    
    const movies = await db.collection('movies').find().toArray();
    console.log('Movies:', movies.map(m => m.title));
    
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

listAll();
