import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import { Search, Filter, AlertCircle, RefreshCw } from 'lucide-react';

export default function AllMovies() {
  const {
    apiClient,
    popularMovies,
    trendingMovies,
    nowPlayingMovies,
    fetchPopularMovies,
    fetchTrendingMovies,
    fetchNowPlayingMovies,
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  const [trailerMovie, setTrailerMovie] = useState(null);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedGenre, setSelectedGenre] = useState('');

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  // Only true when ALL data sources (backend + context) serve the 6 hardcoded demo movies
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef();
  const debounceTimer = useRef(null);
  const initialLoadDone = useRef(false);

  // IDs of the hardcoded demo movies in movieController.js
  const DEMO_IDS = new Set([550, 278, 238, 19404, 19995, 680]);

  const isDemoOnlyList = (list) =>
    list.length > 0 && list.every((m) => DEMO_IDS.has(Number(m.id || m.tmdbId)));

  /**
   * Return whatever AppContext has already fetched (same data Home uses).
   * Prefers popularMovies; falls back to trending or now-playing.
   */
  const getContextSeed = useCallback(() => {
    if (popularMovies && popularMovies.length > 0) return popularMovies;
    if (trendingMovies && trendingMovies.length > 0) return trendingMovies;
    if (nowPlayingMovies && nowPlayingMovies.length > 0) return nowPlayingMovies;
    return [];
  }, [popularMovies, trendingMovies, nowPlayingMovies]);

  /**
   * Fetch a page from the backend.
   * When TMDB is unavailable (503), show "TMDB service unavailable" error.
   */
  const fetchMoviesPage = useCallback(async (pageNum, query, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const endpoint = query.trim() ? '/api/movie/search' : '/api/movie/popular';
      const params = query.trim()
        ? { page: pageNum, query: query.trim() }
        : { page: pageNum };

      const response = await apiClient.get(endpoint, { params });

      if (!response.data.success) {
        // Handle TMDB unavailable error
        if (response.status === 503) {
          setError('🔴 TMDB Service Temporarily Unavailable\n\nThe movie database service is currently unreachable. Please try again in a few moments.');
        } else {
          setError(response.data.message || 'Unable to fetch movies');
        }
        if (!append) setMovies([]);
        return;
      }

      let results = response.data.data || [];
      const pagination = response.data.pagination;
      const paginationPages = pagination?.pages || 1;
      const currentPage = pagination?.page || pageNum;

      setMovies((prev) => {
        if (!append) return results;
        const combined = [...prev, ...results];
        return Array.from(
          new Map(combined.map((m) => [String(m.id || m._id), m])).values()
        );
      });

      setHasMore(currentPage < paginationPages);
      setIsFallbackMode(false);
    } catch (err) {
      if (err.response?.status === 503) {
        setError('TMDB Service Temporarily Unavailable\n\nThe movie database service is currently unreachable. Please try again in a few moments.');
      } else if (import.meta.env.DEV) {
        console.error('AllMovies fetch error:', err);
        setError('Unable to fetch movies. Please check your connection and try again.');
      }
      if (!append) setMovies([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [apiClient, getContextSeed]);  

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    if (!searchQuery.trim()) {
      const seed = getContextSeed();
      if (seed.length > 0) {
        // Immediately display what Home already has — no flicker
        setMovies(seed);
        setLoading(false);
        setIsFallbackMode(isDemoOnlyList(seed));
      } else {
        // AppContext hasn't fetched yet; trigger it and do a normal backend fetch
        fetchPopularMovies();
        fetchTrendingMovies();
        fetchNowPlayingMovies();
        fetchMoviesPage(1, '', false);
      }
    } else {
      fetchMoviesPage(1, searchQuery, false);
    }
  }, []);  

  // ── Re-seed when AppContext data arrives (e.g., after Home triggers fetches) ─
  useEffect(() => {
    if (searchQuery.trim()) return; // Don't override search results
    const seed = getContextSeed();
    if (seed.length === 0) return;

    setMovies((prev) => {
      // Only update if we currently have no movies OR only demo data
      if (prev.length > 0 && !isDemoOnlyList(prev)) return prev;
      return seed;
    });
    setIsFallbackMode(isDemoOnlyList(seed));
    setLoading(false);
  }, [popularMovies, trendingMovies, nowPlayingMovies]);  

  // ── Search / filter changes ──────────────────────────────────────────────────
  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      setPage(1);

      if (!searchQuery.trim()) {
        const seed = getContextSeed();
        if (seed.length > 0) {
          setMovies(seed);
          setLoading(false);
          setIsFallbackMode(isDemoOnlyList(seed));
          return;
        }
      }

      fetchMoviesPage(1, searchQuery, false);
    }, 400);

    return () => clearTimeout(debounceTimer.current);
  }, [searchQuery]);  

  // ── Pagination ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (page > 1) {
      fetchMoviesPage(page, searchQuery, true);
    }
  }, [page]);  

  // ── Infinite scroll ──────────────────────────────────────────────────────────
  const lastMovieElementRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore]
  );

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setSearchParams(value ? { search: value } : {});
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSearchParams({});
  };

  const genres = [
    'Action', 'Comedy', 'Drama', 'Horror', 'Thriller',
    'Animation', 'Romance', 'Science Fiction', 'Fantasy',
  ];

  // Standard TMDB genre mapping
  const TMDB_GENRE_MAP = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Science Fiction',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western'
  };

  const getNormalizedGenres = (movie) => {
    const extractedGenres = new Set();
    
    // 1. Check 'genre' string
    if (typeof movie.genre === 'string') {
      extractedGenres.add(movie.genre.toLowerCase());
    }

    // 2. Check 'genres' array (strings or objects)
    if (Array.isArray(movie.genres)) {
      movie.genres.forEach(g => {
        if (typeof g === 'string') {
          extractedGenres.add(g.toLowerCase());
        } else if (g && typeof g === 'object' && g.name) {
          extractedGenres.add(g.name.toLowerCase());
        }
      });
    }

    // 3. Check 'genre_ids' array (TMDB numbers)
    if (Array.isArray(movie.genre_ids)) {
      movie.genre_ids.forEach(id => {
        const genreName = TMDB_GENRE_MAP[id];
        if (genreName) {
          extractedGenres.add(genreName.toLowerCase());
        }
      });
    }

    return Array.from(extractedGenres);
  };

  const displayedMovies = movies.filter((movie) => {
    if (!selectedGenre) return true;
    const normalized = getNormalizedGenres(movie);
    return normalized.includes(selectedGenre.toLowerCase());
  });

  return (
    <div className="min-h-screen pt-8 pb-16 bg-[#141414]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="section-title">Movies Catalogue</h1>
          <p className="text-slate-400 text-base md:text-lg">
            Browse popular and trending films from around the world
          </p>
        </div>

        {/* Demo Mode Banner — only when ALL sources are demo-only */}
        {isFallbackMode && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <div className="mt-0.5">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-900">Demo Mode</p>
              <p className="text-sm text-amber-700 mt-1">
                Showing demo movies. TMDB service is temporarily unavailable. The system will
                automatically switch to live data when the service is accessible.
              </p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Search movies by title..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 md:py-4 bg-[#0a0a0a] text-white placeholder-slate-500 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none focus:bg-[#141414] transition text-sm md:text-base"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 md:py-3 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition text-sm md:text-base md:hidden"
          >
            <Filter size={18} />
            Filters
          </button>

          <div className={`${showFilters ? 'block' : 'hidden'} md:block mt-4 md:mt-0`}>
            <div className="card rounded-xl p-4 md:p-6 shadow-sm border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 hidden md:block">
                Genres
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedGenre('')}
                  className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-all text-xs md:text-sm ${
                    selectedGenre === ''
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  All Genres
                </button>
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-all text-xs md:text-sm ${
                      selectedGenre === genre
                        ? 'bg-red-600 text-white shadow-md shadow-red-500/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {error && !loading ? (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <div className="whitespace-pre-line text-slate-200 font-semibold text-lg mb-4 max-w-2xl mx-auto">{error}</div>
            <button
              onClick={() => fetchMoviesPage(1, searchQuery, false)}
              className="px-6 py-2 bg-primary text-white rounded-lg flex items-center gap-2 mx-auto hover:bg-red-700 transition"
            >
              <RefreshCw size={18} /> Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-slate-700 rounded-xl h-[400px]" />
            ))}
          </div>
        ) : displayedMovies.length === 0 ? (
          <div className="text-center py-16 md:py-24">
            <p className="text-slate-400 text-base md:text-lg mb-4">
              {searchQuery || selectedGenre
                ? 'No movies found matching your criteria.'
                : 'No movies available at the moment.'}
            </p>
            {(searchQuery || selectedGenre) && (
              <button
                onClick={handleClearFilters}
                className="text-primary hover:text-red-400 transition font-semibold"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
              {displayedMovies.map((movie, index) => {
                const movieId = movie._id || movie.id;
                if (!movieId) return null;

                if (displayedMovies.length === index + 1) {
                  return (
                    <div ref={lastMovieElementRef} key={`${movieId}-${index}`}>
                      <MovieCard movie={movie} onTrailerClick={() => setTrailerMovie(movie)} />
                    </div>
                  );
                }

                return (
                  <MovieCard
                    key={`${movieId}-${index}`}
                    movie={movie}
                    onTrailerClick={() => setTrailerMovie(movie)}
                  />
                );
              })}
            </div>

            {/* Infinite Scroll Loader */}
            {loadingMore && (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-3 bg-[#141414] px-6 py-3 rounded-full shadow-sm border border-slate-800">
                  <div className="animate-spin h-5 w-5 text-primary">
                    <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full" />
                  </div>
                  <p className="text-slate-300 font-medium text-sm">Loading more movies...</p>
                </div>
              </div>
            )}

            {/* End of list */}
            {!hasMore && displayedMovies.length > 0 && (
              <div className="text-center py-10 mt-6 border-t border-slate-800">
                <p className="text-slate-500 font-medium">You've reached the end of the catalogue.</p>
              </div>
            )}
          </div>
        )}

        <TrailerModal
          movie={trailerMovie}
          isOpen={!!trailerMovie}
          onClose={() => setTrailerMovie(null)}
        />
      </div>
    </div>
  );
}