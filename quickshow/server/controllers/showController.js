import mongoose from 'mongoose';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import axios from 'axios';
import {
  createLocalShow,
  getLocalShow,
  listLocalShows,
  removeLocalShow,
} from '../services/localShowStore.js';

const TMDB_BASE_URL = 'https://api.tmdb.org/3';
const getTMDBKey = () => process.env.TMDB_API_KEY;
const isDatabaseAvailable = () => mongoose.connection.readyState === 1;
const normaliseMovieId = (id) => String(id || '').replace(/^tmdb_/, '');

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
    const { movieId, tmdbId, date, page = 1 } = req.query;

    if (!isDatabaseAvailable()) {
      const shows = listLocalShows({ movieId: movieId || tmdbId, date });
      return res.status(200).json({
        success: true,
        data: shows,
        pagination: { total: shows.length, page: Number(page) || 1, pages: 1 },
        source: 'local_fallback',
      });
    }

    let query = {};

    // Support both movieId (MongoDB) and tmdbId queries
    if (movieId) {
      query.movieId = movieId;
    } else if (tmdbId) {
      query.tmdbId = parseInt(tmdbId);
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const shows = await Show.find(query)
      .populate('movieId', 'title poster_path backdrop_path')
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

    if (!isDatabaseAvailable()) {
      const show = getLocalShow(id);
      if (!show) return res.status(404).json({ success: false, message: 'Show not found' });
      return res.status(200).json({
        success: true,
        data: {
          ...show,
          movieTitle: show.movieId.title,
          posterPath: null,
          availableSeats: show.totalSeats - show.occupiedSeats.length - show.lockedSeats.length,
        },
        source: 'local_fallback',
      });
    }

    const show = await Show.findById(id).populate('movieId');

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    const availableSeats =
      show.totalSeats - show.occupiedSeats.length - (show.lockedSeats?.length || 0);

    const movie = show.movieId;

    const showData = {
      _id: show._id,
      movieId: show.movieId._id,
      movieTitle: movie?.title || 'Unknown',
      posterPath: movie?.poster_path || null,
      date: show.date,
      time: show.time,
      theatre: show.theatre || 'Theatre TBD',
      screen: show.screen || 'Screen TBD',
      price: show.price,
      totalSeats: show.totalSeats,
      occupiedSeats: show.occupiedSeats,
      lockedSeats: show.lockedSeats || [],
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
    const { 
      movieId, 
      tmdbId, 
      movieTitle, 
      date, 
      time, 
      endTime,
      theatre, 
      screen, 
      screenType,
      price, 
      totalSeats,
      rows,
      seatsPerRow,
      seatLayout
    } = req.body;

    // Validation
    if (!date || !time || !price) {
      return res.status(400).json({
        success: false,
        message: 'Date, time, and price are required',
      });
    }

    if (!theatre || !screen) {
      return res.status(400).json({
        success: false,
        message: 'Theatre and screen are required',
      });
    }

    // Require either tmdbId or movieId
    if (!tmdbId && !movieId) {
      return res.status(400).json({
        success: false,
        message: 'Either tmdbId or movieId is required',
      });
    }

    // Dynamic Pricing Logic
    let finalPrice = Number(price);
    const showDate = new Date(date);
    const dayOfWeek = showDate.getDay(); // 0 = Sunday, 6 = Saturday
    const [hours] = time.split(':').map(Number);
    
    // Weekend surge (Friday evening, Saturday, Sunday)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || (dayOfWeek === 5 && hours >= 17);
    if (isWeekend) finalPrice *= 1.2;
    
    // Evening prime time surge (6 PM to 10 PM)
    if (hours >= 18 && hours <= 22) finalPrice *= 1.15;
    
    // Morning discount (before 11 AM)
    if (hours < 11) finalPrice *= 0.8;
    
    finalPrice = Math.round(finalPrice);

    // End Time calculation (assume 3 hours by default if not provided)
    let finalEndTime = endTime;
    if (!finalEndTime) {
      const endHours = (hours + 3) % 24;
      const minutes = time.split(':')[1];
      finalEndTime = `${endHours.toString().padStart(2, '0')}:${minutes}`;
    }

    // Format times properly
    const formatTime = (t) => {
       const [h, m] = t.split(':');
       return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    };
    const formattedTime = formatTime(time);
    finalEndTime = formatTime(finalEndTime);

    // Overlap Validation (only if database is available)
    if (isDatabaseAvailable()) {
       const startOfDay = new Date(showDate);
       startOfDay.setHours(0,0,0,0);
       const endOfDay = new Date(showDate);
       endOfDay.setHours(23,59,59,999);

       const existingShows = await Show.find({
          theatre,
          screen,
          date: { $gte: startOfDay, $lte: endOfDay }
       });

       const timeToMinutes = (t) => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
       };
       
       const newStartMin = timeToMinutes(formattedTime);
       let newEndMin = timeToMinutes(finalEndTime);
       if (newEndMin < newStartMin) newEndMin += 24 * 60; // Crosses midnight

       for (const existingShow of existingShows) {
          const extStartMin = timeToMinutes(existingShow.time);
          let extEndMin = timeToMinutes(existingShow.endTime || formatTime(`${(Number(existingShow.time.split(':')[0]) + 3) % 24}:${existingShow.time.split(':')[1]}`));
          if (extEndMin < extStartMin) extEndMin += 24 * 60;

          // Check overlap
          if (newStartMin < extEndMin && newEndMin > extStartMin) {
             return res.status(409).json({
                success: false,
                message: `Show overlaps with an existing show at ${existingShow.time} on the same screen.`
             });
          }
       }
    }

    // If database not available, use local fallback
    if (!isDatabaseAvailable()) {
      const localShow = createLocalShow({
        tmdbId: tmdbId || movieId,
        movieTitle,
        date,
        time: formattedTime,
        endTime: finalEndTime,
        theatre,
        screen,
        screenType,
        price: finalPrice,
        totalSeats,
      });
      if (!localShow) {
        return res.status(409).json({ success: false, message: 'A matching show already exists' });
      }
      return res.status(201).json({ success: true, data: localShow, source: 'local_fallback' });
    }

    // Determine tmdbId and try to get MongoDB movieId
    let finalTmdbId;
    let dbMovieId = null;
    let finalMovieTitle = movieTitle;

    if (tmdbId) {
      finalTmdbId = parseInt(tmdbId);
      if (isNaN(finalTmdbId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid TMDB ID',
        });
      }

      // Try to find movie in MongoDB by tmdbId
      try {
        const movie = await Movie.findOne({ tmdbId: finalTmdbId }).maxTimeMS(2000);
        if (movie) {
          dbMovieId = movie._id;
          finalMovieTitle = movie.title;
        } else {
          // Try to sync from TMDB (if TMDB is accessible)
          try {
            const syncedMovieId = await ensureMovieInDatabase(finalTmdbId);
            if (syncedMovieId) {
              dbMovieId = syncedMovieId;
              const syncedMovie = await Movie.findById(syncedMovieId);
              finalMovieTitle = syncedMovie.title;
            }
          } catch (syncErr) {
            console.log(`Could not sync movie ${finalTmdbId} from TMDB: ${syncErr.message}`);
            // Continue without MongoDB movieId - will use tmdbId only
          }
        }
      } catch (dbErr) {
        console.log('MongoDB movie lookup failed:', dbErr.message);
      }

      // If no movie title provided and we couldn't get it from DB/TMDB, fail
      if (!finalMovieTitle) {
        return res.status(400).json({
          success: false,
          message: 'Movie title is required when movie is not in database',
        });
      }
    } else if (movieId) {
      // Handle MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(movieId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid movie ID format',
        });
      }
      
      const movie = await Movie.findById(movieId);
      if (!movie) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found',
        });
      }
      
      dbMovieId = movieId;
      finalTmdbId = movie.tmdbId;
      finalMovieTitle = movie.title;
    }

    // Create the show
    const newShow = new Show({
      movieId: dbMovieId, // Can be null if movie not in MongoDB
      tmdbId: finalTmdbId,
      movieTitle: finalMovieTitle,
      date: new Date(date),
      time: formattedTime,
      endTime: finalEndTime,
      theatre,
      screen,
      screenType: screenType || 'Standard',
      price: finalPrice,
      totalSeats: totalSeats || 100,
      rows: rows || 10,
      seatsPerRow: seatsPerRow || 10,
      seatLayout: seatLayout || [],
    });

    await newShow.save();

    // Try to populate movieId if it exists
    let populatedShow = newShow;
    if (newShow.movieId) {
      try {
        populatedShow = await Show.findById(newShow._id).populate('movieId', 'title poster_path backdrop_path');
      } catch (popErr) {
        // If populate fails, just return the show without population
        console.log('Could not populate movieId:', popErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      data: populatedShow,
      message: 'Show created successfully',
    });
  } catch (error) {
    console.error('Error creating show:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating show',
    });
  }
};

