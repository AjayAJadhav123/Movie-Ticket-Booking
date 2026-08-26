import { Webhook } from 'svix';
import User from '../models/User.js';
import Movie from '../models/Movie.js';
import mongoose from 'mongoose';
import axios from 'axios';

export const getUser = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Try to find the user
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
      user: user, // ensure both data and user are returned just in case
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user',
    });
  }
};

export const checkAdmin = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, isAdmin: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId);

    if (!user || user.isAdmin !== true) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    return res.status(200).json({ success: true, isAdmin: true, user });
  } catch (error) {
    console.error('[ADMIN CHECK] Error:', error.message);
    return res.status(500).json({ success: false, isAdmin: false, message: 'Error checking admin status' });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { movieId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: 'Movie ID is required',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let dbMovieId = movieId;

    // Handle TMDB ID by syncing to MongoDB
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      let movie = await Movie.findOne({ tmdbId: parseInt(movieId) });
      
      if (!movie) {
        const TMDB_API_KEY = process.env.TMDB_API_KEY;
        if (!TMDB_API_KEY) {
          return res.status(500).json({ success: false, message: 'TMDB API key not configured' });
        }
        
        try {
          const tmdbRes = await axios.get(`https://api.tmdb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits`);
          const data = tmdbRes.data;
          
          movie = new Movie({
            tmdbId: data.id,
            title: data.title,
            overview: data.overview,
            poster_path: data.poster_path,
            backdrop_path: data.backdrop_path,
            release_date: data.release_date,
            vote_average: data.vote_average,
            genres: data.genres?.map(g => g.name) || [],
            runtime: data.runtime,
            director: data.credits?.crew?.find(c => c.job === 'Director')?.name || 'Unknown',
            cast: data.credits?.cast?.slice(0, 5).map(c => c.name) || [],
            trailerUrl: data.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || '',
            status: 'Now Showing'
          });
          await movie.save();
        } catch (tmdbError) {
          console.error('Error fetching TMDB movie for favorite:', tmdbError);
          return res.status(500).json({ success: false, message: 'Failed to sync movie from TMDB' });
        }
      }
      dbMovieId = movie._id;
    }

    if (!user.favorites.includes(dbMovieId)) {
      user.favorites.push(dbMovieId);
      await user.save();
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding favorite',
    });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { movieId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: 'Movie ID is required',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let dbMovieId = movieId;
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      const movie = await Movie.findOne({ tmdbId: parseInt(movieId) });
      if (movie) {
        dbMovieId = movie._id;
      }
    }

    user.favorites = user.favorites.filter((id) => id.toString() !== dbMovieId.toString());
    await user.save();

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return res.status(500).json({
      success: false,
      message: 'Error removing favorite',
    });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await User.findById(userId).populate('favorites');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: user.favorites || [],
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching favorites',
    });
  }
};
