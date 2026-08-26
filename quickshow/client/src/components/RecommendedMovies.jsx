import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import MovieCard from './MovieCard';
import Spinner from './Spinner';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export default function RecommendedMovies() {
  const navigate = useNavigate();
  const { recommendedMovies, fetchRecommendations, recommendationsLoading } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        await fetchRecommendations();
      } catch (error) {
        console.error('Error loading recommendations:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, [fetchRecommendations]);

  const scrollContainer = React.useRef(null);

  const scroll = (direction) => {
    if (scrollContainer.current) {
      const scrollAmount = 300;
      scrollContainer.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Loading skeleton
  if (isLoading || recommendationsLoading) {
    return (
      <section className="py-12 px-4 md:px-8 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 bg-slate-700 rounded-full animate-pulse"></div>
            <div className="h-8 bg-slate-700 rounded w-48 animate-pulse"></div>
          </div>

          {/* Movies grid skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-700 aspect-[2/3] rounded-lg mb-3"></div>
                <div className="h-4 bg-slate-700 rounded mb-2"></div>
                <div className="h-3 bg-slate-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (hasError) {
    return (
      <section className="py-12 px-4 md:px-8 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">Unable to load recommendations</p>
            <p className="text-red-600 text-sm mt-1">Please try again later</p>
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (!recommendedMovies || recommendedMovies.length === 0) {
    return (
      <section className="py-12 px-4 md:px-8 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#0a0a0a] border-2 border-dashed border-slate-700 rounded-lg p-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-300 font-medium">No Recommendations Yet</p>
            <p className="text-slate-400 text-sm mt-2">
              Add movies to your favorites or book tickets to get personalized recommendations
            </p>
            <button
              onClick={() => navigate('/movies')}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Explore Movies
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 md:px-8 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Header with icon */}
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Recommended For You
          </h2>
        </div>

        {/* Movies carousel */}
        <div className="relative">
          {/* Left scroll button */}
          <button
            onClick={() => scroll('left')}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 bg-[#141414] border border-slate-700 rounded-full hover:bg-slate-800 hover:shadow-md transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} className="text-slate-400" />
          </button>

          {/* Movies container */}
          <div
            ref={scrollContainer}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-4 px-4 md:px-0"
            style={{ scrollBehavior: 'smooth' }}
          >
            {recommendedMovies.map((movie) => (
              <div
                key={movie._id || movie.id}
                className="flex-shrink-0 w-40 md:w-48 transform transition-transform hover:scale-105"
              >
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>

          {/* Right scroll button */}
          <button
            onClick={() => scroll('right')}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 bg-[#141414] border border-slate-700 rounded-full hover:bg-slate-800 hover:shadow-md transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Info text */}
        <p className="text-sm text-slate-400 mt-6 text-center">
          Based on your favorites and booking history
        </p>
      </div>
    </section>
  );
}
