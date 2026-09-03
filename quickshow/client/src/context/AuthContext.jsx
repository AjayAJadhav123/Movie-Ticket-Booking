import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const getApiBase = () => {
  // In production: ALWAYS use relative URLs so Vercel proxy routes to Render
  if (import.meta.env.PROD) return '';
  let envUrl = import.meta.env.VITE_BACKEND_URL || '';
  envUrl = envUrl.replace(/\/+$/, '');
  if (envUrl.endsWith('/api')) envUrl = envUrl.substring(0, envUrl.length - 4);
  return envUrl;
};
const API_BASE = getApiBase();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Computed property
  const isSignedIn = !!user;

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      // First try admin token, then regular token
      const currentToken = adminToken || token;
      
      if (currentToken) {
        try {
          // If we have an adminToken, we must verify it against the check-admin endpoint
          // But for a general auth initialization, we need a /me endpoint or we just decode
          // Wait, we need to verify the token is valid.
          const response = await axios.get(`${API_BASE}/api/user/me`, {
            headers: { Authorization: `Bearer ${currentToken}` }
          });
          
          if (response.data.success) {
            setUser(response.data.user);
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          // If token is invalid, clear it
          handleLogout();
        }
      }
      setIsLoaded(true);
    };

    initializeAuth();
  }, [token, adminToken]);

  const handleLogin = (jwt, userData, isAdmin = false) => {
    if (isAdmin) {
      localStorage.setItem('adminToken', jwt);
      setAdminToken(jwt);
    } else {
      localStorage.setItem('token', jwt);
      setToken(jwt);
    }
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    setToken(null);
    setAdminToken(null);
    setUser(null);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    setAdminToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        isSignedIn,
        user,
        token,
        adminToken,
        login: handleLogin,
        logout: handleLogout,
        adminLogout: handleAdminLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