export const updateShow = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, endTime, theatre, screen, screenType, price, totalSeats, rows, seatsPerRow, seatLayout } = req.body;

    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Database unavailable, cannot update show',
      });
    }

    const show = await Show.findById(id);
    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    // Prevent editing past shows
    const showDate = new Date(date || show.date);
    const now = new Date();
    if (showDate < now.setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit past shows',
      });
    }

    // Format times
    const formatTime = (t) => {
      const [h, m] = t.split(':');
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    };

    const finalTime = time ? formatTime(time) : show.time;
    let finalEndTime = endTime ? formatTime(endTime) : show.endTime;
    
    if (!finalEndTime && time) {
      const [hours, minutes] = finalTime.split(':');
      const endHours = (parseInt(hours) + 3) % 24;
      finalEndTime = `${endHours.toString().padStart(2, '0')}:${minutes}`;
    }

    // Overlap validation if date/time/screen changed
    if (date || time || theatre || screen) {
      const checkDate = new Date(date || show.date);
      const checkTheatre = theatre || show.theatre;
      const checkScreen = screen || show.screen;
      
      const startOfDay = new Date(checkDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(checkDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingShows = await Show.find({
        _id: { $ne: id }, // Exclude current show
        theatre: checkTheatre,
        screen: checkScreen,
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      const timeToMinutes = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };

      const newStartMin = timeToMinutes(finalTime);
      let newEndMin = timeToMinutes(finalEndTime);
      if (newEndMin < newStartMin) newEndMin += 24 * 60;

      for (const existingShow of existingShows) {
        const extStartMin = timeToMinutes(existingShow.time);
        let extEndMin = timeToMinutes(existingShow.endTime || `${(parseInt(existingShow.time.split(':')[0]) + 3) % 24}:${existingShow.time.split(':')[1]}`);
        if (extEndMin < extStartMin) extEndMin += 24 * 60;

        if (newStartMin < extEndMin && newEndMin > extStartMin) {
          return res.status(409).json({
            success: false,
            message: `Show overlaps with an existing show at ${existingShow.time} on the same screen.`,
          });
        }
      }
    }

    // Update fields
    if (date) show.date = new Date(date);
    if (time) show.time = finalTime;
    if (finalEndTime) show.endTime = finalEndTime;
    if (theatre) show.theatre = theatre;
    if (screen) show.screen = screen;
    if (screenType) show.screenType = screenType;
    if (price) show.price = price;
    if (totalSeats) show.totalSeats = totalSeats;
    if (rows) show.rows = rows;
    if (seatsPerRow) show.seatsPerRow = seatsPerRow;
    if (seatLayout) show.seatLayout = seatLayout;

    await show.save();

    const updatedShow = await Show.findById(id).populate('movieId', 'title poster_path backdrop_path');

    return res.status(200).json({
      success: true,
      message: 'Show updated successfully',
      data: updatedShow,
    });
  } catch (error) {
    console.error('Error updating show:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating show',
    });
  }
};

