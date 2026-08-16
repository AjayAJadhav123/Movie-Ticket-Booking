import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';

dotenv.config();

const SHOWTIMES = [
  { time: '10:00 AM', price: 150 },
  { time: '1:30 PM', price: 180 },
  { time: '4:30 PM', price: 200 },
  { time: '7:30 PM', price: 220 },
  { time: '10:00 PM', price: 250 },
];

const DATES = [
  new Date('2026-08-17'),
  new Date('2026-08-18'),
  new Date('2026-08-19'),
];

const TOTAL_SEATS = 80;

async function createShowsForAllMovies() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Get all movies
    const movies = await Movie.find();
    console.log(`📽️ Found ${movies.length} movies`);

    let showsCreated = 0;
    let showsSkipped = 0;

    // For each movie
    for (const movie of movies) {
      console.log(`\n🎬 Creating shows for: ${movie.title}`);

      // For each date
      for (const date of DATES) {
        // For each showtime
        for (const showtime of SHOWTIMES) {
          try {
            // Check if show already exists
            const existingShow = await Show.findOne({
              movieId: movie._id,
              date: date,
              time: showtime.time,
            });

            if (existingShow) {
              showsSkipped++;
              continue;
            }

            // Create new show
            const newShow = new Show({
              movieId: movie._id,
              date: date,
              time: showtime.time,
              price: showtime.price,
              totalSeats: TOTAL_SEATS,
              occupiedSeats: [],
              lockedSeats: [],
            });

            await newShow.save();
            showsCreated++;
            console.log(`  ✅ ${showtime.time} - $${showtime.price}`);
          } catch (error) {
            console.error(
              `  ❌ Error creating show for ${showtime.time}:`,
              error.message
            );
          }
        }
      }
    }

    // Get final show count
    const totalShowsAfter = await Show.countDocuments();

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Shows created: ${showsCreated}`);
    console.log(`⏭️  Shows skipped (already exist): ${showsSkipped}`);
    console.log(`📈 Total shows after: ${totalShowsAfter}`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createShowsForAllMovies();
