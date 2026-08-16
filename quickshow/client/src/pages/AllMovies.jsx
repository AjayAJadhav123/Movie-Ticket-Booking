import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import Loading from '../components/Loading';
import { Search, Filter } from 'lucide-react';

export default function AllMovies() {
  const { latestMovies, fetchLatestMovies, movies, fetchMovies, loading } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [trailerMovie, setTrailerMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Fetch latest movies as primary source
    fetchLatestMovies();
    // Also fetch all movies for search functionality
    fetchMovies({ page: 1 });
  }, []);

  useEffect(() => {
    // If searching, use all movies database for better search results
    // Otherwise use latest TMDB movies
    const sourceMovies = searchQuery ? movies : latestMovies;
    let filtered = sourceMovies;

    if (searchQuery) {
      filtered = filtered.filter((m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedGenre) {
      filtered = filtered.filter((m) =>
        m.genres?.includes(selectedGenre)
      );
    }

    setFilteredMovies(filtered);
  }, [latestMovies, movies, searchQuery, selectedGenre]);

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

  if (loading && movies.length === 0) {
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchParams({ search: e.target.value });
              }}
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
        {filteredMovies.length === 0 ? (
          <div className="text-center py-16 md:py-24">
            <p className="text-slate-600 text-base md:text-lg mb-4">
              {movies.length === 0
                ? 'No movies available at the moment'
                : 'No movies match your search criteria'}
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('');
                }}
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
