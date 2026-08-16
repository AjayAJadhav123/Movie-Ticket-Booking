import { useState, useEffect } from 'react';
import { getTMDBImageUrl, getMovieImageUrl, getPlaceholderImage } from '../utils/imageUtils';

/**
 * Custom hook for handling movie image loading with fallbacks
 * Automatically switches to fallback if primary image fails to load
 */
export const useMovieImage = (movie, imageType = 'poster') => {
  const [imageUrl, setImageUrl] = useState(() => getMovieImageUrl(movie, imageType));
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImageUrl(getMovieImageUrl(movie, imageType));
    setIsLoading(true);
    setHasError(false);
  }, [movie, imageType]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    
    // If we have an error and it's not already a placeholder, switch to placeholder
    if (imageUrl && !imageUrl.startsWith('data:image')) {
      setImageUrl(getPlaceholderImage(imageType));
    }
  };

  return {
    imageUrl,
    isLoading,
    hasError,
    onLoad: handleImageLoad,
    onError: handleImageError,
  };
};

/**
 * Hook for handling multiple image sources with fallback chain
 * Tries multiple image paths in order
 */
export const useMovieImageWithFallback = (movie) => {
  const [posterUrl, setPosterUrl] = useState(() => {
    if (movie?.poster_path) {
      return getTMDBImageUrl(movie.poster_path, 'w500');
    }
    if (movie?.backdrop_path) {
      return getTMDBImageUrl(movie.backdrop_path, 'w500');
    }
    return getPlaceholderImage('poster');
  });

  const [backdropUrl, setBackdropUrl] = useState(() => {
    if (movie?.backdrop_path) {
      return getTMDBImageUrl(movie.backdrop_path, 'w1280');
    }
    if (movie?.poster_path) {
      return getTMDBImageUrl(movie.poster_path, 'w780');
    }
    return getPlaceholderImage('backdrop');
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (movie?.poster_path) {
      setPosterUrl(getTMDBImageUrl(movie.poster_path, 'w500'));
    } else if (movie?.backdrop_path) {
      setPosterUrl(getTMDBImageUrl(movie.backdrop_path, 'w500'));
    } else {
      setPosterUrl(getPlaceholderImage('poster'));
    }

    if (movie?.backdrop_path) {
      setBackdropUrl(getTMDBImageUrl(movie.backdrop_path, 'w1280'));
    } else if (movie?.poster_path) {
      setBackdropUrl(getTMDBImageUrl(movie.poster_path, 'w780'));
    } else {
      setBackdropUrl(getPlaceholderImage('backdrop'));
    }
  }, [movie]);

  const handlePosterError = () => {
    if (!posterUrl.startsWith('data:image')) {
      // First try backdrop, then placeholder
      if (movie?.backdrop_path) {
        setPosterUrl(getTMDBImageUrl(movie.backdrop_path, 'w500'));
      } else {
        setPosterUrl(getPlaceholderImage('poster'));
      }
    }
  };

  const handleBackdropError = () => {
    if (!backdropUrl.startsWith('data:image')) {
      // First try poster, then placeholder
      if (movie?.poster_path) {
        setBackdropUrl(getTMDBImageUrl(movie.poster_path, 'w780'));
      } else {
        setBackdropUrl(getPlaceholderImage('backdrop'));
      }
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return {
    posterUrl,
    backdropUrl,
    isLoading,
    onPosterError: handlePosterError,
    onBackdropError: handleBackdropError,
    onImageLoad: handleImageLoad,
  };
};
