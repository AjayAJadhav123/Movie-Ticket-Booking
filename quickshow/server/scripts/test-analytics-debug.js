import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import User from '../models/User.js';
import Cinema from '../models/Cinema.js';
import Screen from '../models/Screen.js';

async function test() {
  try {
    console.log('Connecting to MongoDB at:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    console.log('\n--- TESTING GET COUNTS QUERIES ---');
    try {
      const totalUsers = await User.countDocuments();
      console.log('totalUsers:', totalUsers);
    } catch (e) { console.error('Error totalUsers:', e); }

    try {
      const totalMovies = await Movie.countDocuments();
      console.log('totalMovies:', totalMovies);
    } catch (e) { console.error('Error totalMovies:', e); }

    try {
      const totalCinemas = await Cinema.countDocuments();
      console.log('totalCinemas:', totalCinemas);
    } catch (e) { console.error('Error totalCinemas:', e); }

    try {
      const totalScreens = await Screen.countDocuments();
      console.log('totalScreens:', totalScreens);
    } catch (e) { console.error('Error totalScreens:', e); }

    try {
      const totalShows = await Show.countDocuments();
      console.log('totalShows:', totalShows);
    } catch (e) { console.error('Error totalShows:', e); }

    try {
      const totalBookings = await Booking.countDocuments({ status: 'confirmed' });
      console.log('totalBookings:', totalBookings);
    } catch (e) { console.error('Error totalBookings:', e); }

    try {
      const revenueData = await Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      console.log('revenueData:', revenueData);
    } catch (e) { console.error('Error revenueData:', e); }

    try {
      const todayData = await Booking.aggregate([
        {
          $match: {
            status: 'confirmed',
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lt:  new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        },
        { $group: { _id: null, todayRevenue: { $sum: '$amount' }, todayBookings: { $sum: 1 } } },
      ]);
      console.log('todayData:', todayData);
    } catch (e) { console.error('Error todayData:', e); }

    console.log('\n--- TESTING GET OVERVIEW QUERIES ---');
    try {
      const [revenueData2, ticketData, occupancyData, totalUsers2, activeShows] =
        await Promise.all([
          Booking.aggregate([
            { $match: { status: 'confirmed' } },
            { $group: { _id: null, totalRevenue: { $sum: '$amount' }, totalBookings: { $sum: 1 }, avgAmount: { $avg: '$amount' } } },
          ]),
          Booking.aggregate([
            { $match: { status: 'confirmed' } },
            { $group: { _id: null, totalTickets: { $sum: { $size: '$seats' } } } },
          ]),
          Show.aggregate([
            { $group: { _id: null, totalSeats: { $sum: '$totalSeats' }, occupiedSeats: { $sum: { $size: '$occupiedSeats' } } } },
          ]),
          User.countDocuments(),
          Show.countDocuments({ date: { $gte: new Date() } }),
        ]);
      console.log('Overview Results:');
      console.log('  revenueData:', revenueData2);
      console.log('  ticketData:', ticketData);
      console.log('  occupancyData:', occupancyData);
      console.log('  totalUsers:', totalUsers2);
      console.log('  activeShows:', activeShows);
    } catch (e) {
      console.error('Error in Overview Promise.all:', e);
    }

  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

test();
