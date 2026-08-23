/**
 * Movie Service - Abstraction layer for movie data
 * Priority: TMDB → MongoDB Cache → Fallback
 */

import axios from 'axios';
import Movie from '../models/Movie.js';

const TMDB_BASE_URL = 'https://api.tmdb.org/3';
const TMDB_TIMEOUT = 4000; // 4 seconds

// Fallback movies (emergency only)
export const FALLBACK_MOVIES = [
  {
    id: 550,
    tmdbId: 550,
    title: 'Fight Club',
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
    poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    release_date: '1999-10-15',
    vote_average: 8.4,
    genres: ['Drama', 'Thriller', 'Comedy'],
    runtime: 139,
  },
  {
    id: 278,
    tmdbId: 278,
    title: 'The Shawshank Redemption',
    overview: 'Imprisoned in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.',
    poster_path: '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
    backdrop_path: '/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
    release_date: '1994-09-23',
    vote_average: 8.7,
    genres: ['Drama', 'Crime'],
    runtime: 142,
  },
  {
    id: 238,
    tmdbId: 238,
    title: 'The Godfather',
    overview: 'Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.',
    poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    backdrop_path: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
    release_date: '1972-03-14',
    vote_average: 8.7,
    genres: ['Drama', 'Crime'],
    runtime: 175,
  },
  {
    id: 19404,
    tmdbId: 19404,
    title: 'Dilwale Dulhania Le Jayenge',
    overview: 'Raj is a rich, carefree, happy-go-lucky second generation NRI. Simran is the daughter of Chaudhary Baldev Singh.',
    poster_path: '/lfRkUr7DYdHldAqi3PwdQGBRBPM.jpg',
    backdrop_path: '/90ezh6SNH7TfhS5Yd9M6yTxZTpR.jpg',
    release_date: '1995-10-20',
    vote_average: 8.7,
    genres: ['Comedy', 'Drama', 'Romance'],
    runtime: 189,
  },
  {
    id: 19995,
    tmdbId: 19995,
    title: 'Avatar',
    overview: 'In the 22nd century, a paraplegic Marine is dispatched to the moon Pandora on a unique mission.',
    poster_path: '/kyeqWdyUXW608qlYkRqosgbbJyK.jpg',
    backdrop_path: '/o0s4XsEDfDlvit5pDRKjzXR4pp2.jpg',
    release_date: '2009-12-18',
    vote_average: 7.6,
    genres: ['Action', 'Adventure', 'Fantasy', 'Science Fiction'],
    runtime: 162,
  },
  {
    id: 680,
    tmdbId: 680,
    title: 'Pulp Fiction',
    overview: 'A burger-loving hit man, his philosophical partner, a drug-addled gangster\'s moll and a washed-up boxer converge in this sprawling crime saga.',
    poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    backdrop_path: '/4cDFJr4HnXN5AdPw4AKrmLlMWdO.jpg',
    release_date: '1994-09-10',
    vote_average: 8.5,
    genres: ['Thriller', 'Crime'],
    runtime: 154,
  },
];

class MovieService {
  constructor() {
    this.tmdbApiKey = process.env.TMDB_API_KEY;
  }

