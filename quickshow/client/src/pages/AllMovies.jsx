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
  const fetchMoviesPage = useCallback(async (pageNum, query, genre, append = false) => {
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

      // Client-side genre filter
      if (genre) {
        results = results.filter((m) =>
          m.genres?.some(
            (g) => typeof g === 'string' && g.toLowerCase().includes(genre.toLowerCase())
          )
        );
      }

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
  }, [apiClient, getContextSeed]); // eslint-disable-line react-hooks/exhaustive-deps

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
        fetchMoviesPage(1, '', '', false);
      }
    } else {
      fetchMoviesPage(1, searchQuery, selectedGenre, false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-seed when AppContext data arrives (e.g., after Home triggers fetches) ─
  useEffect(() => {
    if (searchQuery.trim() || selectedGenre) return; // Don't override search results
    const seed = getContextSeed();
    if (seed.length === 0) return;

    setMovies((prev) => {
      // Only update if we currently have no movies OR only demo data
      if (prev.length > 0 && !isDemoOnlyList(prev)) return prev;
      return seed;
    });
    setIsFallbackMode(isDemoOnlyList(seed));
    setLoading(false);
  }, [popularMovies, trendingMovies, nowPlayingMovies]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Search / filter changes ──────────────────────────────────────────────────
  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      setPage(1);

      if (!searchQuery.trim() && !selectedGenre) {
        const seed = getContextSeed();
        if (seed.length > 0) {
          setMovies(seed);
          setLoading(false);
          setIsFallbackMode(isDemoOnlyList(seed));
          return;
        }
      }

      fetchMoviesPage(1, searchQuery, selectedGenre, false);
    }, 400);

    return () => clearTimeout(debounceTimer.current);
  }, [searchQuery, selectedGenre]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pagination ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (page > 1) {
      fetchMoviesPage(page, searchQuery, selectedGenre, true);
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div className="min-h-screen pt-8 pb-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="section-title">Movies Catalogue</h1>
          <p className="text-slate-600 text-base md:text-lg">
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
              className="w-full pl-12 pr-4 py-3 md:py-4 bg-slate-50 text-slate-900 placeholder-slate-500 rounded-lg border border-slate-300 focus:border-indigo-500 focus:outline-none focus:bg-white transition text-sm md:text-base"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 md:py-3 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition text-sm md:text-base md:hidden"
          >
            <Filter size={18} />
            Filters
          </button>

          <div className={`${showFilters ? 'block' : 'hidden'} md:block mt-4 md:mt-0`}>
            <div className="card rounded-xl p-4 md:p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 hidden md:block">
                Genres
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedGenre('')}
                  className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-all text-xs md:text-sm ${
                    selectedGenre === ''
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
            <div className="whitespace-pre-line text-slate-800 font-semibold text-lg mb-4 max-w-2xl mx-auto">{error}</div>
            <button
              onClick={() => fetchMoviesPage(1, searchQuery, selectedGenre, false)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 mx-auto hover:bg-indigo-700 transition"
            >
              <RefreshCw size={18} /> Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-slate-200 rounded-xl h-[400px]" />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-16 md:py-24">
            <p className="text-slate-600 text-base md:text-lg mb-4">
              {searchQuery || selectedGenre
                ? 'No movies found matching your criteria.'
                : 'No movies available at the moment.'}
            </p>
            {(searchQuery || selectedGenre) && (
              <button
                onClick={handleClearFilters}
                className="text-indigo-600 hover:text-indigo-700 transition font-semibold"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
              {movies.map((movie, index) => {
                const movieId = movie._id || movie.id;
                if (!movieId) return null;

                if (movies.length === index + 1) {
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
                <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-slate-100">
                  <div className="animate-spin h-5 w-5 text-indigo-600">
                    <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full" />
                  </div>
                  <p className="text-slate-700 font-medium text-sm">Loading more movies...</p>
                </div>
              </div>
            )}

            {/* End of list */}
            {!hasMore && movies.length > 0 && (
              <div className="text-center py-10 mt-6 border-t border-slate-100">
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