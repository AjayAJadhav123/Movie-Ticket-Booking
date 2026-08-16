import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import Loading from '../components/Loading';
import { Play, ChevronLeft, ChevronRight, Ticket, Calendar, Clock } from 'lucide-react';
import { useMovieImageWithFallback } from '../hooks/useMovieImage';
import { getPlaceholderImage } from '../utils/imageUtils';

export default function Home() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { 
    movies, 
    fetchMovies, 
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
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    fetchMovies({ page: 1 });
    fetchTrendingMovies();
    fetchNowPlayingMovies();
    fetchUpcomingMovies();
    fetchPopularMovies();
    if (isSignedIn) {
      fetchUserBookings();
    }
  }, [isSignedIn]);

  useEffect(() => {
    // Use trending movies for hero if available, otherwise use default movies
    const heroMovies = trendingMovies.length > 0 ? trendingMovies : movies;
    if (heroMovies && heroMovies.length > 0) {
      setFeaturedMovie(heroMovies[currentHeroIndex % heroMovies.length]);
    }
  }, [trendingMovies, movies, currentHeroIndex]);

  const handleHeroNavigation = (direction) => {
    const heroMovies = trendingMovies.length > 0 ? trendingMovies : movies;
    if (heroMovies.length === 0) return;
    setCurrentHeroIndex((prev) => 
      direction === 'next' 
        ? (prev + 1) % heroMovies.length 
        : (prev - 1 + heroMovies.length) % heroMovies.length
    );
  };

  const recentBookings = bookings.slice(0, 3);

  if (loading && movies.length === 0 && trendingMovies.length === 0) {
    return <Loading />;
  }

  // Get hero image with fallback
  const heroMovies = trendingMovies.length > 0 ? trendingMovies : movies;
  let featuredImageUrl = getPlaceholderImage('backdrop');
  if (featuredMovie?.backdrop_path) {
    featuredImageUrl = `https://image.tmdb.org/t/p/w1280${featuredMovie.backdrop_path}`;
  } else if (featuredMovie?.poster_path) {
    featuredImageUrl = `https://image.tmdb.org/t/p/w780${featuredMovie.poster_path}`;
  }

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* HERO SECTION */}
      {featuredMovie && (
        <div className="relative h-96 md:h-screen overflow-hidden bg-gradient-to-b from-slate-100 to-white mb-12">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${featuredImageUrl})` }}
            onError={(e) => {
              e.target.style.backgroundImage = `url('${getPlaceholderImage('backdrop')}')`;
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent"></div>
          </div>

          <div className="relative h-full flex flex-col justify-center px-4 md:px-12">
            <div className="max-w-2xl">
              {/* Genres */}
              {featuredMovie.genres && featuredMovie.genres.length > 0 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {featuredMovie.genres.slice(0, 3).map((genre) => (
                    <span
                      key={genre}
                      className="text-xs md:text-sm px-3 md:px-4 py-1 md:py-2 bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-300 font-medium"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 text-slate-900 drop-shadow-lg leading-tight">
                {featuredMovie.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 md:gap-8 mb-6 md:mb-8 text-slate-700">
                {featuredMovie.vote_average && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm md:text-base font-semibold text-amber-500">★ {featuredMovie.vote_average.toFixed(1)}</span>
                    <span className="text-xs md:text-sm">/10</span>
                  </div>
                )}
                {featuredMovie.release_date && (
                  <div className="text-sm md:text-base">
                    {new Date(featuredMovie.release_date).getFullYear()}
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-sm md:text-base lg:text-lg text-slate-700 mb-8 md:mb-12 line-clamp-3 md:line-clamp-4 max-w-2xl drop-shadow-lg">
                {featuredMovie.overview}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <button
                  onClick={() => navigate('/movies')}
                  className="flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all hover:shadow-lg"
                >
                  <Ticket size={20} />
                  Book Tickets
                </button>

                {featuredMovie.trailer && (
                  <button
                    onClick={() => setTrailerMovie(featuredMovie)}
                    className="flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-semibold transition-all"
                  >
                    <Play size={20} fill="currentColor" />
                    Watch Trailer
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hero Navigation */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
            <button
              onClick={() => handleHeroNavigation('prev')}
              className="p-2 md:p-3 bg-white/80 hover:bg-white rounded-full text-slate-900 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-2 items-center">
              {heroMovies.slice(0, 5).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentHeroIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === (currentHeroIndex % heroMovies.length) ? 'bg-slate-900 w-6' : 'bg-slate-400'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => handleHeroNavigation('next')}
              className="p-2 md:p-3 bg-white/80 hover:bg-white rounded-full text-slate-900 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}



      <div className="container mx-auto">
        {/* TRENDING MOVIES SECTION */}
        {trendingMovies.length > 0 && (
          <section className="mb-16 md:mb-24">
            <div className="flex items-center justify-between mb-8">
              <h2 className="section-title">Trending Now</h2>
              <a href="/movies" className="text-indigo-600 hover:text-indigo-700 transition text-sm md:text-base font-semibold">
                View All →
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trendingMovies.map((movie) => (
                <MovieCard
                  key={movie.id || movie._id}
                  movie={movie}
                  onTrailerClick={() => setTrailerMovie(movie)}
                />
              ))}
            </div>
          </section>
        )}

        {/* NOW SHOWING SECTION */}
        {nowPlayingMovies.length > 0 && (
          <section className="mb-16 md:mb-24">
            <div className="flex items-center justify-between mb-8">
              <h2 className="section-title">Now Showing</h2>
              <a href="/movies" className="text-indigo-600 hover:text-indigo-700 transition text-sm md:text-base font-semibold">
                View All →
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {nowPlayingMovies.map((movie) => (
                <MovieCard
                  key={movie.id || movie._id}
                  movie={movie}
                  onTrailerClick={() => setTrailerMovie(movie)}
                />
              ))}
            </div>
          </section>
        )}

        {/* COMING SOON SECTION */}
        {upcomingMovies.length > 0 && (
          <section className="mb-16 md:mb-24">
            <h2 className="section-title">Coming Soon</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingMovies.map((movie) => (
                <div key={movie.id || movie._id} className="card card-hover group overflow-hidden">
                  <div className="relative h-56 overflow-hidden bg-slate-100">
                    <img
                      src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : getPlaceholderImage('poster')}
                      alt={movie.title}
                      onError={(e) => {
                        e.target.src = getPlaceholderImage('poster');
                      }}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Calendar className="text-white/30" size={40} />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-base line-clamp-2 mb-2 text-slate-900">{movie.title}</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Releases {new Date(movie.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <button className="w-full text-indigo-600 hover:text-indigo-700 transition font-semibold text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* POPULAR MOVIES SECTION */}
        {popularMovies.length > 0 && (
          <section className="mb-16 md:mb-24">
            <div className="flex items-center justify-between mb-8">
              <h2 className="section-title">Popular</h2>
              <a href="/movies" className="text-indigo-600 hover:text-indigo-700 transition text-sm md:text-base font-semibold">
                View All →
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {popularMovies.map((movie) => (
                <MovieCard
                  key={movie.id || movie._id}
                  movie={movie}
                  onTrailerClick={() => setTrailerMovie(movie)}
                />
              ))}
            </div>
          </section>
        )}

        {/* MY BOOKINGS PREVIEW */}
        {isSignedIn && recentBookings.length > 0 && (
          <section className="mb-16 md:mb-24">
            <div className="flex items-center justify-between mb-8">
              <h2 className="section-title">Your Recent Bookings</h2>
              <a href="/my-bookings" className="text-indigo-600 hover:text-indigo-700 transition text-sm md:text-base font-semibold">
                View All →
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentBookings.map((booking) => (
                <div key={booking._id} className="card card-hover overflow-hidden">
                  <div className="relative h-40 bg-slate-100">
                    <img
                      src={booking.showId?.movieId?.poster_path ? `https://image.tmdb.org/t/p/w500${booking.showId.movieId.poster_path}` : getPlaceholderImage('poster')}
                      alt={booking.movieTitle}
                      onError={(e) => {
                        e.target.src = getPlaceholderImage('poster');
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-lg text-xs font-semibold ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-base line-clamp-1 mb-3 text-slate-900">{booking.movieTitle}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={14} />
                        {new Date(booking.showDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock size={14} />
                        {booking.showTime}
                      </div>
                      <div className="text-sm text-slate-700">
                        <span className="font-semibold">Seats:</span> {booking.seats.join(', ')}
                      </div>
                      <div className="text-sm font-bold text-indigo-600">
                        ₹{booking.amount.toFixed(2)}
                      </div>
                    </div>
                    <button className="w-full text-indigo-600 hover:text-indigo-700 transition font-semibold text-sm">
                      View Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PROMOTIONAL BANNER */}
        <section className="mb-16 md:mb-24">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-pink-600 to-indigo-600 opacity-80"></div>
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="relative px-8 md:px-16 py-12 md:py-20 text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6">Book Your Favorite Movies</h2>
              <p className="text-slate-100 text-base md:text-lg mb-8 md:mb-10 max-w-2xl mx-auto">Get the best cinema experience with QuickShow. Fast booking, secure payments, and great seats.</p>
              <button className="px-8 md:px-12 py-3 md:py-4 bg-white text-indigo-600 font-bold rounded-lg hover:shadow-lg hover:shadow-white/20 transition">
                Book Now
              </button>
            </div>
          </div>
        </section>
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
