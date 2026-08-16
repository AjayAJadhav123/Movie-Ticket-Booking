import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

const AppContext = createContext();

// Wrapper component to use useAuth hook
function AppProviderInner({ children }) {
  const { getToken } = useAuth();
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const apiClient = axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  apiClient.interceptors.request.use(
    async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting Clerk token:', error);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  const fetchMovies = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/movie/list', { params: filters });
      if (response.data.success) {
        setMovies(response.data.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError(err.response?.data?.message || 'Error fetching movies');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMovieById = useCallback(async (movieId) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/movie/${movieId}`);
      if (response.data.success) {
        setError(null);
        return response.data.data;
      }
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
        setFavorites((prev) => [...prev, response.data.data]);
        return true;
      }
    } catch (err) {
      console.error('Error adding favorite:', err);
      setError(err.response?.data?.message || 'Error adding favorite');
      return false;
    }
  }, []);

  const removeFavorite = useCallback(async (movieId) => {
    try {
      const response = await apiClient.post('/api/user/remove-favorite', { movieId });
      if (response.data.success) {
        setFavorites((prev) => prev.filter((m) => m._id !== movieId));
        return true;
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
      setError(err.response?.data?.message || 'Error removing favorite');
      return false;
    }
  }, []);

  const createStripeSession = useCallback(async (showId, seats) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/api/booking/create-stripe-session', {
        showId,
        seats,
      });
      if (response.data.success) {
        setError(null);
        return response.data.data;
      } else {
        // Handle error response from backend
        const errorMsg = response.data.message || 'Failed to create payment session';
        setError(errorMsg);
        return { message: errorMsg };
      }
    } catch (err) {
      console.error('Error creating Stripe session:', err);
      const errorMsg = err.response?.data?.message || 'Error creating payment session';
      setError(errorMsg);
      return { message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    movies,
    fetchMovies,
    fetchMovieById,
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
