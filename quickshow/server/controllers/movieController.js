import axios from 'axios';
import mongoose from 'mongoose';
import Movie from '../models/Movie.js';

const TMDB_BASE_URL = 'https://api.tmdb.org/3';

// Function to get TMDB API key at runtime
const getTMDBKey = () => process.env.TMDB_API_KEY;



const DEFAULT_TMDB_TIMEOUT_MS = 3000;
const TMDB_TRANSIENT_ERROR_CODES = new Set([
  'ETIMEDOUT',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ECONNABORTED',
]);

const toGenreNames = (genres) =>
  Array.isArray(genres)
    ? genres
        .map((genre) => (typeof genre === 'string' ? genre : genre?.name))
        .filter(Boolean)
    : [];

const normalizeMovie = (movie = {}) => {
  const candidateId = movie.id ?? movie.tmdbId ?? movie._id;
  const normalizedId = candidateId != null ? String(candidateId) : '';
  const poster = movie.poster ?? movie.poster_path ?? null;
  const backdrop = movie.backdrop ?? movie.backdrop_path ?? null;
  const ratingRaw = movie.rating ?? movie.vote_average ?? 0;
  const rating = Number.isFinite(Number(ratingRaw)) ? Number(ratingRaw) : 0;
  const releaseDate = movie.releaseDate ?? movie.release_date ?? null;
  const genres = toGenreNames(movie.genres);

  return {
    ...movie,
    id: candidateId ?? null,
    _id: normalizedId,
    tmdbId: movie.tmdbId ?? movie.id ?? null,
    title: movie.title ?? '',
    poster,
    backdrop,
    overview: movie.overview ?? '',
    rating,
    releaseDate,
    genres,
    runtime: movie.runtime ?? null,
    cast: Array.isArray(movie.cast) ? movie.cast : [],
    trailer: movie.trailer ?? null,
    poster_path: poster,
    backdrop_path: backdrop,
    release_date: releaseDate,
    vote_average: rating,
  };
};

async function fetchFromTMDB(endpoint, params, timeoutMs = DEFAULT_TMDB_TIMEOUT_MS) {
  return axios.get(`${TMDB_BASE_URL}${endpoint}`, {
    params,
    timeout: timeoutMs,
  });
}

async function fetchTMDBResults(endpoint, params, timeoutMs = DEFAULT_TMDB_TIMEOUT_MS) {
  const response = await fetchFromTMDB(endpoint, params, timeoutMs);
  return response.data?.results || [];
}

const isTMDBUnavailableError = (error) =>
  TMDB_TRANSIENT_ERROR_CODES.has(error?.code) ||
  error?.message?.toLowerCase()?.includes('timeout');

const toTMDBUnavailableResponse = (res, endpointLabel) =>
  res.status(503).json({
    success: false,
    message: `${endpointLabel} unavailable. Please try again shortly.`,
    data: [],
  });

const isDatabaseAvailable = () => mongoose.connection.readyState === 1;
const toCatalogueMovie = (movie) => normalizeMovie(movie);

