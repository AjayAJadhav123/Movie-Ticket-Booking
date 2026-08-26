import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useMovieImage } from '../hooks/useMovieImage';
import { getPlaceholderImage } from '../utils/imageUtils';

export default function MovieCard({ movie }) {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  // Ensure we have a valid movie ID for navigation
  const movieId = movie._id || movie.id;
  if (!movieId) return null;

  const title = movie.title || 'Unknown Title';
  
  // Rating format
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';
  
  // Language format
  const language = movie.language || (movie.original_language === 'hi' ? 'Hindi' : movie.original_language === 'en' ? 'English' : 'Multiple');
  
  // Certificate format
  const certificate = movie.certificate || 'UA';

  // Get image URL
  const imageUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : getPlaceholderImage('poster');

  return (
    <Link 
      to={`/movie/${movieId}`} 
      className="group flex flex-col gap-2 rounded-xl overflow-hidden transition-all duration-300"
    >
      {/* Poster Container */}
      <div className="relative w-full overflow-hidden rounded-xl bg-[#1a1a1a]" style={{ aspectRatio: '2/3' }}>
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.src = getPlaceholderImage('poster');
          }}
        />
        
        {/* Dark gradient overlay for bottom text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 transition-opacity" />

        {/* Rating overlay (Bottom Left) */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-semibold drop-shadow-md z-10">
          <Star size={12} className="text-primary fill-primary" />
          <span>{rating}/10</span>
        </div>
      </div>

      {/* Meta Content */}
      <div className="px-1 py-1">
        <h3 className="font-bold text-white text-base leading-tight mb-1 truncate group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs text-slate-400 font-medium">
          {certificate} &bull; {language}
        </p>
      </div>
    </Link>
  );
}
