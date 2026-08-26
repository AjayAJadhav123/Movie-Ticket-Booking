import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import MovieCard from '../components/MovieCard';
import RecommendedMovies from '../components/RecommendedMovies';
import TrailerModal from '../components/TrailerModal';
import Loading from '../components/Loading';

export default function Home() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { 
    latestMovies,
    fetchLatestMovies,
    bookings, 
    fetchUserBookings, 
    loading,
    trendingMovies,
    fetchTrendingMovies,
    nowPlayingMovies,
    fetchNowPlayingMovies,
    upcomingMovies,
    fetchUpcomingMovies,
    popularMovies,
    fetchPopularMovies,
  } = useApp();
  const [trailerMovie, setTrailerMovie] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetchLatestMovies();
    fetchTrendingMovies();
    fetchNowPlayingMovies();
    fetchUpcomingMovies();
    fetchPopularMovies();
    if (isSignedIn) {
      fetchUserBookings();
    }
  }, [isSignedIn]);

  if (loading && latestMovies.length === 0 && trendingMovies.length === 0) {
    return <Loading />;
  }

  const filters = ['All', 'Hindi', 'English', 'Marathi'
    , 'Action', 'Comedy'];

  const TMDB_GENRE_MAP = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Science Fiction',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western'
  };

  const getNormalizedGenres = (movie) => {
    const extractedGenres = new Set();
    if (typeof movie.genre === 'string') extractedGenres.add(movie.genre.toLowerCase());
    if (Array.isArray(movie.genres)) {
      movie.genres.forEach(g => {
        if (typeof g === 'string') extractedGenres.add(g.toLowerCase());
        else if (g && typeof g === 'object' && g.name) extractedGenres.add(g.name.toLowerCase());
      });
    }
    if (Array.isArray(movie.genre_ids)) {
      movie.genre_ids.forEach(id => {
        const genreName = TMDB_GENRE_MAP[id];
        if (genreName) extractedGenres.add(genreName.toLowerCase());
      });
    }
    return Array.from(extractedGenres);
  };

  const filterMovies = (movies) => {
    if (activeFilter === 'All') return movies;
    
    return movies.filter(movie => {
      const filterLower = activeFilter.toLowerCase();
      
      if (['hindi', 'english', 'marathi'].includes(filterLower)) {
        const langMap = { 'hindi': 'hi', 'english': 'en', 'marathi': 'mr' };
        const targetLangCode = langMap[filterLower];
        
        return (
          (movie.language && movie.language.toLowerCase() === targetLangCode) ||
          (movie.original_language && movie.original_language.toLowerCase() === targetLangCode) ||
          (movie.language && movie.language.toLowerCase() === filterLower)
        );
      }
      
      if (['action', 'comedy'].includes(filterLower)) {
        const genres = getNormalizedGenres(movie);
        return genres.includes(filterLower);
      }
      
      return true;
    });
  };

  const filteredTrending = filterMovies(trendingMovies);
  const filteredNowPlaying = filterMovies(nowPlayingMovies);
  const filteredPopular = filterMovies(popularMovies);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 text-white">
      <div className="container mx-auto px-4 pt-6">
        
        {/* Title */}
        <h1 className="text-3xl font-bold mb-4">Movies in Pune</h1>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-2 custom-scrollbar scroll-smooth snap-x">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors snap-start ${
                activeFilter === filter 
                  ? 'bg-primary text-white' 
                  : 'bg-[#1a1a1a] text-slate-300 hover:bg-[#2a2a2a]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-12 mt-4">
          
          {/* TRENDING MOVIES SECTION */}
          {filteredTrending.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Trending Now</h2>
                <Link to="/movies" className="text-primary hover:text-red-400 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredTrending.slice(0, 10).map((movie) => {
                  const movieId = movie._id || movie.id;
                  if (!movieId) return null;
                  return (
                    <MovieCard
                      key={movieId}
                      movie={movie}
                      onTrailerClick={() => setTrailerMovie(movie)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* NOW SHOWING SECTION */}
          {filteredNowPlaying.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Now Showing</h2>
                <Link to="/movies" className="text-primary hover:text-red-400 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredNowPlaying.slice(0, 10).map((movie) => {
                  const movieId = movie._id || movie.id;
                  if (!movieId) return null;
                  return (
                    <MovieCard
                      key={movieId}
                      movie={movie}
                      onTrailerClick={() => setTrailerMovie(movie)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* POPULAR SECTION */}
          {filteredPopular.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Popular</h2>
                <Link to="/movies" className="text-primary hover:text-red-400 text-sm font-medium">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredPopular.slice(0, 5).map((movie) => {
                  const movieId = movie._id || movie.id;
                  if (!movieId) return null;
                  return (
                    <MovieCard
                      key={movieId}
                      movie={movie}
                      onTrailerClick={() => setTrailerMovie(movie)}
                    />
                  );
                })}
              </div>
            </section>
          )}

        </div>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        movie={trailerMovie}
        isOpen={!!trailerMovie}
        onClose={() => setTrailerMovie(null)}
      />
    </div>
  );
}