export const getMovieList = async (req, res) => {
  try {
    const { page = 1, genre, language, search } = req.query;

    const TMDB_API_KEY = getTMDBKey();
    if (!TMDB_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'TMDB API key not configured',
      });
    }

    // The public catalogue must work even when a development database is not
    // available. Query TMDB directly in that case instead of buffering a
    // Mongoose operation until it times out.
    if (!isDatabaseAvailable()) {
      const endpoint = search ? '/search/movie' : '/discover/movie';
      const popularFallbackEndpoint = '/movie/popular';
      try {
        const tmdbMovies = await fetchTMDBResults(endpoint, {
          api_key: TMDB_API_KEY,
          page: Math.max(Number(page) || 1, 1),
          language: language || 'en-US',
          ...(search ? { query: search } : { sort_by: 'popularity.desc' }),
        });
        const normalized = tmdbMovies.map(toCatalogueMovie);
        const filtered = genre
          ? normalized.filter((movie) => movie.genres?.includes(genre))
          : normalized;

        return res.status(200).json({
          success: true,
          data: filtered,
          pagination: { total: filtered.length, page: Number(page) || 1, pages: 1 },
          source: 'tmdb',
        });
      } catch (tmdbError) {
        console.error('TMDB list error (discover):', tmdbError.message);
        // Discover timed out — fall back to /movie/popular which is faster
        try {
          const popularMovies = await fetchTMDBResults(popularFallbackEndpoint, {
            api_key: TMDB_API_KEY,
            page: Math.max(Number(page) || 1, 1),
          }, 3000);
          const normalized = popularMovies.map(toCatalogueMovie);
          return res.status(200).json({
            success: true,
            data: normalized,
            pagination: { total: normalized.length, page: Number(page) || 1, pages: 10 },
            source: 'tmdb-popular',
          });
        } catch (popularError) {
          console.error('TMDB popular fallback also failed:', popularError.message);
          return res.status(503).json({
            success: false,
            message: 'TMDB service temporarily unavailable. Please try again shortly.',
            data: [],
            pagination: { total: 0, page: 1, pages: 0 },
            source: 'error',
          });
        }
      }
    }

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
    const id = String(req.params.id).replace(/^tmdb_/, '');

    // Try MongoDB first (for database movies)
    try {
      if (!isDatabaseAvailable() || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Database lookup skipped');
      }
      const movie = await Movie.findById(id);
      if (movie) {
        return res.status(200).json({
          success: true,
          data: toCatalogueMovie({ ...movie.toObject(), id: movie.tmdbId ?? movie._id }),
        });
      }
    } catch (dbErr) {
      // If it's not a valid MongoDB ID, try TMDB or fallback
    }

    // If not found in database, try TMDB by ID
    const TMDB_API_KEY = getTMDBKey();
    if (TMDB_API_KEY) {
      try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
          params: { 
            api_key: TMDB_API_KEY,
            append_to_response: 'credits,videos,similar'
          },
          timeout: 8000,
        });

        if (response.data) {
          const tmdbData = response.data;
          
          const trailer = tmdbData.videos?.results?.find(
            (video) => video.type === 'Trailer'
          );

          const cast = tmdbData.credits?.cast
            ?.slice(0, 10)
            .map((actor) => actor.name) || [];
            
          const similar = tmdbData.similar?.results
            ?.filter((m) => m.poster_path)
            ?.slice(0, 10)
            .map(toCatalogueMovie) || [];

          const movieData = toCatalogueMovie({
            id: tmdbData.id,
            tmdbId: tmdbData.id,
            title: tmdbData.title,
            overview: tmdbData.overview,
            poster_path: tmdbData.poster_path,
            backdrop_path: tmdbData.backdrop_path,
            release_date: tmdbData.release_date,
            genres: tmdbData.genres?.map((g) => g.name) || [],
            cast,
            vote_average: tmdbData.vote_average,
            language: tmdbData.original_language,
            runtime: tmdbData.runtime ?? null,
            trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
            similar,
          });

          return res.status(200).json({
            success: true,
            data: movieData,
          });
        }
      } catch (tmdbErr) {
        console.error('Error fetching from TMDB:', tmdbErr.message);
      }
    }

    return res.status(404).json({
      success: false,
      message: 'Movie not found',
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
    const { page = 1 } = req.query;
    const TMDB_API_KEY = getTMDBKey();
    
    if (!TMDB_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'TMDB API key not configured',
        data: [],
        pagination: { total: 0, page: 1, pages: 0 },
        source: 'error',
      });
    }

    console.log(`📡 TMDB /movie/now_playing request: page=${page}`);
    const response = await fetchFromTMDB('/movie/now_playing', {
      api_key: TMDB_API_KEY,
      page,
    }, 3000);

    console.log(`✅ TMDB /movie/now_playing response: results=${response.data.results?.length}`);

    return res.status(200).json({
      success: true,
      data: response.data.results.map(toCatalogueMovie),
      pagination: { total: response.data.total_results, page: response.data.page, pages: response.data.total_pages },
      source: 'tmdb',
    });
  } catch (error) {
    console.error(`❌ TMDB /movie/now_playing failed:`, error.message);
    return res.status(503).json({
      success: false,
      message: 'TMDB service temporarily unavailable. Please try again in a few moments.',
      data: [],
      pagination: { total: 0, page: 1, pages: 0 },
      source: 'error',
    });
  }
};

