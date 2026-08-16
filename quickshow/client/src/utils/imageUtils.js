// Image utility functions for TMDB and fallback handling

/**
 * Generates TMDB image URL with proper sizing
 * @param {string} path - The poster_path or backdrop_path from TMDB
 * @param {string} size - The image size (w500, w780, original, etc.)
 * @returns {string|null} - Full TMDB image URL or null if path is invalid
 */
export const getTMDBImageUrl = (path, size = 'w500') => {
  if (!path || typeof path !== 'string') {
    return null;
  }
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

/**
 * Gets a professional QuickShow placeholder image
 * @param {string} type - 'poster' or 'backdrop'
 * @returns {string} - SVG placeholder as data URL
 */
export const getPlaceholderImage = (type = 'poster') => {
  if (type === 'backdrop') {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0" y1="0" x2="1" y2="1"%3E%3Cstop offset="0%25" style="stop-color:%234F46E5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%237C3AED;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="1280" height="720" fill="url(%23grad)"/%3E%3Ctext x="50%25" y="45%25" font-size="48" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial" opacity="0.8"%3EQuickShow%3C/text%3E%3Ctext x="50%25" y="55%25" font-size="24" text-anchor="middle" fill="white" font-family="Arial" opacity="0.6"%3EMovie Coming Soon%3C/text%3E%3C/svg%3E';
  }
  // Default poster placeholder
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="750"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0" y1="0" x2="1" y2="1"%3E%3Cstop offset="0%25" style="stop-color:%234F46E5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%237C3AED;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="500" height="750" fill="url(%23grad)"/%3E%3Ctext x="50%25" y="40%25" font-size="36" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial" opacity="0.8"%3EQuickShow%3C/text%3E%3Ctext x="50%25" y="55%25" font-size="20" text-anchor="middle" fill="white" font-family="Arial" opacity="0.6"%3EMovie Poster%3C/text%3E%3Ctext x="50%25" y="70%25" font-size="16" text-anchor="middle" fill="white" font-family="Arial" opacity="0.5"%3ENot Available%3C/text%3E%3C/svg%3E';
};

/**
 * Validates if a TMDB image URL is accessible
 * @param {string} url - The image URL to validate
 * @returns {Promise<boolean>} - True if image is accessible
 */
export const validateImageUrl = async (url) => {
  if (!url) return false;
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return response.ok || response.status === 0; // 0 for CORS
  } catch (error) {
    console.warn('Image validation failed:', error.message);
    return false;
  }
};

/**
 * Gets the best available image for a movie
 * Fallback chain: poster_path → backdrop_path → placeholder
 * @param {object} movie - Movie object from TMDB/API
 * @param {string} imageType - 'poster' or 'backdrop'
 * @returns {string} - Image URL (TMDB or placeholder)
 */
export const getMovieImageUrl = (movie, imageType = 'poster') => {
  if (!movie) {
    return getPlaceholderImage(imageType);
  }

  if (imageType === 'backdrop') {
    // For backdrop: try backdrop first, then poster, then placeholder
    if (movie.backdrop_path) {
      return getTMDBImageUrl(movie.backdrop_path, 'w1280');
    }
    if (movie.poster_path) {
      return getTMDBImageUrl(movie.poster_path, 'w780');
    }
    return getPlaceholderImage('backdrop');
  }

  // For poster: try poster first, then backdrop, then placeholder
  if (movie.poster_path) {
    return getTMDBImageUrl(movie.poster_path, 'w500');
  }
  if (movie.backdrop_path) {
    return getTMDBImageUrl(movie.backdrop_path, 'w500');
  }
  return getPlaceholderImage('poster');
};
