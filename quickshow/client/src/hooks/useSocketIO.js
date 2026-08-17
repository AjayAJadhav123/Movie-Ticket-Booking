import { useEffect, useRef, useCallback, useState } from 'react';
import io from 'socket.io-client';

/**
 * Custom hook for Socket.IO connection and seat updates
 * Manages connection lifecycle and event handling for real-time seat availability
 */
export const useSocketIO = (showId) => {
  const socketRef = useRef(null);
  const [lockedSeats, setLockedSeats] = useState(new Set());
  const [occupiedSeats, setOccupiedSeats] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!showId) return;

    const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    // Create socket connection
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
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

    // Cleanup
    return () => {
      if (socket) {
        socket.emit('leave:show', showId);
        socket.disconnect();
      }
    };
  }, [showId]);

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