export const getTrendingMovies = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const TMDB_API_KEY = getTMDBKey();
    
    if (!TMDB_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'TMDB API key not configured',
        data: [],
        pagination: { total: 0, page: 1, pages: 0 },
        source: 'error',
      });
    }

    console.log(`📡 TMDB /trending/movie/day request: page=${page}`);
    const response = await fetchFromTMDB('/trending/movie/day', {
      api_key: TMDB_API_KEY,
      page,
    }, 3000);

    console.log(`✅ TMDB /trending/movie/day response: results=${response.data.results?.length}`);

    return res.status(200).json({
      success: true,
      data: response.data.results.map(toCatalogueMovie),
      pagination: { total: response.data.total_results, page: response.data.page, pages: response.data.total_pages },
      source: 'tmdb',
    });
  } catch (error) {
    console.error(`❌ TMDB /trending/movie/day failed:`, error.message);
    return res.status(503).json({
      success: false,
      message: 'TMDB service temporarily unavailable. Please try again in a few moments.',
      data: [],
      pagination: { total: 0, page: 1, pages: 0 },
      source: 'error',
    });
  }
};

export const getUpcomingMovies = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const TMDB_API_KEY = getTMDBKey();
    
    if (!TMDB_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'TMDB API key not configured',
        data: [],
        pagination: { total: 0, page: 1, pages: 0 },
        source: 'error',
      });
    }

    console.log(`📡 TMDB /movie/upcoming request: page=${page}`);
    const response = await fetchFromTMDB('/movie/upcoming', {
      api_key: TMDB_API_KEY,
      page,
    }, 3000);

    console.log(`✅ TMDB /movie/upcoming response: results=${response.data.results?.length}`);

    return res.status(200).json({
      success: true,
      data: response.data.results.map(toCatalogueMovie),
      pagination: { total: response.data.total_results, page: response.data.page, pages: response.data.total_pages },
      source: 'tmdb',
    });
  } catch (error) {
    console.error(`❌ TMDB /movie/upcoming failed:`, error.message);
    return res.status(503).json({
      success: false,
      message: 'TMDB service temporarily unavailable. Please try again in a few moments.',
      data: [],
      pagination: { total: 0, page: 1, pages: 0 },
      source: 'error',
    });
  }
};

