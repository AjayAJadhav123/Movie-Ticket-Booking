import Movie from '../models/Movie.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Calculate similarity between two movies based on:
 * - Genres
 * - Rating
 * - Cast
 * - Keywords/Overview
 */
function calculateSimilarity(movie1, movie2) {
  let similarity = 0;
  let maxScore = 0;

  // Genre similarity (weight: 0.4)
  if (movie1.genres && movie2.genres) {
    const commonGenres = movie1.genres.filter((g) => movie2.genres.includes(g));
    const genreSimilarity = commonGenres.length / Math.max(movie1.genres.length, movie2.genres.length);
    similarity += genreSimilarity * 0.4;
    maxScore += 0.4;
  }

  // Rating similarity (weight: 0.2)
  if (movie1.rating !== undefined && movie2.rating !== undefined) {
    const ratingDiff = Math.abs(movie1.rating - movie2.rating) / 10;
    const ratingSimilarity = 1 - ratingDiff;
    similarity += Math.max(0, ratingSimilarity) * 0.2;
    maxScore += 0.2;
  }

  // Cast similarity (weight: 0.2)
  if (movie1.cast && movie2.cast) {
    const cast1 = movie1.cast.slice(0, 5); // Top 5 cast members
    const cast2 = movie2.cast.slice(0, 5);
    const commonCast = cast1.filter((c) => cast2.includes(c));
    const castSimilarity = commonCast.length / 5;
    similarity += castSimilarity * 0.2;
    maxScore += 0.2;
  }

  // Overview/Keywords similarity (weight: 0.2)
  if (movie1.overview && movie2.overview) {
    const words1 = new Set(movie1.overview.toLowerCase().split(/\s+/));
    const words2 = new Set(movie2.overview.toLowerCase().split(/\s+/));
    const commonWords = [...words1].filter((w) => words2.has(w));
    const overviewSimilarity = commonWords.length / Math.max(words1.size, words2.size);
    similarity += overviewSimilarity * 0.2;
    maxScore += 0.2;
  }

  // Normalize similarity score (0-1)
  return maxScore > 0 ? similarity / maxScore : 0;
}

/**
 * GET /api/recommendations/movie/:movieId
 * Get movies similar to a specific movie
 */
export const getMovieRecommendations = async (req, res) => {
  try {
    const { movieId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 5, 20); // Max 20

    // Get the reference movie
    const referenceMovie = await Movie.findById(movieId).lean();
    if (!referenceMovie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    // Get all movies except the reference movie
    const allMovies = await Movie.find({
      _id: { $ne: movieId },
    })
      .select('title genres rating cast overview poster_path backdrop_path release_date _id')
      .limit(100) // Limit to 100 movies to avoid performance issues
      .lean();

    // Calculate similarity for each movie
    const recommendations = allMovies
      .map((movie) => ({
        ...movie,
        similarity: calculateSimilarity(referenceMovie, movie),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return res.status(200).json({
      success: true,
      data: recommendations.map((movie) => ({
        _id: movie._id,
        title: movie.title,
        genres: movie.genres,
        rating: movie.rating,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date,
        similarity: movie.similarity,
      })),
    });
  } catch (error) {
    console.error('Error getting movie recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting recommendations',
      error: error.message,
    });
  }
};

/**
 * GET /api/recommendations/user/:userId
 * Get personalized recommendations for a user based on favorites and booking history
 */
export const getUserRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);

    // Get user data
    const user = await User.findOne({ clerkId: userId }).lean();
    if (!user) {
      // Return trending movies for non-existent user
      return getTrendingRecommendations(res, limit);
    }

    const favorites = user.favorites || [];
    const userWatchedMovies = new Set(favorites.map((f) => f.toString()));

    // If user has no favorites, return trending movies
    if (favorites.length === 0) {
      // Try to get booking history
      const bookings = await Booking.find({ userId })
        .select('showId')
        .limit(20)
        .lean();

      if (bookings.length === 0) {
        return getTrendingRecommendations(res, limit);
      }

      // Get movies from booking history
      const shows = await Show.find({
        _id: { $in: bookings.map((b) => b.showId) },
      })
        .select('movieId')
        .lean();

      for (const show of shows) {
        if (show.movieId) {
          userWatchedMovies.add(show.movieId.toString());
        }
      }
    }

    if (userWatchedMovies.size === 0) {
      return getTrendingRecommendations(res, limit);
    }

    // Get favorite/watched movies data
    const watchedMovies = await Movie.find({
      _id: { $in: Array.from(userWatchedMovies) },
    })
      .lean();

    if (watchedMovies.length === 0) {
      return getTrendingRecommendations(res, limit);
    }

    // Get candidate movies
    const candidateMovies = await Movie.find({
      _id: { $nin: Array.from(userWatchedMovies) },
    })
      .limit(100)
      .lean();

    // Calculate recommendation score for each candidate
    const recommendations = candidateMovies
      .map((candidate) => {
        // Calculate average similarity to all watched movies
        const similarities = watchedMovies.map((watched) =>
          calculateSimilarity(watched, candidate),
        );
        const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;

        return {
          ...candidate,
          similarity: avgSimilarity,
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return res.status(200).json({
      success: true,
      data: recommendations.map((movie) => ({
        _id: movie._id,
        title: movie.title,
        genres: movie.genres,
        rating: movie.rating,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date,
        similarity: movie.similarity,
      })),
    });
  } catch (error) {
    console.error('Error getting user recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting recommendations',
      error: error.message,
    });
  }
};

/**
 * Helper: Get trending recommendations
 */
async function getTrendingRecommendations(res, limit) {
  try {
    const trendingMovies = await Movie.find()
      .sort({ rating: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      data: trendingMovies.map((movie) => ({
        _id: movie._id,
        title: movie.title,
        genres: movie.genres,
        rating: movie.rating,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date,
        similarity: 0.5, // Default score
      })),
    });
  } catch (error) {
    console.error('Error getting trending recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting trending movies',
      error: error.message,
    });
  }
}
