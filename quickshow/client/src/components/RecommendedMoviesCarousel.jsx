import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import MovieCard from './MovieCard';

export default function RecommendedMoviesCarousel({ movieId, movieTitle }) {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [processingFavorites, setProcessingFavorites] = useState({});
  const { apiClient, favorites, addFavorite, removeFavorite } = useApp();
  const scrollContainerRef = React.useRef(null);

  // Fetch recommendations when movieId changes
  useEffect(() => {
    if (!movieId) return;
    fetchRecommendations();
  }, [movieId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get(`/api/recommendations/movie/${movieId}?limit=8`);
      
      if (response.data.success) {
        setRecommendations(response.data.data || []);
      } else {
        setError('Could not load recommendations');
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(null); // Silently fail - don't disrupt UX
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 320; // Width of card + gap
    const currentScroll = scrollContainerRef.current.scrollLeft;
    const newScroll = direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth',
    });
    setScrollPosition(newScroll);
  };

  if (loading) {
    return (
      <section className="py-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">You May Also Like</h2>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 w-44 h-64 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  // Don't show section if no recommendations
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">You May Also Like</h2>

      <div className="relative">
        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide"
          style={{ scrollBehavior: 'smooth' }}
        >
          {recommendations.map((movie) => (
            <Link
              key={movie._id}
              to={`/movie/${movie._id}`}
              className="flex-shrink-0 w-44"
            >
              {/* Movie Card */}
              <div className="group cursor-pointer">
                {/* Poster Image */}
                <div className="relative h-56 bg-slate-200 rounded-lg overflow-hidden mb-3">
                  {movie.poster_path || movie.backdrop_path ? (
                    <img
                      src={
                        movie.poster_path
                          ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                          : movie.backdrop_path
                          ? `https://image.tmdb.org/t/p/w300${movie.backdrop_path}`
                          : '/movie-placeholder.svg'
                      }
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = '/movie-placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                      <span className="text-slate-600 text-sm">No Image</span>
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Prevent duplicate requests
                        if (processingFavorites[movie._id]) {
                          return;
                        }
                        
                        if (!isSignedIn) {
                          toast.info('Please sign in to add favorites');
                          navigate('/sign-in');
                          return;
                        }
                        
                        setProcessingFavorites(prev => ({ ...prev, [movie._id]: true }));
                        
                        try {
                          const isFav = favorites?.some((f) => f._id === movie._id);
                          if (isFav) {
                            const success = await removeFavorite(movie._id);
                            if (success) {
                              toast.success('Removed from favorites');
                            } else {
                              toast.error('Failed to remove favorite');
                            }
                          } else {
                            const success = await addFavorite(movie._id);
                            if (success) {
                              toast.success('Added to favorites');
                            } else {
                              toast.error('Failed to add favorite');
                            }
                          }
                        } finally {
                          setProcessingFavorites(prev => ({ ...prev, [movie._id]: false }));
                        }
                      }}
                      disabled={processingFavorites[movie._id]}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 bg-white rounded-full hover:bg-indigo-600 hover:text-white text-red-500 ${
                        processingFavorites[movie._id] ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                    >
                      <Heart
                        size={20}
                        fill={
                          favorites?.some((f) => f._id === movie._id)
                            ? 'currentColor'
                            : 'none'
                        }
                      />
                    </button>
                  </div>

                  {/* Rating Badge */}
                  {movie.rating && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      {movie.rating.toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Movie Info */}
                <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
                  {movie.title}
                </h3>

                {movie.genres && movie.genres.length > 0 && (
                  <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                    {movie.genres.slice(0, 2).join(', ')}
                  </p>
                )}

                {movie.release_date && (
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(movie.release_date).getFullYear()}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Navigation Buttons - Desktop Only */}
        {recommendations.length > 5 && (
          <>
            <button
              onClick={() => scroll('left')}
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 z-10 items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() => scroll('right')}
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 z-10 items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </section>
  );
}
