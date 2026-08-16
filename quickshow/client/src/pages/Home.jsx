import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import Loading from '../components/Loading';
import { Play } from 'lucide-react';

export default function Home() {
  const { movies, fetchMovies, loading } = useApp();
  const [trailerMovie, setTrailerMovie] = useState(null);
  const [featuredMovie, setFeaturedMovie] = useState(null);

  useEffect(() => {
    fetchMovies({ page: 1 });
  }, []);

  useEffect(() => {
    if (movies && movies.length > 0) {
      setFeaturedMovie(movies[0]);
    }
  }, [movies]);

  if (loading && movies.length === 0) {
    return <Loading />;
  }

  const featuredImageUrl = featuredMovie?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${featuredMovie.backdrop_path}`
    : `https://image.tmdb.org/t/p/w500${featuredMovie?.poster_path}`;

  return (
    <div>
      {/* Hero Section */}
      {featuredMovie && (
        <div className="relative h-64 md:h-80 lg:h-screen overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${featuredImageUrl})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          </div>

          <div className="relative h-full flex flex-col justify-center items-center text-center text-white px-4">
            <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold mb-2 md:mb-4 drop-shadow-lg">
              {featuredMovie.title}
            </h1>
            <p className="text-xs md:text-sm lg:text-xl mb-4 md:mb-8 max-w-2xl drop-shadow-lg line-clamp-2 md:line-clamp-3">
              {featuredMovie.overview}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 md:gap-4 w-full md:w-auto md:justify-center">
              {featuredMovie.trailer && (
                <button
                  onClick={() => setTrailerMovie(featuredMovie)}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-3 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors text-sm md:text-base"
                >
                  <Play size={18} fill="white" />
                  Watch Trailer
                </button>
              )}

              <button className="bg-indigo-600 hover:bg-indigo-700 px-3 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors text-sm md:text-base">
                Book Ticket
              </button>
            </div>

            {featuredMovie.rating && (
              <div className="mt-4 md:mt-8 text-lg md:text-xl font-semibold">
                ★ {featuredMovie.rating.toFixed(1)}/10
              </div>
            )}
          </div>
        </div>
      )}

      {/* Now Showing Section */}
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8">Now Showing</h2>

        {movies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-base md:text-lg">No movies available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {movies.map((movie) => (
              <MovieCard
                key={movie._id}
                movie={movie}
                onTrailerClick={() => setTrailerMovie(movie)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        movie={trailerMovie}
        isOpen={!!trailerMovie}
        onClose={() => setTrailerMovie(null)}
      />
    </div>
  );
}
