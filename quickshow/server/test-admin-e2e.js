import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { getAnalyticsOverview, getRevenueAnalytics, getDemandAnalytics } from './controllers/analyticsController.js';
import Movie from './models/Movie.js';
import Show from './models/Show.js';
import Booking from './models/Booking.js';
import User from './models/User.js';
import Cinema from './models/Cinema.js';
import Screen from './models/Screen.js';

// Mock Response Object
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

async function runE2ETests() {
    try {
        console.log("Connecting to MongoDB for E2E Tests...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Connected.");

        const uniqueId = new Date().getTime().toString();
        const req = { user: { id: 'test_admin' } };
        
        // 1. Create Cinema
        console.log("Testing Cinema Creation (CRUD)...");
        const cinema = new Cinema({
            name: 'Test Cinema ' + uniqueId,
            location: 'Test City',
            city: 'Test City',
            address: '123 Test St',
            contact: {
                email: 'test' + uniqueId + '@cinema.com',
                phone: '1234567890'
            },
            facilities: []
        });
        await cinema.save();
        console.log("Cinema created:", cinema._id);

        // 2. Create Screen
        console.log("Testing Screen Creation (CRUD)...");
        const screen = new Screen({
            cinemaId: cinema._id,
            name: 'Screen 1',
            screenType: 'IMAX',
            rows: 10,
            seatsPerRow: 10,
            totalCapacity: 100
        });
        await screen.save();
        console.log("Screen created:", screen._id);

        // 3. Analytics Tests
        console.log("Testing Analytics Controller...");
        
        let res = new MockRes();
        await getAnalyticsOverview(req, res);
        console.log("Analytics Overview returned status:", res.statusCode);
        console.log("Data keys:", Object.keys(res.data.data));

        res = new MockRes();
        await getRevenueAnalytics(req, res);
        console.log("Revenue Analytics returned status:", res.statusCode);
        console.log("Total Revenue:", res.data.data.totalRevenue);

        res = new MockRes();
        await getDemandAnalytics(req, res);
        console.log("Demand Analytics returned status:", res.statusCode);
        console.log("By Hour length:", res.data.data.byHour.length);

        // Cleanup
        console.log("Cleaning up E2E test data...");
        await Screen.deleteOne({ _id: screen._id });
        await Cinema.deleteOne({ _id: cinema._id });
        
        await mongoose.disconnect();
        console.log("✅ All E2E Admin Tests Completed Successfully!");
    } catch (e) {
        console.error("E2E Test Failed:", e);
        process.exit(1);
    }
}

runE2ETests();