export const getPopularMovies = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const TMDB_API_KEY = getTMDBKey();
    
    if (!TMDB_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'TMDB API key not configured',
        data: [],
        pagination: { total: 0, page: 1, pages: 0 },
        source: 'error',
      });
    }

    console.log(`📡 TMDB /movie/popular request: page=${page}, timeout=3000ms`);
    const start = Date.now();
    const response = await fetchFromTMDB('/movie/popular', {
      api_key: TMDB_API_KEY,
      page,
    }, 3000);
    const elapsed = Date.now() - start;

    console.log(`✅ TMDB /movie/popular response: status=${response.status}, time=${elapsed}ms, results=${response.data.results?.length || 0}, total_pages=${response.data.total_pages}`);

    return res.status(200).json({
      success: true,
      data: response.data.results.map(toCatalogueMovie),
      pagination: { total: response.data.total_results, page: response.data.page, pages: response.data.total_pages },
      source: 'tmdb',
    });
  } catch (error) {
    console.error(`❌ TMDB /movie/popular failed: code=${error.code}, message=${error.message}`);
    
    // Return 503 Service Unavailable instead of silently serving demo movies
    return res.status(503).json({
      success: false,
      message: 'TMDB service temporarily unavailable. Please try again in a few moments.',
      data: [],
      pagination: { total: 0, page: 1, pages: 0 },
      source: 'error',
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }
};

export const getLatestMovies = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const TMDB_API_KEY = getTMDBKey();
    
    if (!TMDB_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'TMDB API key not configured',
        data: [],
        pagination: { total: 0, page: 1, pages: 0 },
        source: 'error',
      });
    }

    // Try now_playing first; if it times out fall back to popular (faster)
    console.log(`📡 TMDB /movie/now_playing request (for latest): page=${page}`);
    let response = null;
    try {
      response = await fetchFromTMDB('/movie/now_playing', {
        api_key: TMDB_API_KEY,
        region: 'IN',
        page,
      }, 3000);
      console.log(`✅ TMDB /movie/now_playing response: results=${response.data.results?.length}`);
    } catch (nowPlayingErr) {
      console.warn(`⏱️ /movie/now_playing timed out, trying /movie/popular as fallback:`, nowPlayingErr.message);
      try {
        response = await fetchFromTMDB('/movie/popular', {
          api_key: TMDB_API_KEY,
          page,
        }, 3000);
        console.log(`✅ TMDB /movie/popular response: results=${response.data.results?.length}`);
      } catch (popularErr) {
        console.error(`❌ /movie/popular also failed:`, popularErr.message);
        throw popularErr; // Re-throw to be caught by outer catch
      }
    }
    
    if (response) {
      const validMovies = response.data.results
        .filter((m) => m.release_date && m.poster_path)
        .map(toCatalogueMovie);

      return res.status(200).json({
        success: true,
        data: validMovies,
        pagination: { total: response.data.total_results, page: response.data.page, pages: response.data.total_pages },
        source: 'tmdb',
      });
    }
    
    // Should not reach here, but just in case
    throw new Error('No response from TMDB');
  } catch (error) {
    console.error(`❌ TMDB latest movies request failed:`, error.message);
    return res.status(503).json({
      success: false,
      message: 'TMDB service temporarily unavailable. Please try again in a few moments.',
      data: [],
      pagination: { total: 0, page: 1, pages: 0 },
      source: 'error',
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

export const searchMovies = async (req, res) => {
  try {
    const { query, search, localOnly, page = 1 } = req.query;
    const activeQuery = query || search;
    const pageNum = Number(page) || 1;

    if (!activeQuery || activeQuery.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const searchTerm = activeQuery.trim().toLowerCase();
    const TMDB_API_KEY = getTMDBKey();

    // Search in database first (with 2s timeout to avoid hanging when DB is offline)
    // Only fetch DB results on page 1 to avoid duplicating them on subsequent pages
    let dbResults = [];
    if (pageNum === 1 && isDatabaseAvailable()) {
      try {
        dbResults = await Movie.find({
          title: { $regex: searchTerm, $options: 'i' },
        }).limit(10).maxTimeMS(2000);
      } catch (dbErr) {
        console.warn('Database search unavailable:', dbErr.message);
      }
    }

    if (localOnly === 'true') {
      const normalizedDbResults = dbResults.map(movie => toCatalogueMovie(movie.toObject ? movie.toObject() : movie));
      return res.status(200).json({
        success: true,
        data: normalizedDbResults,
        pagination: { total: normalizedDbResults.length, page: 1, pages: 1 },
        source: 'database',
      });
    }

    // Search TMDB with a hard 3-second deadline (fast fail when unreachable)
    let tmdbResults = [];
    let pagination = { total: 0, page: pageNum, pages: 1 };
    
    if (TMDB_API_KEY) {
      try {
        const controller = new AbortController();
        const tmdbTimeout = setTimeout(() => controller.abort(), 8000);
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
          params: { api_key: TMDB_API_KEY, query: searchTerm, page: pageNum },
          timeout: 8000,
          signal: controller.signal,
        });
        clearTimeout(tmdbTimeout);

        if (response.data && response.data.results) {
          pagination = { 
            total: response.data.total_results, 
            page: response.data.page, 
            pages: response.data.total_pages 
          };
          tmdbResults = response.data.results
            .filter((movie) => movie.poster_path && movie.release_date)
            .map((movie) =>
              toCatalogueMovie({
                ...movie,
                genres: movie.genres || [],
                language: movie.original_language,
              })
            );
        }
      } catch (tmdbError) {
        console.warn('TMDB search unavailable:', tmdbError.message);
      }
    }

    // Combine results (database first, then TMDB, avoiding duplicates by TMDB ID)
    const normalizedDbResults = dbResults.map(movie => toCatalogueMovie(movie.toObject ? movie.toObject() : movie));
    const tmdbIds = new Set(tmdbResults.map(m => m.id));
    const dbFiltered = normalizedDbResults.filter(m => !tmdbIds.has(m.tmdbId));
    
    let combinedResults = [...dbFiltered, ...tmdbResults];

    return res.status(200).json({
      success: true,
      data: combinedResults,
      pagination,
      source: tmdbResults.length > 0 ? 'tmdb' : 'database',
    });
  } catch (error) {
    console.error('Error searching movies:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching movies',
    });
  }
};

export const searchTMDBMovies = async (req, res) => {
  try {
    const { query, page = 1 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, pages: 1 },
      });
    }

    const TMDB_API_KEY = getTMDBKey();
    if (!TMDB_API_KEY) {
      return res.status(200).json({
        success: true,
        data: FALLBACK_DEMO_MOVIES.filter(movie =>
          movie.title.toLowerCase().includes(query.toLowerCase()) ||
          movie.overview.toLowerCase().includes(query.toLowerCase())
        ),
        pagination: { total: 1, page: 1, pages: 1 },
        message: 'Showing demo movies (TMDB API key not configured)',
        source: 'fallback',
      });
    }

    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          query: query.trim(),
          page: Number(page) || 1,
        },
        timeout: 4000,
      });

      if (response.data && response.data.results) {
        const results = response.data.results
          .filter((movie) => movie.poster_path && movie.release_date)
          .map((movie) => ({
            id: movie.id,
            title: movie.title,
            overview: movie.overview,
            poster_path: movie.poster_path,
            backdrop_path: movie.backdrop_path,
            release_date: movie.release_date,
            vote_average: movie.vote_average,
          }));

        return res.status(200).json({
          success: true,
          data: results,
          pagination: {
            total: response.data.total_results,
            page: response.data.page,
            pages: response.data.total_pages,
          }
        });
      }
    } catch (tmdbError) {
      console.error('TMDB search error:', tmdbError.message);
      const fallbackResults = FALLBACK_DEMO_MOVIES.filter(movie =>
        movie.title.toLowerCase().includes(query.toLowerCase()) ||
        movie.overview.toLowerCase().includes(query.toLowerCase()) ||
        movie.genres.some(genre => genre.toLowerCase().includes(query.toLowerCase()))
      ).map(toCatalogueMovie);

      return res.status(200).json({
        success: true,
        data: fallbackResults,
        pagination: { total: fallbackResults.length, page: 1, pages: 1 },
        message: 'Showing demo movies (TMDB unavailable)',
        source: 'fallback',
      });
    }

    return res.status(200).json({
      success: true,
      data: [],
      pagination: { total: 0, page: 1, pages: 1 },
      message: 'No results found',
    });
  } catch (error) {
    console.error('Error searching TMDB movies:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching movies',
    });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    // Guests should still see useful recommendations rather than receiving a 401.
    // Never accept a user ID from the query string: that could expose another
    // user's personalized results.
    const userId = req.userId;
    if (!userId) {
      return getPopularMoviesAsRecommendations(req, res);
    }

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL;
    if (!AI_SERVICE_URL) {
      console.warn('AI_SERVICE_URL not configured, returning popular movies as fallback');
      return getPopularMoviesAsRecommendations(req, res);
    }

    try {
      // Call AI service with timeout
      const response = await axios.get(
        `${AI_SERVICE_URL}/api/recommendations/${userId}`,
        {
          timeout: 10000, // 10 second timeout
          params: {
            limit: 10,
            exclude_watched: true,
          },
        }
      );

      if (response.data && response.data.success && response.data.data) {
        // Convert AI service response to include full movie data from database
        const recommendations = await Promise.all(
          response.data.data.map(async (rec) => {
            try {
              const movie = await Movie.findById(rec.movie_id);
              if (movie) {
                return {
                  ...movie.toObject(),
                  recommendation_score: rec.score,
                };
              }
              return null;
            } catch (err) {
              return null;
            }
          })
        );

        const validRecommendations = recommendations.filter((r) => r !== null);

        if (validRecommendations.length > 0) {
          return res.status(200).json({
            success: true,
            data: validRecommendations,
            source: 'ai_personalized',
          });
        }
      }

      // A healthy AI request may legitimately have no matching movies. Do not
      // leave the HTTP request open; provide the same useful fallback instead.
      return getPopularMoviesAsRecommendations(req, res);
    } catch (aiError) {
      console.error('AI service error:', aiError.message);
      // Fallback to popular movies
      return getPopularMoviesAsRecommendations(req, res);
    }
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
    });
  }
};

// Helper function to return popular movies as fallback
const getPopularMoviesAsRecommendations = async (req, res) => {
  try {
    const movies = await Movie.find()
      .sort({ rating: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      data: movies,
      source: 'popular_fallback',
      message: 'AI service unavailable, showing popular movies instead',
    });
  } catch (error) {
    console.error('Error fetching fallback recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
    });
  }
};