  /**
   * Fetch movie from TMDB
   */
  async fetchFromTMDB(endpoint, params = {}) {
    if (!this.tmdbApiKey) {
      throw new Error('TMDB_API_KEY not configured');
    }

    try {
      const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
        params: { ...params, api_key: this.tmdbApiKey },
        timeout: TMDB_TIMEOUT,
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('TMDB_TIMEOUT');
      }
      throw error;
    }
  }

  /**
   * Sync TMDB movie to MongoDB
   * This creates/updates a MongoDB document with TMDB data
   */
  async syncMovieToMongoDB(tmdbId) {
    try {
      // Check if already exists
      const existing = await Movie.findOne({ tmdbId });
      if (existing) {
        return existing;
      }

      // Fetch from TMDB
      const [movieData, credits, videos] = await Promise.all([
        this.fetchFromTMDB(`/movie/${tmdbId}`),
        this.fetchFromTMDB(`/movie/${tmdbId}/credits`).catch(() => ({ cast: [] })),
        this.fetchFromTMDB(`/movie/${tmdbId}/videos`).catch(() => ({ results: [] })),
      ]);

      // Create MongoDB document
      const movie = new Movie({
        tmdbId: movieData.id,
        title: movieData.title,
        overview: movieData.overview,
        poster_path: movieData.poster_path,
        backdrop_path: movieData.backdrop_path,
        release_date: movieData.release_date,
        genres: movieData.genres?.map(g => g.name) || [],
        rating: movieData.vote_average,
        runtime: movieData.runtime,
        language: movieData.original_language,
        cast: credits.cast?.slice(0, 10).map(a => a.name) || [],
        trailer: videos.results?.find(v => v.type === 'Trailer')
          ? `https://www.youtube.com/watch?v=${videos.results.find(v => v.type === 'Trailer').key}`
          : null,
      });

      await movie.save();
      return movie;
    } catch (error) {
      console.error(`Failed to sync movie ${tmdbId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get movie by TMDB ID with fallback chain
   * Priority: MongoDB → TMDB → Fallback
   */
  async getMovieByTmdbId(tmdbId) {
    // 1. Try MongoDB cache first
    try {
      const cached = await Movie.findOne({ tmdbId }).maxTimeMS(2000);
      if (cached) {
        return {
          data: cached,
          source: 'mongodb',
        };
      }
    } catch (err) {
      console.log(`MongoDB lookup failed for tmdbId ${tmdbId}`);
    }

    // 2. Try TMDB
    try {
      const [movieData, credits, videos] = await Promise.all([
        this.fetchFromTMDB(`/movie/${tmdbId}`),
        this.fetchFromTMDB(`/movie/${tmdbId}/credits`).catch(() => ({ cast: [] })),
        this.fetchFromTMDB(`/movie/${tmdbId}/videos`).catch(() => ({ results: [] })),
      ]);

      const trailer = videos.results?.find(v => v.type === 'Trailer');

      return {
        data: {
          id: movieData.id,
          tmdbId: movieData.id,
          title: movieData.title,
          overview: movieData.overview,
          poster_path: movieData.poster_path,
          backdrop_path: movieData.backdrop_path,
          release_date: movieData.release_date,
          genres: movieData.genres?.map(g => g.name) || [],
          rating: movieData.vote_average,
          runtime: movieData.runtime,
          language: movieData.original_language,
          cast: credits.cast?.slice(0, 10).map(a => a.name) || [],
          trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
        },
        source: 'tmdb',
      };
    } catch (err) {
      console.log(`TMDB fetch failed for tmdbId ${tmdbId}: ${err.message}`);
    }

    // 3. Try fallback
    const fallback = FALLBACK_MOVIES.find(m => m.tmdbId === parseInt(tmdbId));
    if (fallback) {
      return {
        data: fallback,
        source: 'fallback',
      };
    }

    throw new Error('Movie not found in any source');
  }

  /**
   * Get popular movies with fallback chain
   */
  async getPopularMovies(page = 1) {
    // 1. Try MongoDB cache
    try {
      const cached = await Movie.find()
        .sort({ rating: -1, createdAt: -1 })
        .limit(20)
        .maxTimeMS(2000);
      
      if (cached.length > 0) {
        return {
          data: cached,
          source: 'mongodb',
        };
      }
    } catch (err) {
      console.log('MongoDB popular movies failed');
    }

    // 2. Try TMDB
    try {
      const data = await this.fetchFromTMDB('/movie/popular', { page });
      return {
        data: data.results || [],
        source: 'tmdb',
      };
    } catch (err) {
      console.log('TMDB popular movies failed');
    }

    // 3. Fallback
    return {
      data: FALLBACK_MOVIES,
      source: 'fallback',
      message: 'Showing demo movies (TMDB and MongoDB unavailable)',
    };
  }

  /**
   * Search movies across all sources
   */
  async searchMovies(query) {
    const searchTerm = query.toLowerCase();
    const results = [];

    // 1. Search MongoDB
    try {
      const mongoResults = await Movie.find({
        title: { $regex: query, $options: 'i' }
      }).limit(10).maxTimeMS(2000);
      
      results.push(...mongoResults.map(m => ({ ...m.toObject(), source: 'mongodb' })));
    } catch (err) {
      console.log('MongoDB search failed');
    }

    // 2. Search TMDB
    try {
      const tmdbData = await this.fetchFromTMDB('/search/movie', { query, page: 1 });
      const tmdbResults = (tmdbData.results || [])
        .filter(m => m.poster_path && m.release_date)
        .slice(0, 10);
      results.push(...tmdbResults.map(m => ({ ...m, source: 'tmdb' })));
    } catch (err) {
      console.log('TMDB search failed');
    }

    // 3. Search fallback
    if (results.length === 0) {
      const fallbackResults = FALLBACK_MOVIES.filter(m =>
        m.title.toLowerCase().includes(searchTerm) ||
        m.overview.toLowerCase().includes(searchTerm) ||
        m.genres.some(g => g.toLowerCase().includes(searchTerm))
      );
      results.push(...fallbackResults.map(m => ({ ...m, source: 'fallback' })));
    }

    // Remove duplicates by tmdbId
    const unique = [];
    const seen = new Set();
    for (const movie of results) {
      const id = movie.tmdbId || movie.id;
      if (!seen.has(id)) {
        seen.add(id);
        unique.push(movie);
      }
    }

    return unique;
  }
}

export default new MovieService();
