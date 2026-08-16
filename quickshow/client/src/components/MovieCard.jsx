import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Play } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { toast } from 'react-toastify';

export default function MovieCard({ movie, onTrailerClick }) {
  const { isSignedIn } = useUser();
  const { favorites, addFavorite, removeFavorite } = useApp();
  const [isFavorited, setIsFavorited] = useState(
    favorites.some((fav) => fav._id === movie._id)
  );

  const handleFavoriteToggle = async (e) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      toast.error('Please sign in to add favorites');
      return;
    }

    if (isFavorited) {
      const success = await removeFavorite(movie._id);
      if (success) {
        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        toast.error('Failed to remove favorite');
      }
    } else {
      const success = await addFavorite(movie._id);
      if (success) {
        setIsFavorited(true);
        toast.success('Added to favorites');
      } else {
        toast.error('Failed to add favorite');
      }
    }
  };

  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/placeholder-movie.jpg';

  return (
    <Link to={`/movie/${movie._id}`}>
      <div className="card hover:shadow-2xl transition-all duration-300 transform hover:scale-105 h-full flex flex-col group">
        <div className="relative h-64 overflow-hidden bg-gray-200">
          <img
            src={imageUrl}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
            {movie.trailer && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onTrailerClick(movie);
                }}
                className="bg-white text-indigo-600 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <Play size={24} fill="currentColor" />
              </button>
            )}
          </div>

          <button
            onClick={handleFavoriteToggle}
            className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
          >
            <Heart
              size={20}
              className={isFavorited ? 'fill-red-600 text-red-600' : 'text-gray-600'}
            />
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-lg line-clamp-2 mb-2">{movie.title}</h3>
          
          <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">
            {movie.overview}
          </p>

          <div className="space-y-2">
            {movie.release_date && (
              <p className="text-xs text-gray-500">
                Released: {new Date(movie.release_date).toLocaleDateString()}
              </p>
            )}
            
            {movie.rating && (
              <div className="flex items-center">
                <span className="text-sm font-semibold text-indigo-600">
                  ★ {movie.rating.toFixed(1)}/10
                </span>
              </div>
            )}

            {movie.genres && movie.genres.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {movie.genres.slice(0, 2).map((genre) => (
                  <span
                    key={genre}
                    className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button className="w-full mt-4 btn-primary">
            Book Ticket
          </button>
        </div>
      </div>
    </Link>
  );
}
