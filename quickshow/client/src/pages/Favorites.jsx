import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useUser } from '@clerk/clerk-react';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import Loading from '../components/Loading';

export default function Favorites() {
  const { isSignedIn } = useUser();
  const { favorites, fetchFavorites, loading } = useApp();
  const [trailerMovie, setTrailerMovie] = useState(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchFavorites();
    }
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg text-gray-600 mb-4">Please sign in to view your favorites.</p>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 lg:py-12">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8">My Favorites</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-8 md:py-12 bg-white rounded-lg">
          <p className="text-gray-500 text-base md:text-lg">No favorites yet.</p>
          <p className="text-gray-400 text-sm md:text-base">Add movies to your favorites to see them here!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {favorites.map((movie) => (
            <MovieCard
              key={movie._id}
              movie={movie}
              onTrailerClick={() => setTrailerMovie(movie)}
            />
          ))}
        </div>
      )}

      <TrailerModal
        movie={trailerMovie}
        isOpen={!!trailerMovie}
        onClose={() => setTrailerMovie(null)}
      />
    </div>
  );
}
