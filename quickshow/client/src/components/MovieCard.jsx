import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Play, Star, Calendar } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { toast } from 'react-toastify';
import { useMovieImage } from '../hooks/useMovieImage';

export default function MovieCard({ movie, onTrailerClick }) {
  const { isSignedIn } = useUser();
  const { favorites, addFavorite, removeFavorite } = useApp();
  const [isFavorited, setIsFavorited] = useState(
    favorites.some((fav) => fav._id === movie._id)
  );
  
  // Use the image hook for robust image handling
  const { imageUrl, isLoading, onLoad, onError } = useMovieImage(movie, 'poster');

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

  return (
    <Link to={`/movie/${movie._id}`} className="group h-full">
      <div className="card card-hover h-full flex flex-col overflow-hidden">
        {/* Image Container */}
        <div className="relative h-72 md:h-80 overflow-hidden bg-slate-100">
          <img
            src={imageUrl}
            alt={movie.title}
            onLoad={onLoad}
            onError={onError}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          
          {/* Overlay */}
          <div className="movie-card-overlay group-hover:from-slate-900 transition-all duration-300"></div>

          {/* Trailer Button */}
          {movie.trailer && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onTrailerClick(movie);
              }}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <div className="p-4 bg-white text-indigo-600 rounded-full shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all">
                <Play size={28} fill="currentColor" />
              </div>
            </button>
          )}

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteToggle}
            className="absolute top-3 right-3 p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-300 hover:bg-white transition-all shadow-lg"
          >
            <Heart
              size={20}
              className={isFavorited ? 'fill-pink-600 text-indigo-600' : 'text-slate-700 group-hover:text-slate-900'}
            />
          </button>

          {/* Rating Badge */}
          {movie.rating && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/80 backdrop-blur-sm border border-slate-300 rounded-lg">
              <Star size={16} className="text-amber-500 fill-yellow-400" />
              <span className="text-sm font-semibold text-amber-500">{movie.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-base md:text-lg line-clamp-2 mb-2 text-slate-900 group-hover:text-indigo-600 transition-colors">
            {movie.title}
          </h3>
          
          <p className="text-xs md:text-sm text-slate-600 line-clamp-2 mb-3 flex-1">
            {movie.overview}
          </p>

          {/* Metadata */}
          <div className="space-y-2 mb-4">
            {movie.release_date && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar size={14} />
                <span>{new Date(movie.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
              </div>
            )}
            
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {movie.genres.slice(0, 2).map((genre) => (
                  <span
                    key={genre}
                    className="text-xs bg-indigo-600/20 text-indigo-300 px-2 py-1 rounded-md border border-indigo-600/30"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* CTA Button */}
          <button className="w-full btn-primary text-sm py-2.5 group-hover:shadow-lg group-hover:shadow-indigo-500/20">
            Book Now
          </button>
        </div>
      </div>
    </Link>
  );
}

