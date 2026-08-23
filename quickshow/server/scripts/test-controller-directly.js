import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

import mongoose from 'mongoose';
import { getAnalyticsOverview, getCounts } from '../controllers/analyticsController.js';

class MockRes {
  constructor() {
    this.statusCode = 200;
    this.data = null;
  }
  status(code) {
    this.statusCode = code;
    return this;
  }
  json(data) {
    this.data = data;
    return this;
  }
}

async function test() {
  try {
    console.log('Connecting to MongoDB at:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    console.log('\n--- TESTING getAnalyticsOverview ---');
    const req1 = { query: {} };
    const res1 = new MockRes();
    await getAnalyticsOverview(req1, res1);
    console.log('Overview Status:', res1.statusCode);
    console.log('Overview Data:', JSON.stringify(res1.data, null, 2));

    console.log('\n--- TESTING getCounts ---');
    const req2 = { query: {} };
    const res2 = new MockRes();
    await getCounts(req2, res2);
    console.log('Counts Status:', res2.statusCode);
    console.log('Counts Data:', JSON.stringify(res2.data, null, 2));

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

test();
