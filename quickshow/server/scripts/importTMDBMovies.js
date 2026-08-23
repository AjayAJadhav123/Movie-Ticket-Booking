import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from '../models/Movie.js';

// Load .env file from server directory
dotenv.config({ path: 'c:\\Users\\aj386\\Desktop\\Movie Ticket Booking\\quickshow\\server\\.env' });

const TMDB_BASE_URL = 'https://api.tmdb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Popular movies to import - using real TMDB IDs
const MOVIES_TO_IMPORT = [
  550,   // Fight Club
  278,   // The Shawshank Redemption
  238,   // The Godfather
  424,   // Schindler's List
  389,   // 12 Angry Men
  568,   // Gladiator
  603,   // The Matrix
  680,   // Pulp Fiction
  240,   // The Godfather: Part II
  496,   // Forrest Gump
];

const fetchMovieData = async (tmdbId) => {
  try {
    console.log(`Fetching TMDB ID: ${tmdbId}...`);
    
    const movieResponse = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: { api_key: TMDB_API_KEY },
    });

    const movieData = movieResponse.data;

    // Get credits (cast)
    const creditsResponse = await axios.get(
      `${TMDB_BASE_URL}/movie/${tmdbId}/credits`,
      { params: { api_key: TMDB_API_KEY } }
    );

    const cast = creditsResponse.data.cast
      .slice(0, 10)
      .map((actor) => actor.name);

    // Get videos (trailer)
    const videosResponse = await axios.get(
      `${TMDB_BASE_URL}/movie/${tmdbId}/videos`,
      { params: { api_key: TMDB_API_KEY } }
    );

    const trailer = videosResponse.data.results.find(
      (video) => video.type === 'Trailer'
    );

    return {
      title: movieData.title,
      overview: movieData.overview,
      poster_path: movieData.poster_path,
      backdrop_path: movieData.backdrop_path,
      release_date: movieData.release_date,
      genres: movieData.genres ? movieData.genres.map((g) => g.name) : [],
      cast,
      tmdbId: movieData.id,
      language: movieData.original_language,
      rating: movieData.vote_average,
      trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
    };
  } catch (error) {
    console.error(`Error fetching movie ${tmdbId}:`, error.response?.data?.status_message || error.message);
    return null;
  }
};

const importMovies = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    if (!TMDB_API_KEY) {
      console.error('TMDB_API_KEY is not configured');
      process.exit(1);
    }

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const tmdbId of MOVIES_TO_IMPORT) {
      // Check if movie already exists
      const existingMovie = await Movie.findOne({ tmdbId });
      if (existingMovie) {
        console.log(`⏭️  Skipped: "${existingMovie.title}" (already in database)`);
        skipped++;
        continue;
      }

      // Fetch movie data from TMDB
      const movieData = await fetchMovieData(tmdbId);
      if (!movieData) {
        console.log(`❌ Failed to import movie with TMDB ID: ${tmdbId}`);
        failed++;
        continue;
      }

      // Save to MongoDB
      const newMovie = new Movie(movieData);
      await newMovie.save();
      console.log(`✅ Imported: "${movieData.title}" (Rating: ${movieData.rating}/10)`);
      imported++;

      // Delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log('\n=== Import Summary ===');
    console.log(`✅ Imported: ${imported}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);

    // Get final count
    const totalCount = await Movie.countDocuments();
    console.log(`\nTotal movies in database: ${totalCount}`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

importMovies();