export const duplicateShow = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Date and time are required for duplication',
      });
    }

    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Database unavailable, cannot duplicate show',
      });
    }

    const originalShow = await Show.findById(id);
    if (!originalShow) {
      return res.status(404).json({
        success: false,
        message: 'Original show not found',
      });
    }

    // Prevent duplicating to past dates
    const newDate = new Date(date);
    const now = new Date();
    if (newDate < now.setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create show in the past',
      });
    }

    // Format time
    const formatTime = (t) => {
      const [h, m] = t.split(':');
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    };
    const formattedTime = formatTime(time);

    // Calculate end time
    const [hours] = formattedTime.split(':').map(Number);
    const endHours = (hours + 3) % 24;
    const minutes = formattedTime.split(':')[1];
    const endTime = `${endHours.toString().padStart(2, '0')}:${minutes}`;

    // Check for overlaps
    const startOfDay = new Date(newDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(newDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingShows = await Show.find({
      theatre: originalShow.theatre,
      screen: originalShow.screen,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    const timeToMinutes = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const newStartMin = timeToMinutes(formattedTime);
    let newEndMin = timeToMinutes(endTime);
    if (newEndMin < newStartMin) newEndMin += 24 * 60;

    for (const existingShow of existingShows) {
      const extStartMin = timeToMinutes(existingShow.time);
      let extEndMin = timeToMinutes(existingShow.endTime || `${(parseInt(existingShow.time.split(':')[0]) + 3) % 24}:${existingShow.time.split(':')[1]}`);
      if (extEndMin < extStartMin) extEndMin += 24 * 60;

      if (newStartMin < extEndMin && newEndMin > extStartMin) {
        return res.status(409).json({
          success: false,
          message: `Show overlaps with an existing show at ${existingShow.time} on the same screen.`,
        });
      }
    }

    // Create duplicate
    const duplicatedShow = new Show({
      movieId: originalShow.movieId,
      tmdbId: originalShow.tmdbId,
      movieTitle: originalShow.movieTitle,
      date: newDate,
      time: formattedTime,
      endTime,
      theatre: originalShow.theatre,
      screen: originalShow.screen,
      screenType: originalShow.screenType,
      price: originalShow.price,
      totalSeats: originalShow.totalSeats,
      rows: originalShow.rows,
      seatsPerRow: originalShow.seatsPerRow,
      occupiedSeats: [], // Reset bookings
      lockedSeats: [], // Reset locks
    });

    await duplicatedShow.save();

    const populatedShow = await Show.findById(duplicatedShow._id).populate('movieId', 'title poster_path backdrop_path');

    return res.status(201).json({
      success: true,
      message: 'Show duplicated successfully',
      data: populatedShow,
    });
  } catch (error) {
    console.error('Error duplicating show:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error duplicating show',
    });
  }
};

export const getShowStats = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Database unavailable',
      });
    }

    const show = await Show.findById(id).populate('movieId', 'title poster_path');

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    const Booking = mongoose.model('Booking');
    const bookings = await Booking.find({ showId: id, status: 'confirmed' });

    const bookedSeats = show.occupiedSeats.length;
    const lockedSeats = show.lockedSeats?.length || 0;
    const availableSeats = show.totalSeats - bookedSeats - lockedSeats;
    const occupancyPercentage = ((bookedSeats / show.totalSeats) * 100).toFixed(2);
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.amount, 0);

    return res.status(200).json({
      success: true,
      data: {
        show,
        bookedSeats,
        availableSeats,
        lockedSeats,
        occupancyPercentage,
        totalBookings: bookings.length,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('Error fetching show stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching show statistics',
    });
  }
};

export const removeShow = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isDatabaseAvailable()) {
      if (!removeLocalShow(id)) {
        return res.status(404).json({ success: false, message: 'Show not found' });
      }
      return res.status(200).json({ success: true, message: 'Show deleted successfully', source: 'local_fallback' });
    }

    const show = await Show.findById(id);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    // Prevent deleting shows with confirmed bookings
    const Booking = mongoose.model('Booking');
    const confirmedBookings = await Booking.countDocuments({
      showId: id,
      status: 'confirmed',
    });

    if (confirmedBookings > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete show. It has ${confirmedBookings} confirmed bookings.`,
      });
    }

    // Delete any pending bookings
    await Booking.deleteMany({
      showId: id,
      status: { $in: ['pending', 'failed'] },
    });

    await show.deleteOne();

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

    if (!isDatabaseAvailable()) {
      const dates = [...new Set(listLocalShows({ movieId }).map((show) => show.date))]
        .sort((a, b) => new Date(a) - new Date(b));
      return res.status(200).json({ success: true, data: dates, source: 'local_fallback' });
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

    if (!isDatabaseAvailable()) {
      return res.status(200).json({
        success: true,
        data: listLocalShows({ movieId: normaliseMovieId(movieId), date }),
        source: 'local_fallback',
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
