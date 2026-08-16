import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import Loading from '../components/Loading';
import { Search } from 'lucide-react';

export default function AllMovies() {
  const { movies, fetchMovies, loading } = useApp();
  const [trailerMovie, setTrailerMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [filteredMovies, setFilteredMovies] = useState([]);

  useEffect(() => {
    fetchMovies({ page: 1 });
  }, []);

  useEffect(() => {
    let filtered = movies;

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
  }, [movies, searchQuery, selectedGenre]);

  const genres = [
    'Action',
    'Comedy',
    'Drama',
    'Horror',
    'Thriller',
    'Animation',
    'Romance',
  ];

  if (loading && movies.length === 0) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 lg:py-12">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8">All Movies</h1>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6 md:mb-8">
        <div className="mb-4 md:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 text-sm md:text-base"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3">
          <button
            onClick={() => setSelectedGenre('')}
            className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors text-xs md:text-sm ${
              selectedGenre === ''
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            All Genres
          </button>

          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors text-xs md:text-sm ${
                selectedGenre === genre
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Movies Grid */}
      {filteredMovies.length === 0 ? (
        <div className="text-center py-8 md:py-12">
          <p className="text-gray-500 text-base md:text-lg">
            {movies.length === 0
              ? 'No movies available'
              : 'No movies match your search criteria'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={movie._id}
              movie={movie}
              onTrailerClick={() => setTrailerMovie(movie)}
            />
          ))}
        </div>
      )}

      {/* Trailer Modal */}
      <TrailerModal
        movie={trailerMovie}
        isOpen={!!trailerMovie}
        onClose={() => setTrailerMovie(null)}
      />
    </div>
  );
}
