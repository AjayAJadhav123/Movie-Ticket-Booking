import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const AppContext = createContext();

// Wrapper component to use useAuth hook
function AppProviderInner({ children }) {
  const { isLoaded, isSignedIn, user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [latestMovies, setLatestMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [shows, setShows] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // In production: ALWAYS use relative URLs so Vercel proxy (vercel.json) routes
  // /api/* requests to Render. Any absolute URL here bypasses the proxy → CORS errors.
  const getApiBase = () => {
    if (import.meta.env.PROD) return '';
    let envUrl = import.meta.env.VITE_BACKEND_URL || '';
    envUrl = envUrl.replace(/\/+$/, '');
    if (envUrl.endsWith('/api')) envUrl = envUrl.substring(0, envUrl.length - 4);
    return envUrl;
  };
  const API_BASE = getApiBase();

  // Create axios client once (stable reference)
  const apiClientRef = useRef(null);

  if (!apiClientRef.current) {
    apiClientRef.current = axios.create({
      baseURL: API_BASE,
      // A failed API must display an error state instead of keeping a page
      // loader visible forever.
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const apiClient = apiClientRef.current;

  // Setup interceptor ONCE
  useEffect(() => {
    // Setup fresh interceptor
    const requestInterceptorId = apiClient.interceptors.request.use(
      async (config) => {
        try {
          // If we have an adminToken, use it first (Admin Session Isolation)
          const adminToken = localStorage.getItem('adminToken');
          if (adminToken) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${adminToken}`;
            return config;
          }

          // Otherwise, get standard token
          const token = localStorage.getItem('token');
          if (token) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error getting token:', error.message);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      apiClient.interceptors.request.eject(requestInterceptorId);
    };
  }, [apiClient]);

  const fetchMovies = useCallback(async (filters = {}, append = false) => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/movie/list', { params: filters });
      if (response.data.success) {
        if (append) {
          setMovies((prev) => {
            const newMovies = response.data.data || [];
            const existingIds = new Set(prev.map(m => String(m.id || m._id)));
            const uniqueNew = newMovies.filter(m => !existingIds.has(String(m.id || m._id)));
            return [...prev, ...uniqueNew];
          });
        } else {
          setMovies(response.data.data || []);
        }
        setError(null);
        return response.data;
      }
      return { success: false };
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError(err.response?.data?.message || 'Error fetching movies');
      return { success: false, message: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLatestMovies = useCallback(async () => {
    try {
      console.log('📡 AppContext: Fetching latest movies from API...');
      const response = await apiClient.get('/api/movie/latest');
      console.log('📥 AppContext: API response:', {
        success: response.data.success,
        dataCount: response.data.data?.length,
        message: response.data.message,
        source: response.data.source,
      });
      if (response.data.success) {
        setLatestMovies(response.data.data || []);
        console.log('✅ AppContext: Latest movies set:', response.data.data?.length);
        
        // Return source info so components can detect fallback mode
        return {
          success: true,
          isFallback: response.data.source === 'fallback',
          message: response.data.message,
        };
      }
      return { success: false };
    } catch (err) {
      console.error('❌ AppContext: Error fetching latest movies:', err);
      setLatestMovies([]);
      return { success: false };
    }
  }, []);

  const fetchTrendingMovies = useCallback(async () => {
    try {
      console.log('📡 AppContext: Fetching trending movies...');
      const response = await apiClient.get('/api/movie/trending');
      if (response.data.success) {
        setTrendingMovies(response.data.data || []);
        console.log('✅ AppContext: Trending movies set:', response.data.data?.length);
      } else {
        console.warn('⚠️ AppContext: Trending fetch returned error:', response.data.message);
        setTrendingMovies([]);
        setError(response.data.message);
      }
    } catch (err) {
      console.error('❌ AppContext: Error fetching trending movies:', err.message);
      if (err.response?.status === 503) {
        setError('TMDB service is temporarily unavailable.');
      }
      setTrendingMovies([]);
    }
  }, []);

  const fetchNowPlayingMovies = useCallback(async () => {
    try {
      console.log('📡 AppContext: Fetching now playing movies...');
      const response = await apiClient.get('/api/movie/now-playing');
      if (response.data.success) {
        setNowPlayingMovies(response.data.data || []);
        console.log('✅ AppContext: Now playing movies set:', response.data.data?.length);
      } else {
        console.warn('⚠️ AppContext: Now playing fetch returned error:', response.data.message);
        setNowPlayingMovies([]);
        setError(response.data.message);
      }
    } catch (err) {
      console.error('❌ AppContext: Error fetching now playing movies:', err.message);
      if (err.response?.status === 503) {
        setError('TMDB service is temporarily unavailable.');
      }
      setNowPlayingMovies([]);
    }
  }, []);

  const fetchUpcomingMovies = useCallback(async () => {
    try {
      console.log('📡 AppContext: Fetching upcoming movies...');
      const response = await apiClient.get('/api/movie/upcoming');
      if (response.data.success) {
        setUpcomingMovies(response.data.data || []);
        console.log('✅ AppContext: Upcoming movies set:', response.data.data?.length);
      } else {
        console.warn('⚠️ AppContext: Upcoming fetch returned error:', response.data.message);
        setUpcomingMovies([]);
        setError(response.data.message);
      }
    } catch (err) {
      console.error('❌ AppContext: Error fetching upcoming movies:', err.message);
      if (err.response?.status === 503) {
        setError('TMDB service is temporarily unavailable.');
      }
      setUpcomingMovies([]);
    }
  }, []);

  const fetchPopularMovies = useCallback(async () => {
    try {
      console.log('📡 AppContext: Fetching popular movies from API...');
      const response = await apiClient.get('/api/movie/popular');
      console.log('📥 AppContext: API response:', {
        success: response.data.success,
        dataCount: response.data.data?.length,
        message: response.data.message,
        source: response.data.source,
      });
      if (response.data.success) {
        setPopularMovies(response.data.data || []);
        console.log('✅ AppContext: Popular movies set:', response.data.data?.length);
      } else {
        console.warn('⚠️ AppContext: API returned error:', response.data.message);
        setPopularMovies([]);
        setError(response.data.message);
      }
    } catch (err) {
      console.error('❌ AppContext: Error fetching popular movies:', err.message);
      if (err.response?.status === 503) {
        setError('TMDB service is temporarily unavailable. Please try again later.');
      } else {
        setError('Failed to fetch movies. Please check your connection.');
      }
      setPopularMovies([]);
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    try {
      setRecommendationsLoading(true);
      const response = await apiClient.get('/api/movie/recommendations');
      if (response.data.success) {
        setRecommendedMovies(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setRecommendedMovies([]);
    } finally {
      setRecommendationsLoading(false);
    }
  }, []);

  const fetchMovieById = useCallback(async (movieId) => {
    try {
      setLoading(true);
      // Try backend first
      try {
        const response = await apiClient.get(`/api/movie/${movieId}`);
        if (response.data.success && response.data.data) {
          setError(null);
          return response.data.data;
        }
      } catch (backendErr) {
        if (import.meta.env.DEV) console.warn('Backend movie fetch failed, trying TMDB directly:', backendErr.message);
      }
      // If backend fails, we do NOT fallback to client-side TMDB to protect the API key
      setError('Movie not found');
      return null;
    } catch (err) {
      console.error('Error fetching movie:', err);
      setError(err.response?.data?.message || 'Error fetching movie');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchShows = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/show/list', { params: filters });
      if (response.data.success) {
        setShows(response.data.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching shows:', err);
      setError(err.response?.data?.message || 'Error fetching shows');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchShowById = useCallback(async (showId) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/show/${showId}`);
      if (response.data.success) {
        setSelectedShow(response.data.data);
        setError(null);
        return response.data.data;
      }
    } catch (err) {
      console.error('Error fetching show:', err);
      setError(err.response?.data?.message || 'Error fetching show');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/booking/user-bookings');
      if (response.data.success) {
        setBookings(response.data.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Error fetching bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/user/favorites');
      if (response.data.success) {
        setFavorites(response.data.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setFavorites([]);
    }
  }, []);

  const addFavorite = useCallback(async (movieId) => {
    try {
      const response = await apiClient.post('/api/user/add-favorite', { movieId });
      if (response.data.success) {
        // Optimistically update the state instead of refetching
        setFavorites((prev) => {
          // Avoid adding duplicates
          if (prev.some((fav) => fav._id === movieId)) {
            return prev;
          }
          // Add the movie to favorites (we might not have the full movie object, so fetch it)
          return [...prev, { _id: movieId }];
        });
        // Fetch the full favorites list in the background to ensure consistency
        setTimeout(() => fetchFavorites(), 100);
        return true;
      }
    } catch (err) {
      console.error('Error adding favorite:', err);
      setError(err.response?.data?.message || 'Error adding favorite');
      return false;
    }
  }, [fetchFavorites]);

  const removeFavorite = useCallback(async (movieId) => {
    try {
      const response = await apiClient.post('/api/user/remove-favorite', { movieId });
      if (response.data.success) {
        // Optimistically update the state
        setFavorites((prev) => prev.filter((m) => m._id !== movieId));
        return true;
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
      setError(err.response?.data?.message || 'Error removing favorite');
      return false;
    }
  }, [fetchFavorites]);

  const createStripeSession = useCallback(async (showId, seats) => {
    try {
      setLoading(true);

      // Use apiClient so the auth interceptor auto-attaches the Bearer token
      // and the correct base URL (relative on Vercel, proxied to Render) is used.
      const response = await apiClient.post('/api/booking/create-stripe-session', {
        showId,
        seats,
      });

      if (response.data.success) {
        setError(null);
        return response.data.data;
      } else {
        const errorMsg = response.data.message || 'Failed to create payment session';
        setError(errorMsg);
        return { message: errorMsg };
      }
    } catch (err) {
      console.error('Error creating Stripe session:', err.response?.data?.message || err.message);
      const errorMsg = err.response?.data?.message || 'Error creating payment session';
      setError(errorMsg);
      return { message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const value = {
    movies,
    fetchMovies,
    fetchMovieById,
    latestMovies,
    fetchLatestMovies,
    trendingMovies,
    fetchTrendingMovies,
    nowPlayingMovies,
    fetchNowPlayingMovies,
    upcomingMovies,
    fetchUpcomingMovies,
    popularMovies,
    fetchPopularMovies,
    recommendedMovies,
    fetchRecommendations,
    recommendationsLoading,
    shows,
    fetchShows,
    fetchShowById,
    selectedShow,
    setSelectedShow,
    selectedSeats,
    setSelectedSeats,
    bookings,
    fetchUserBookings,
    favorites,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    createStripeSession,
    loading,
    error,
    apiClient,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Main export - wraps AppProviderInner to enable useAuth hook
export const AppProvider = ({ children }) => {
  return <AppProviderInner>{children}</AppProviderInner>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
