import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const getTMDBKey = () => process.env.TMDB_API_KEY;

// Helper function to ensure a movie exists in database
// If given a TMDB ID (numeric), fetch from TMDB and create/update in DB
// If given a MongoDB ObjectId, return it
const ensureMovieInDatabase = async (movieIdInput) => {
  // Check if it's a MongoDB ObjectId (24 hex characters or valid ObjectId)
  if (/^[0-9a-fA-F]{24}$/.test(String(movieIdInput))) {
    // It's already a MongoDB ObjectId
    const movie = await Movie.findById(movieIdInput);
    if (movie) return movie._id;
    return null;
  }

  // It might be a TMDB ID (numeric or string number)
  const tmdbId = parseInt(movieIdInput);
  if (!isNaN(tmdbId)) {
    // Check if movie already exists by TMDB ID
    let movie = await Movie.findOne({ tmdbId });
    
    if (!movie) {
      // Fetch from TMDB and create in database
      try {
        const TMDB_API_KEY = getTMDBKey();
        if (!TMDB_API_KEY) {
          console.error('TMDB_API_KEY not configured');
          return null;
        }

        const tmdbResponse = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
          params: { api_key: TMDB_API_KEY },
          timeout: 5000,
        });

        const tmdbData = tmdbResponse.data;

        // Fetch credits for cast
        let cast = [];
        try {
          const creditsResponse = await axios.get(
            `${TMDB_BASE_URL}/movie/${tmdbId}/credits`,
            {
              params: { api_key: TMDB_API_KEY },
              timeout: 5000,
            }
          );
          cast = creditsResponse.data.cast
            ?.slice(0, 10)
            .map((actor) => actor.name) || [];
        } catch (err) {
          console.warn('Failed to fetch cast from TMDB:', err.message);
        }

        // Fetch trailer
        let trailer = null;
        try {
          const videosResponse = await axios.get(
            `${TMDB_BASE_URL}/movie/${tmdbId}/videos`,
            {
              params: { api_key: TMDB_API_KEY },
              timeout: 5000,
            }
          );
          const tmdbTrailer = videosResponse.data.results?.find(
            (video) => video.type === 'Trailer'
          );
          if (tmdbTrailer) {
            trailer = `https://www.youtube.com/watch?v=${tmdbTrailer.key}`;
          }
        } catch (err) {
          console.warn('Failed to fetch trailer from TMDB:', err.message);
        }

        // Create movie in database
        movie = new Movie({
          title: tmdbData.title,
          overview: tmdbData.overview,
          poster_path: tmdbData.poster_path,
          backdrop_path: tmdbData.backdrop_path,
          release_date: tmdbData.release_date,
          genres: tmdbData.genres?.map((g) => g.name) || [],
          cast,
          tmdbId: tmdbData.id,
          language: tmdbData.original_language,
          rating: tmdbData.vote_average,
          trailer,
        });

        await movie.save();
        console.log(`Movie synced from TMDB: ${tmdbId} → MongoDB _id: ${movie._id}`);
      } catch (error) {
        console.error(`Error syncing movie ${tmdbId} from TMDB:`, error.message);
        return null;
      }
    }

    return movie._id;
  }

  return null;
};

export const getShowList = async (req, res) => {
  try {
    const { movieId, date, page = 1 } = req.query;

    let query = {};

    if (movieId) {
      query.movieId = movieId;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const shows = await Show.find(query)
      .populate('movieId', 'title poster_path')
      .limit(20)
      .skip((page - 1) * 20)
      .sort({ date: 1, time: 1 });

    const total = await Show.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: shows,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / 20),
      },
    });
  } catch (error) {
    console.error('Error fetching shows:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching shows',
    });
  }
};

export const getShowById = async (req, res) => {
  try {
    const { id } = req.params;

    const show = await Show.findById(id).populate('movieId');

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    const availableSeats = show.totalSeats - show.occupiedSeats.length;

    const movie = show.movieId;

    const showData = {
      _id: show._id,
      movieId: show.movieId._id,
      movieTitle: movie?.title || 'Unknown',
      posterPath: movie?.poster_path || null,
      date: show.date,
      time: show.time,
      price: show.price,
      totalSeats: show.totalSeats,
      occupiedSeats: show.occupiedSeats,
      availableSeats,
    };

    return res.status(200).json({
      success: true,
      data: showData,
    });
  } catch (error) {
    console.error('Error fetching show:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching show',
    });
  }
};

export const createShow = async (req, res) => {
  try {
    const { movieId, date, time, price, totalSeats } = req.body;

    if (!movieId || !date || !time || !price) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    const existingShow = await Show.findOne({
      movieId,
      date: new Date(date),
      time,
    });

    if (existingShow) {
      return res.status(409).json({
        success: false,
        message: 'Show already exists for this movie, date, and time',
      });
    }

    const newShow = new Show({
      movieId,
      date: new Date(date),
      time,
      price,
      totalSeats: totalSeats || 100,
    });

    await newShow.save();

    const populatedShow = await Show.findById(newShow._id).populate(
      'movieId',
      'title poster_path'
    );

    return res.status(201).json({
      success: true,
      data: populatedShow,
    });
  } catch (error) {
    console.error('Error creating show:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating show',
    });
  }
};

export const removeShow = async (req, res) => {
  try {
    const { id } = req.params;

    const show = await Show.findByIdAndDelete(id);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Show deleted successfully',
    });
  } catch (error) {
    console.error('Error removing show:', error);
    return res.status(500).json({
      success: false,
      message: 'Error removing show',
    });
  }
};

export const getAvailableDates = async (req, res) => {
  try {
    const { movieId } = req.query;

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: 'Movie ID is required',
      });
    }

    // Ensure the movie exists in database (sync from TMDB if needed)
    const dbMovieId = await ensureMovieInDatabase(movieId);
    
    if (!dbMovieId) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    const shows = await Show.find({ movieId: dbMovieId }).select('date').distinct('date');

    const dates = shows.sort((a, b) => a - b);

    return res.status(200).json({
      success: true,
      data: dates,
    });
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching available dates',
    });
  }
};

export const getShowsByMovieAndDate = async (req, res) => {
  try {
    const { movieId, date } = req.query;

    if (!movieId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Movie ID and date are required',
      });
    }

    // Ensure the movie exists in database (sync from TMDB if needed)
    const dbMovieId = await ensureMovieInDatabase(movieId);
    
    if (!dbMovieId) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const shows = await Show.find({
      movieId: dbMovieId,
      date: { $gte: startDate, $lt: endDate },
    }).sort({ time: 1 });

    return res.status(200).json({
      success: true,
      data: shows,
    });
  } catch (error) {
    console.error('Error fetching shows by date:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching shows by date',
    });
  }
};
