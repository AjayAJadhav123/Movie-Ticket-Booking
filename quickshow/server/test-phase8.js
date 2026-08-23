import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { getTrends, getBookingStatus, getCinemaAnalytics, getPopularShows } from './controllers/analyticsController.js';

// Mock Express req/res
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

async function testPhase8() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.\n');

        const req = { query: { range: '30d' } };
        let res = new MockRes();

        console.log('--- Testing getTrends ---');
        await getTrends(req, res);
        console.log('Status:', res.statusCode);
        console.log('Success:', res.data?.success);
        console.log('Keys:', Object.keys(res.data?.data || {}));

        console.log('\n--- Testing getBookingStatus ---');
        res = new MockRes();
        await getBookingStatus(req, res);
        console.log('Status:', res.statusCode);
        console.log('Success:', res.data?.success);
        console.log('Keys:', Object.keys(res.data?.data || {}));

        console.log('\n--- Testing getCinemaAnalytics ---');
        res = new MockRes();
        await getCinemaAnalytics(req, res);
        console.log('Status:', res.statusCode);
        console.log('Success:', res.data?.success);
        console.log('Keys:', Object.keys(res.data?.data || {}));

        console.log('\n--- Testing getPopularShows ---');
        res = new MockRes();
        await getPopularShows(req, res);
        console.log('Status:', res.statusCode);
        console.log('Success:', res.data?.success);
        console.log('Length:', res.data?.data?.length);

        console.log('\n✅ Phase 8 Controller logic completed successfully.');
        await mongoose.disconnect();
    } catch (e) {
        console.error('Test failed:', e);
        process.exit(1);
    }
}

testPhase8();
