import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import Loading from '../components/Loading';
import { Search, Filter } from 'lucide-react';

export default function AllMovies() {
  const { latestMovies, fetchLatestMovies, loading } = useApp();
  const { apiClient } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [trailerMovie, setTrailerMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const debounceTimer = useRef(null);

  // Fetch initial movies
  useEffect(() => {
    fetchLatestMovies();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // If no search query, show latest movies
    if (!searchQuery.trim()) {
      setFilteredMovies(latestMovies);
      setSearchError(null);
      return;
    }

    // Set loading state
    setSearchLoading(true);
    setSearchError(null);

    // Debounce search API call (300ms)
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await apiClient.get('/api/movie/search', {
          params: { query: searchQuery.trim() },
        });

        if (response.data.success) {
          let results = response.data.data || [];

          // Apply genre filter if selected
          if (selectedGenre) {
            results = results.filter((m) =>
              m.genres?.some((g) => g.toLowerCase().includes(selectedGenre.toLowerCase())) ||
              m.genres?.includes(selectedGenre)
            );
          }

          setFilteredMovies(results);
          setSearchError(null);
        } else {
          setSearchError(response.data.message || 'Error searching movies');
          setFilteredMovies([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchError('Unable to search movies. Please try again.');
        setFilteredMovies([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, selectedGenre, apiClient]);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setSearchParams({ search: value });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSearchParams({});
    setFilteredMovies(latestMovies);
    setSearchError(null);
  };

  const genres = [
    'Action',
    'Comedy',
    'Drama',
    'Horror',
    'Thriller',
    'Animation',
    'Romance',
    'Science Fiction',
    'Fantasy',
  ];

  if (loading && latestMovies.length === 0 && !searchQuery) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="section-title">Latest & Now Playing Movies</h1>
          <p className="text-slate-600 text-base md:text-lg">Browse the latest releases and currently playing films</p>
        </div>

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
            {searchLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-5 w-5 text-indigo-600">
                  <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                </div>
              </div>
            )}
          </div>
          {searchError && (
            <p className="text-red-600 text-sm mt-2">{searchError}</p>
          )}
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
            <div className="card rounded-xl p-4 md:p-6">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 hidden md:block">Genres</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedGenre('')}
                  className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-all text-xs md:text-sm ${
                    selectedGenre === ''
                      ? 'bg-indigo-600 text-white shadow-lg'
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
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
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
        {searchLoading ? (
          <div className="text-center py-16 md:py-24">
            <div className="inline-flex items-center gap-2">
              <div className="animate-spin h-5 w-5 text-indigo-600">
                <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
              </div>
              <p className="text-slate-600">Searching movies...</p>
            </div>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-16 md:py-24">
            <p className="text-slate-600 text-base md:text-lg mb-4">
              {searchQuery
                ? 'No movies found. Try searching with a different movie title.'
                : 'No movies available at the moment'}
            </p>
            {(searchQuery || selectedGenre) && (
              <button
                onClick={handleClearFilters}
                className="text-indigo-600 hover:text-indigo-700 transition font-semibold"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-slate-600 text-sm md:text-base mb-6">
              Showing <span className="text-slate-900 font-semibold">{filteredMovies.length}</span> {filteredMovies.length === 1 ? 'movie' : 'movies'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMovies.map((movie) => {
                const movieId = movie._id || movie.id;
                if (!movieId) return null;
                return (
                  <MovieCard
                    key={movieId}
                    movie={movie}
                    onTrailerClick={() => setTrailerMovie(movie)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Trailer Modal */}
        <TrailerModal
          movie={trailerMovie}
          isOpen={!!trailerMovie}
          onClose={() => setTrailerMovie(null)}
        />
      </div>
    </div>
  );
}
