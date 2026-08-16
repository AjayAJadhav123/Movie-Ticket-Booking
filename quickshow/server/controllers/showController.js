import Show from '../models/Show.js';
import Movie from '../models/Movie.js';

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

    const shows = await Show.find({ movieId }).select('date').distinct('date');

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

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const shows = await Show.find({
      movieId,
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
