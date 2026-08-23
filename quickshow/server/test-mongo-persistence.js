import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import User from './models/User.js';
import Movie from './models/Movie.js';
import Show from './models/Show.js';
import Booking from './models/Booking.js';

async function testPersistence() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Successfully connected to MongoDB.");

        const uniqueId = new Date().getTime().toString();
        
        // 1. User persistence
        console.log("Testing User persistence...");
        const user = new User({
            clerkId: 'test_clerk_' + uniqueId,
            email: 'test' + uniqueId + '@example.com',
            name: 'Test User'
        });
        await user.save();
        console.log("User saved successfully. ID:", user._id);
        const retrievedUser = await User.findById(user._id);
        console.log("User retrieved:", !!retrievedUser);

        // 2. Movie persistence
        console.log("Testing Movie persistence...");
        const movie = new Movie({
            tmdbId: Math.floor(Math.random() * 1000000),
            title: 'Test Movie ' + uniqueId,
            overview: 'Test overview',
            posterPath: '/test.jpg',
            releaseDate: new Date(),
            genres: ['Action'],
            duration: 120
        });
        await movie.save();
        console.log("Movie saved successfully. ID:", movie._id);
        const retrievedMovie = await Movie.findById(movie._id);
        console.log("Movie retrieved:", !!retrievedMovie);

        // 3. Show persistence
        console.log("Testing Show persistence...");
        const show = new Show({
            movie: movie._id,
            movieTitle: movie.title,
            tmdbId: movie.tmdbId,
            theater: 'Test Theater',
            screen: 'Screen 1',
            date: new Date(),
            time: '18:00',
            price: 15,
            format: '2D',
            language: 'English',
            seats: [{
                row: 'A',
                number: 1,
                status: 'available',
                type: 'standard',
                price: 15
            }]
        });
        await show.save();
        console.log("Show saved successfully. ID:", show._id);
        const retrievedShow = await Show.findById(show._id);
        console.log("Show retrieved:", !!retrievedShow);

        // 4. Booking persistence
        console.log("Testing Booking persistence...");
        const booking = new Booking({
            user: user._id,
            show: show._id,
            seats: [show.seats && show.seats[0] ? show.seats[0]._id : new mongoose.Types.ObjectId()],
            totalAmount: 15,
            status: 'confirmed',
            paymentId: 'pay_test_' + uniqueId
        });
        await booking.save();
        console.log("Booking saved successfully. ID:", booking._id);
        const retrievedBooking = await Booking.findById(booking._id);
        console.log("Booking retrieved:", !!retrievedBooking);

        // Cleanup
        console.log("Cleaning up test data...");
        await Booking.deleteOne({ _id: booking._id });
        await Show.deleteOne({ _id: show._id });
        await Movie.deleteOne({ _id: movie._id });
        await User.deleteOne({ _id: user._id });
        console.log("Cleanup complete.");

        await mongoose.disconnect();
        console.log("All persistence tests passed successfully!");
    } catch (error) {
        console.error("Test failed:", error.message);
        process.exit(1);
    }
}

testPersistence();
