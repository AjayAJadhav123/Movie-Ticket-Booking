import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useUser } from '@clerk/clerk-react';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import Loading from '../components/Loading';
import { Heart } from 'lucide-react';

export default function Favorites() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const { favorites, fetchFavorites, loading } = useApp();
  const [trailerMovie, setTrailerMovie] = useState(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchFavorites();
    }
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600 mb-4">Please sign in to view your favorites.</p>
          <button
            onClick={() => navigate('/sign-in')}
            className="btn-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen pt-8 pb-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Heart size={32} className="text-indigo-600" />
            <h1 className="section-title mb-0">My Favorites</h1>
          </div>
          <p className="text-slate-600 text-base md:text-lg">Movies you've added to your wishlist</p>
        </div>

        {/* Content */}
        {favorites.length === 0 ? (
          <div className="card card-hover p-8 md:p-12 text-center">
            <Heart size={56} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-600 text-lg md:text-xl mb-4">No favorites yet.</p>
            <p className="text-slate-500 mb-8">Add movies to your favorites to see them here!</p>
            <button
              onClick={() => navigate('/movies')}
              className="btn-primary"
            >
              Explore Movies
            </button>
          </div>
        ) : (
          <div>
            <p className="text-slate-600 text-sm md:text-base mb-6">
              <span className="text-slate-900 font-semibold">{favorites.length}</span> movie{favorites.length !== 1 ? 's' : ''} saved
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((movie) => (
                <MovieCard
                  key={movie._id}
                  movie={movie}
                  onTrailerClick={() => setTrailerMovie(movie)}
                />
              ))}
            </div>
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

