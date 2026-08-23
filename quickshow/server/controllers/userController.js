import { Webhook } from 'svix';
import User from '../models/User.js';
import Movie from '../models/Movie.js';
import mongoose from 'mongoose';
import axios from 'axios';
import { clerkClient } from '@clerk/express';

export const handleClerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    // In development without a configured webhook secret, just acknowledge the webhook
    console.warn('⚠️ Webhook secret not configured');
    return res.status(200).json({
      success: true,
      message: 'Webhook secret not configured (dev mode)',
    });
  }

  const payload = req.body;
  const headers = req.headers;

  let wh;
  try {
    wh = new Webhook(WEBHOOK_SECRET);
  } catch (err) {
    console.warn('⚠️ Invalid webhook secret format:', err.message);
    return res.status(200).json({
      success: true,
      message: 'Webhook secret invalid (dev mode)',
    });
  }

  let evt;

  try {
    evt = wh.verify(payload, headers);
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    return res.status(400).json({
      success: false,
      message: 'Webhook verification failed',
    });
  }

  try {
    if (evt.type === 'user.created') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      const newUser = new User({
        clerkId: id,
        name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
        email: email_addresses[0]?.email_address || '',
        image: image_url || null,
      });

      await newUser.save();
      console.log(`✅ User created: ${id}`);
    } else if (evt.type === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      await User.updateOne(
        { clerkId: id },
        {
          $set: {
            name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
            email: email_addresses[0]?.email_address || '',
            image: image_url || null,
          },
        }
      );
      console.log(`✅ User updated: ${id}`);
    } else if (evt.type === 'user.deleted') {
      const { id } = evt.data;
      await User.deleteOne({ clerkId: id });
      console.log(`✅ User deleted: ${id}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing webhook',
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user',
    });
  }
};

// Authoritative admin check using decoded Clerk JWT + MongoDB User record.
// Automatically creates the MongoDB User on first call (handles local dev where Clerk webhooks can't reach localhost).
export const checkAdmin = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, isAdmin: false, message: 'Unauthorized' });
    }

    const decoded = req.decodedToken || {};

    if (process.env.NODE_ENV !== 'production') {
      console.log('[ADMIN CHECK] userId:', userId);
      console.log('[ADMIN CHECK] JWT claim keys:', Object.keys(decoded));
    }

    // Upsert the user in MongoDB from JWT claims (in case webhook never fired on localhost)
    const name = decoded.name || decoded.given_name || 'User';
    const email = decoded.email || `${userId}@clerk.local`;
    const image = decoded.picture || decoded.image_url || null;

    let user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $setOnInsert: {
          clerkId: userId,
          name,
          email,
          image,
          isAdmin: false,
        },
      },
      { upsert: true, new: true }
    );

    const isAdmin = user.isAdmin === true;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[ADMIN CHECK] MongoDB isAdmin:', isAdmin);
    }

    return res.status(200).json({ success: true, isAdmin });
  } catch (error) {
    console.error('[ADMIN CHECK] Error:', error.message, error.stack);
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

    const user = await User.findOne({ clerkId: userId });

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

    const user = await User.findOne({ clerkId: userId });

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

    const user = await User.findOne({ clerkId: userId }).populate('favorites');

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
