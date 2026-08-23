import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import User from './models/User.js';
import Movie from './models/Movie.js';
import Cinema from './models/Cinema.js';
import Screen from './models/Screen.js';
import Show from './models/Show.js';
import Booking from './models/Booking.js';

async function testCounts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.\n');

    const [
      totalUsers,
      totalMovies,
      totalCinemas,
      totalScreens,
      totalShows,
      totalBookings,
      revenueData,
      todayData,
    ] = await Promise.all([
      User.countDocuments(),
      Movie.countDocuments(),
      Cinema.countDocuments(),
      Screen.countDocuments(),
      Show.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Booking.aggregate([
        {
          $match: {
            status: 'confirmed',
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        },
        {
          $group: {
            _id: null,
            todayRevenue: { $sum: '$amount' },
            todayBookings: { $sum: 1 },
          },
        },
      ]),
    ]);

    console.log('=== Admin Dashboard Counts (Real MongoDB Data) ===');
    console.log(`Users:         ${totalUsers}`);
    console.log(`Movies:        ${totalMovies}`);
    console.log(`Cinemas:       ${totalCinemas}`);
    console.log(`Screens:       ${totalScreens}`);
    console.log(`Shows:         ${totalShows}`);
    console.log(`Bookings:      ${totalBookings}`);
    console.log(`Total Revenue: ₹${revenueData[0]?.total || 0}`);
    console.log(`Today Revenue: ₹${todayData[0]?.todayRevenue || 0}`);
    console.log(`Today Bookings: ${todayData[0]?.todayBookings || 0}`);
    console.log('\n✅ All counts returned successfully from MongoDB Atlas');

    await mongoose.disconnect();
  } catch (e) {
    console.error('Test failed:', e);
    process.exit(1);
  }
}

testCounts();
