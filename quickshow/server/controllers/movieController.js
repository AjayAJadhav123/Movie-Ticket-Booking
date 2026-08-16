import axios from 'axios';
import Movie from '../models/Movie.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

export const getMovieList = async (req, res) => {
  try {
    const { page = 1, genre, language, search } = req.query;

    let query = {};

    if (genre) {
      query.genres = { $in: [genre] };
    }

    if (language) {
      query.language = language;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const movies = await Movie.find(query)
      .limit(20)
      .skip((page - 1) * 20)
      .sort({ createdAt: -1 });

    const total = await Movie.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: movies,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / 20),
      },
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching movies',
    });
  }
};

export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;

    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    console.error('Error fetching movie:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching movie',
    });
  }
};

export const addMovieFromTMDB = async (req, res) => {
  try {
    const { tmdbId } = req.body;

    if (!tmdbId) {
      return res.status(400).json({
        success: false,
        message: 'TMDB ID is required',
      });
    }

    const existingMovie = await Movie.findOne({ tmdbId });
    if (existingMovie) {
      return res.status(409).json({
        success: false,
        message: 'Movie already exists in database',
      });
    }

    const movieResponse = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: { api_key: TMDB_API_KEY },
    });

    const movieData = movieResponse.data;

    const creditsResponse = await axios.get(
      `${TMDB_BASE_URL}/movie/${tmdbId}/credits`,
      {
        params: { api_key: TMDB_API_KEY },
      }
    );

    const cast = creditsResponse.data.cast
      .slice(0, 10)
      .map((actor) => actor.name);

    const videosResponse = await axios.get(
      `${TMDB_BASE_URL}/movie/${tmdbId}/videos`,
      {
        params: { api_key: TMDB_API_KEY },
      }
    );

    const trailer = videosResponse.data.results.find(
      (video) => video.type === 'Trailer'
    );

    const newMovie = new Movie({
      title: movieData.title,
      overview: movieData.overview,
      poster_path: movieData.poster_path,
      backdrop_path: movieData.backdrop_path,
      release_date: movieData.release_date,
      genres: movieData.genres.map((g) => g.name),
      cast,
      tmdbId: movieData.id,
      language: movieData.original_language,
      rating: movieData.vote_average,
      trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
    });

    await newMovie.save();

    return res.status(201).json({
      success: true,
      data: newMovie,
    });
  } catch (error) {
    console.error('Error adding movie from TMDB:', error);
    return res.status(500).json({
      success: false,
      message: error.response?.data?.status_message || 'Error adding movie from TMDB',
    });
  }
};

export const getNowPlayingMovies = async (req, res) => {
  try {
    if (!TMDB_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'TMDB API key not configured',
      });
    }

    const response = await axios.get(`${TMDB_BASE_URL}/movie/now_playing`, {
      params: {
        api_key: TMDB_API_KEY,
        page: 1,
      },
    });

    return res.status(200).json({
      success: true,
      data: response.data.results.slice(0, 10),
    });
  } catch (error) {
    console.error('Error fetching now playing movies from TMDB:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching now playing movies',
    });
  }
};

export const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;

    const movie = await Movie.findByIdAndDelete(id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Movie deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting movie:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting movie',
    });
  }
};
