import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Play, Star, Calendar, Clock } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { toast } from 'react-toastify';
import { useMovieImage } from '../hooks/useMovieImage';

export default function MovieCard({ movie, onTrailerClick }) {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const { favorites, addFavorite, removeFavorite } = useApp();

  // Ensure we have a valid movie ID for navigation
  const movieId = movie._id || movie.id || `movie_${Date.now()}`;

  const [isFavorited, setIsFavorited] = useState(
    favorites.some((fav) => fav._id === movieId)
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Update local favorite state when global favorites change
  useEffect(() => {
    setIsFavorited(favorites.some((fav) => fav._id === movieId));
  }, [favorites, movieId]);

  // Use the image hook for robust image handling
  const { imageUrl, onLoad, onError } = useMovieImage(movie, 'poster');

  // Normalize rating — API uses both `rating` and `vote_average`
  const rating = movie.rating ?? movie.vote_average ?? null;

  // Normalize runtime — API uses both `runtime` and `duration`
  const runtime = movie.runtime ?? movie.duration ?? null;

  const handleFavoriteToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent duplicate requests
    if (isProcessing) {
      return;
    }

    if (!isSignedIn) {
      toast.info('Please sign in to add favorites');
      navigate('/sign-in');
      return;
    }

    setIsProcessing(true);

    try {
      if (isFavorited) {
        const success = await removeFavorite(movieId);
        if (success) {
          toast.success('Removed from favorites');
        } else {
          toast.error('Failed to remove favorite');
        }
      } else {
        const success = await addFavorite(movieId);
        if (success) {
          toast.success('Added to favorites');
        } else {
          toast.error('Failed to add favorite');
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Prevent rendering if movieId is invalid
  if (!movieId || movieId.includes('undefined')) {
    return null;
  }

  return (
    <Link to={`/movie/${movieId}`} className="group block h-full">
      <div className="card card-hover h-full flex flex-col overflow-hidden">
        {/* Poster */}
        <div className="relative overflow-hidden bg-slate-100" style={{ aspectRatio: '2/3' }}>
          <img
            src={imageUrl}
            alt={movie.title}
            onLoad={onLoad}
            onError={onError}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Trailer play button */}
          {movie.trailer && onTrailerClick && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTrailerClick(movie);
              }}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              aria-label="Watch trailer"
            >
              <div className="p-3.5 bg-white rounded-full shadow-xl hover:bg-indigo-50 transition">
                <Play size={22} className="text-indigo-600" fill="currentColor" />
              </div>
            </button>
          )}

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteToggle}
            disabled={isProcessing}
            className={`absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-white/50 hover:bg-white transition shadow-sm ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              size={16}
              className={isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-500'}
            />
          </button>

          {/* Rating Badge */}
          {rating && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm rounded-md shadow-sm">
              <Star size={11} className="text-amber-500 fill-amber-500" />
              <span className="text-xs font-semibold text-slate-800">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5 flex-1 flex flex-col">
          <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 mb-1.5 group-hover:text-indigo-600 transition-colors leading-snug">
            {movie.title}
          </h3>

          {/* Metadata row */}
          <div className="flex items-center gap-3 mb-2.5">
            {movie.release_date && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar size={11} />
                <span>{new Date(movie.release_date).getFullYear()}</span>
              </div>
            )}
            {runtime && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock size={11} />
                <span>{runtime} min</span>
              </div>
            )}
          </div>

          {/* Genre chips */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-3">
              {movie.genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* CTA Button */}
          <div className="mt-auto">
            <div className="w-full btn-primary text-xs py-2 rounded-lg">
              Book Tickets
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
