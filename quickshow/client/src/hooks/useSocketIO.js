import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

/**
 * Custom hook for Socket.IO connection and seat updates
 * Manages connection lifecycle and event handling for real-time seat availability
 */
export const useSocketIO = (showId) => {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [lockedSeats, setLockedSeats] = useState(new Set());
  const [occupiedSeats, setOccupiedSeats] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!showId) return;

    // Socket.IO requires an absolute URL. If PROD and localhost is embedded, or it's missing, fallback to production backend.
    const getSocketUrl = () => {
      let envUrl = import.meta.env.VITE_BACKEND_URL || '';
      if (import.meta.env.PROD && (!envUrl || envUrl.includes('localhost'))) {
        return 'https://movie-ticket-booking-o9ga.onrender.com';
      }
      envUrl = envUrl.replace(/\/+$/, '');
      if (envUrl.endsWith('/api')) envUrl = envUrl.substring(0, envUrl.length - 4);
      return envUrl || 'http://localhost:5000';
    };
    const SOCKET_URL = getSocketUrl();

    // Get auth token and establish connection
    const setupSocket = async () => {
      try {
        if (!token) {
          console.warn('Socket.IO connection failed: No token available');
          return;
        }
        
        // ✅ SECURITY: Pass auth token to Socket.IO
        const socket = io(SOCKET_URL, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling'],
          extraHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });

        socketRef.current = socket;

        // Connection handlers
        socket.on('connect', () => {
          console.log('🔌 Socket connected:', socket.id);
          setIsConnected(true);

          // Join show-specific room
          socket.emit('join:show', showId);
        });

        socket.on('disconnect', () => {
          console.log('❌ Socket disconnected');
          setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });

        // Seat lock event - when user locks seats for payment
        socket.on('seats:locked', (data) => {
          const { seats, userId } = data;
          console.log('🔒 Seats locked:', seats, 'by user:', userId);
          
          setLockedSeats((prev) => {
            const newSet = new Set(prev);
            seats.forEach((seat) => newSet.add(seat));
            return newSet;
          });
        });

        // Seat occupied event - when payment succeeds
        socket.on('seats:occupied', (data) => {
          const { seats, userId } = data;
          console.log('✅ Seats occupied (payment confirmed):', seats, 'by user:', userId);
          
          setOccupiedSeats((prev) => {
            const newSet = new Set(prev);
            seats.forEach((seat) => newSet.add(seat));
            return newSet;
          });

          // Remove from locked seats
          setLockedSeats((prev) => {
            const newSet = new Set(prev);
            seats.forEach((seat) => newSet.delete(seat));
            return newSet;
          });
        });

        // Seat released event - when payment fails or booking expires
        socket.on('seats:released', (data) => {
          const { seats, userId } = data;
          console.log('🔓 Seats released:', seats, 'by user:', userId);
          
          setLockedSeats((prev) => {
            const newSet = new Set(prev);
            seats.forEach((seat) => newSet.delete(seat));
            return newSet;
          });
        });
      } catch (error) {
        console.error('Error setting up Socket.IO:', error);
      }
    };

    setupSocket();

    // Cleanup
    return () => {
      if (socketRef.current) {
        const showId_local = showId;
        socketRef.current.emit('leave:show', showId_local);
        socketRef.current.disconnect();
      }
    };
  }, [showId, token]);

  // Function to manually join a show room (useful if reconnecting)
  const joinShow = useCallback((id) => {
    if (socketRef.current) {
      socketRef.current.emit('join:show', id);
      console.log('📍 Joined show room:', id);
    }
  }, []);

  // Function to manually leave a show room
  const leaveShow = useCallback((id) => {
    if (socketRef.current) {
      socketRef.current.emit('leave:show', id);
      console.log('📍 Left show room:', id);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    lockedSeats,
    occupiedSeats,
    joinShow,
    leaveShow,
  };
};
