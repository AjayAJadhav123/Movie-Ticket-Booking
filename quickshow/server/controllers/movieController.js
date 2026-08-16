import axios from 'axios';
import Movie from '../models/Movie.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Function to get TMDB API key at runtime
const getTMDBKey = () => process.env.TMDB_API_KEY;

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
    const TMDB_API_KEY = getTMDBKey();

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
    const TMDB_API_KEY = getTMDBKey();
    
    if (!TMDB_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'TMDB API key not configured',
      });
    }

    let retries = 0;
    const maxRetries = 2;

    while (retries < maxRetries) {
      try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/now_playing`, {
          params: {
            api_key: TMDB_API_KEY,
            page: 1,
          },
          timeout: 5000,
        });

        if (response.data && response.data.results) {
          return res.status(200).json({
            success: true,
            data: response.data.results.slice(0, 10),
          });
        }
      } catch (err) {
        retries++;
        if (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    console.warn('TMDB now_playing endpoint unavailable after retries');
    return res.status(200).json({
      success: true,
      data: [],
      message: 'Currently no data available from TMDB. Please try again later.',
    });
  } catch (error) {
    console.error('Error fetching now playing movies from TMDB:', error.message);
    return res.status(200).json({
      success: true,
      data: [],
      message: 'TMDB service temporarily unavailable',
    });
  }
};

export const getTrendingMovies = async (req, res) => {
  try {
    const TMDB_API_KEY = getTMDBKey();
    
    if (!TMDB_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'TMDB API key not configured',
      });
    }

    let retries = 0;
    const maxRetries = 2;
    let lastError = null;

    while (retries < maxRetries) {
      try {
        const response = await axios.get(`${TMDB_BASE_URL}/trending/movie/day`, {
          params: {
            api_key: TMDB_API_KEY,
          },
          timeout: 5000,
        });

        if (response.data && response.data.results) {
          return res.status(200).json({
            success: true,
            data: response.data.results.slice(0, 10),
          });
        }
      } catch (err) {
        lastError = err;
        retries++;
        if (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    console.warn('TMDB trending endpoint unavailable after retries');
    return res.status(200).json({
      success: true,
      data: [],
      message: 'Currently no data available from TMDB. Please try again later.',
    });
  } catch (error) {
    console.error('Error fetching trending movies from TMDB:', error.message);
    return res.status(200).json({
      success: true,
      data: [],
      message: 'TMDB service temporarily unavailable',
    });
  }
};

export const getUpcomingMovies = async (req, res) => {
  try {
    const TMDB_API_KEY = getTMDBKey();
    
    if (!TMDB_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'TMDB API key not configured',
      });
    }

    let retries = 0;
    const maxRetries = 2;
    let lastError = null;

    while (retries < maxRetries) {
      try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/upcoming`, {
          params: {
            api_key: TMDB_API_KEY,
            page: 1,
          },
          timeout: 5000,
        });

        if (response.data && response.data.results) {
          return res.status(200).json({
            success: true,
            data: response.data.results.slice(0, 10),
          });
        }
      } catch (err) {
        lastError = err;
        retries++;
        if (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    console.warn('TMDB upcoming endpoint unavailable after retries');
    return res.status(200).json({
      success: true,
      data: [],
      message: 'Currently no data available from TMDB. Please try again later.',
    });
  } catch (error) {
    console.error('Error fetching upcoming movies from TMDB:', error.message);
    return res.status(200).json({
      success: true,
      data: [],
      message: 'TMDB service temporarily unavailable',
    });
  }
};

export const getPopularMovies = async (req, res) => {
  try {
    const TMDB_API_KEY = getTMDBKey();
    
    if (!TMDB_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'TMDB API key not configured',
      });
    }

    let retries = 0;
    const maxRetries = 2;
    let lastError = null;

    while (retries < maxRetries) {
      try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
          params: {
            api_key: TMDB_API_KEY,
            page: 1,
          },
          timeout: 5000,
        });

        if (response.data && response.data.results) {
          return res.status(200).json({
            success: true,
            data: response.data.results.slice(0, 10),
          });
        }
      } catch (err) {
        lastError = err;
        retries++;
        if (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    console.warn('TMDB popular endpoint unavailable after retries');
    return res.status(200).json({
      success: true,
      data: [],
      message: 'Currently no data available from TMDB. Please try again later.',
    });
  } catch (error) {
    console.error('Error fetching popular movies from TMDB:', error.message);
    return res.status(200).json({
      success: true,
      data: [],
      message: 'TMDB service temporarily unavailable',
    });
  }
};

export const getLatestMovies = async (req, res) => {
  try {
    const TMDB_API_KEY = getTMDBKey();
    
    if (!TMDB_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'TMDB API key not configured',
      });
    }

    // Fetch multiple pages to get more recent movies
    let allMovies = [];
    let retries = 0;
    const maxRetries = 2;

    for (let page = 1; page <= 3; page++) {
      try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/now_playing`, {
          params: {
            api_key: TMDB_API_KEY,
            region: 'IN',
            page: page,
          },
          timeout: 5000,
        });

        if (response.data && response.data.results) {
          allMovies = allMovies.concat(response.data.results);
        }
      } catch (err) {
        retries++;
        if (retries >= maxRetries) break;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Remove duplicates by id
    const uniqueMovies = Array.from(
      new Map(allMovies.map((m) => [m.id, m])).values()
    );

    // Sort by release_date descending (newest first)
    const sortedMovies = uniqueMovies
      .filter((m) => m.release_date && m.poster_path)
      .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
      .slice(0, 20);

    if (sortedMovies.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No latest movies available',
      });
    }

    return res.status(200).json({
      success: true,
      data: sortedMovies,
    });
  } catch (error) {
    console.error('Error fetching latest movies:', error.message);
    return res.status(200).json({
      success: true,
      data: [],
      message: 'TMDB service temporarily unavailable',
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
