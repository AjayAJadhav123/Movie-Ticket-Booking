// Seed MongoDB with demo movies
// This allows the app to work even when TMDB is unreachable

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Movie from './models/Movie.js';

dotenv.config();

const SEED_MOVIES = [
  {
    tmdbId: 550,
    title: 'Fight Club',
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
    poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    release_date: '1999-10-15',
    rating: 8.4,
    genres: ['Drama', 'Thriller', 'Comedy'],
    runtime: 139,
    language: 'en',
    cast: ['Edward Norton', 'Brad Pitt', 'Helena Bonham Carter'],
  },
  {
    tmdbId: 278,
    title: 'The Shawshank Redemption',
    overview: 'Imprisoned in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.',
    poster_path: '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
    backdrop_path: '/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
    release_date: '1994-09-23',
    rating: 8.7,
    genres: ['Drama', 'Crime'],
    runtime: 142,
    language: 'en',
    cast: ['Tim Robbins', 'Morgan Freeman', 'Bob Gunton'],
  },
  {
    tmdbId: 238,
    title: 'The Godfather',
    overview: 'Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.',
    poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    backdrop_path: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
    release_date: '1972-03-14',
    rating: 8.7,
    genres: ['Drama', 'Crime'],
    runtime: 175,
    language: 'en',
    cast: ['Marlon Brando', 'Al Pacino', 'James Caan'],
  },
  {
    tmdbId: 19404,
    title: 'Dilwale Dulhania Le Jayenge',
    overview: 'Raj is a rich, carefree, happy-go-lucky second generation NRI. Simran is the daughter of Chaudhary Baldev Singh.',
    poster_path: '/lfRkUr7DYdHldAqi3PwdQGBRBPM.jpg',
    backdrop_path: '/90ezh6SNH7TfhS5Yd9M6yTxZTpR.jpg',
    release_date: '1995-10-20',
    rating: 8.7,
    genres: ['Comedy', 'Drama', 'Romance'],
    runtime: 189,
    language: 'hi',
    cast: ['Shah Rukh Khan', 'Kajol', 'Amrish Puri'],
  },
  {
    tmdbId: 19995,
    title: 'Avatar',
    overview: 'In the 22nd century, a paraplegic Marine is dispatched to the moon Pandora on a unique mission.',
    poster_path: '/kyeqWdyUXW608qlYkRqosgbbJyK.jpg',
    backdrop_path: '/o0s4XsEDfDlvit5pDRKjzXR4pp2.jpg',
    release_date: '2009-12-18',
    rating: 7.6,
    genres: ['Action', 'Adventure', 'Fantasy', 'Science Fiction'],
    runtime: 162,
    language: 'en',
    cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'],
  },
  {
    tmdbId: 680,
    title: 'Pulp Fiction',
    overview: 'A burger-loving hit man, his philosophical partner, a drug-addled gangster\'s moll and a washed-up boxer converge in this sprawling crime saga.',
    poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    backdrop_path: '/4cDFJr4HnXN5AdPw4AKrmLlMWdO.jpg',
    release_date: '1994-09-10',
    rating: 8.5,
    genres: ['Thriller', 'Crime'],
    runtime: 154,
    language: 'en',
    cast: ['John Travolta', 'Samuel L. Jackson', 'Uma Thurman'],
  },
];

async function seedMovies() {
  try {
    console.log('\n🌱 MongoDB Movie Seeding Tool\n');
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB\n');
    
    // Check existing movies
    const existingCount = await Movie.countDocuments();
    console.log(`📊 Current movies in database: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log('⚠️  Database already has movies');
      console.log('   This will add missing movies only (by tmdbId)\n');
    }
    
    let added = 0;
    let skipped = 0;
    
    for (const movieData of SEED_MOVIES) {
      // Check if movie already exists by tmdbId
      const existing = await Movie.findOne({ tmdbId: movieData.tmdbId });
      
      if (existing) {
        console.log(`⏭️  Skipped: ${movieData.title} (already exists)`);
        skipped++;
        continue;
      }
      
      // Create new movie
      const movie = new Movie(movieData);
      await movie.save();
      console.log(`✅ Added: ${movieData.title} (tmdbId: ${movieData.tmdbId}, _id: ${movie._id})`);
      added++;
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Added: ${added}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📊 Total: ${await Movie.countDocuments()}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Seeding complete!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seeding failed:', err.message);
    
    if (err.message.includes('MONGODB_URI')) {
      console.log('   Please configure MONGODB_URI in .env first\n');
    } else if (err.message.includes('authentication')) {
      console.log('   MongoDB authentication failed - check password\n');
    }
    
    process.exit(1);
  }
}

seedMovies();
