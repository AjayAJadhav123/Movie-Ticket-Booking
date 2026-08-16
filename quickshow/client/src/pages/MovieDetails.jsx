import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Play, Calendar, Clock, Ticket, Star, Globe, Users } from 'lucide-react';
import Loading from '../components/Loading';
import TrailerModal from '../components/TrailerModal';
import { toast } from 'react-toastify';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchMovieById, apiClient, loading } = useApp();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [showsForDate, setShowsForDate] = useState([]);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [backdropLoaded, setBackdropLoaded] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);

  useEffect(() => {
    const loadMovie = async () => {
      const movieData = await fetchMovieById(id);
      if (movieData) {
        setMovie(movieData);
      }
    };
    loadMovie();
  }, [id, fetchMovieById]);

  useEffect(() => {
    if (movie?._id) {
      fetchAvailableDates();
    }
  }, [movie?._id]);

  useEffect(() => {
    if (selectedDate) {
      fetchShowsByDate();
    }
  }, [selectedDate]);

  const fetchAvailableDates = async () => {
    try {
      const response = await apiClient.get('/api/show/available-dates', {
        params: { movieId: movie._id },
      });
      if (response.data.success && response.data.data.length > 0) {
        const dates = response.data.data;
        setSelectedDate(dates[0]);
      }
    } catch (error) {
      console.error('Error fetching dates:', error);
    }
  };

  const fetchShowsByDate = async () => {
    try {
      const response = await apiClient.get('/api/show/by-movie-date', {
        params: {
          movieId: movie._id,
          date: selectedDate,
        },
      });
      if (response.data.success) {
        setShowsForDate(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching shows:', error);
      toast.error('Error fetching shows');
    }
  };

  const handleSelectShow = (show) => {
    navigate(`/seat-layout/${show._id}`);
  };

  const getBackdropUrl = () => {
    if (!movie?.backdrop_path) return null;
    // Handle both relative TMDB paths and complete URLs
    if (movie.backdrop_path.startsWith('http')) {
      return movie.backdrop_path;
    }
    return `https://image.tmdb.org/t/p/original${movie.backdrop_path}`;
  };

  const getPosterUrl = () => {
    if (!movie?.poster_path) return null;
    // Handle both relative TMDB paths and complete URLs
    if (movie.poster_path.startsWith('http')) {
      return movie.poster_path;
    }
    return `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  };

  if (loading || !movie) {
    return <Loading />;
  }

  const backdropUrl = getBackdropUrl();
  const posterUrl = getPosterUrl();

  return (
    <div className="bg-gray-950">
      {/* Hero Section with Backdrop */}
      <div className="relative w-full overflow-hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 h-64 sm:h-80 md:h-96 lg:h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 bg-cover bg-center"
          style={backdropUrl ? { backgroundImage: `url(${backdropUrl})` } : {}}
        >
          {!backdropLoaded && backdropUrl && (
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 to-gray-900 animate-pulse" />
          )}
        </div>

        {/* Backdrop Image (for proper loading) */}
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt="backdrop"
            className="hidden"
            onLoad={() => setBackdropLoaded(true)}
            onError={() => setBackdropLoaded(false)}
          />
        )}

        {/* Dark Gradient Overlays for Text Readability */}
        <div className="absolute inset-0 h-64 sm:h-80 md:h-96 lg:h-screen bg-gradient-to-b from-black/40 via-black/50 to-gray-950" />
        <div className="absolute inset-0 h-64 sm:h-80 md:h-96 lg:h-screen bg-gradient-to-r from-gray-950 via-transparent to-gray-950" />

        {/* Content Container */}
        <div className="relative h-64 sm:h-80 md:h-96 lg:h-screen flex items-end lg:items-center">
          <div className="w-full">
            <div className="container mx-auto px-4 py-6 md:py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                {/* Poster */}
                <div className="hidden md:flex justify-center">
                  <div className="relative rounded-xl overflow-hidden shadow-2xl">
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={movie.title}
                        onLoad={() => setPosterLoaded(true)}
                        className="w-40 md:w-48 lg:w-56 h-60 md:h-72 lg:h-80 object-cover transition-opacity duration-500"
                      />
                    ) : (
                      <div className="w-40 md:w-48 lg:w-56 h-60 md:h-72 lg:h-80 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                        <span className="text-gray-500 text-center text-xs md:text-sm px-4">No poster available</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Movie Info */}
                <div className="md:col-span-2 lg:col-span-3 text-white flex flex-col justify-end lg:justify-center pb-4 md:pb-0">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 drop-shadow-lg">
                    {movie.title}
                  </h1>

                  {/* Mobile Poster */}
                  {posterUrl && (
                    <div className="md:hidden mb-4 rounded-lg overflow-hidden shadow-xl max-w-xs">
                      <img
                        src={posterUrl}
                        alt={movie.title}
                        className="w-full h-auto object-cover max-h-64"
                      />
                    </div>
                  )}

                  {/* Quick Info */}
                  <div className="space-y-2 mb-6 text-sm md:text-base">
                    <div className="flex items-center gap-2 text-gray-100">
                      <Calendar size={18} />
                      <span>{movie.release_date ? new Date(movie.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                    </div>

                    {movie.rating && (
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Star size={18} fill="currentColor" />
                        <span className="font-bold">{movie.rating.toFixed(1)}/10</span>
                      </div>
                    )}

                    {movie.language && (
                      <div className="flex items-center gap-2 text-gray-100">
                        <Globe size={18} />
                        <span>{movie.language.toUpperCase()}</span>
                      </div>
                    )}

                    {movie.genres && movie.genres.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {movie.genres.map((genre) => (
                          <span
                            key={genre}
                            className="px-3 py-1 bg-indigo-600/80 rounded-full text-xs md:text-sm font-semibold backdrop-blur-sm"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Trailer Button */}
                  {movie.trailer && (
                    <div>
                      <button
                        onClick={() => setTrailerOpen(true)}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 w-full md:w-auto justify-center md:justify-start text-sm md:text-base"
                      >
                        <Play size={20} fill="white" />
                        Watch Trailer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white py-8 md:py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-gray-900">Story</h2>
          <p className="text-gray-700 text-base md:text-lg leading-relaxed max-w-4xl">
            {movie.overview}
          </p>

          {/* Cast Section */}
          {movie.cast && movie.cast.length > 0 && (
            <div className="mt-10 md:mt-14">
              <div className="flex items-center gap-3 mb-6">
                <Users size={28} className="text-indigo-600" />
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Cast</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {movie.cast.map((actor, index) => (
                  <span
                    key={index}
                    className="bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-900 px-4 py-2 rounded-full text-sm md:text-base font-semibold border border-indigo-200 hover:shadow-md transition-shadow"
                  >
                    {actor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shows Section */}
      <div className="bg-gray-950 py-8 md:py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 text-white">Book Tickets</h2>

          {/* No Shows Message */}
          {!selectedDate && showsForDate.length === 0 && (
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-8 md:p-12 text-center">
              <Ticket size={48} className="mx-auto text-gray-500 mb-4" />
              <p className="text-gray-300 text-lg md:text-xl">No shows available for this movie at the moment.</p>
              <p className="text-gray-500 text-sm md:text-base mt-2">Check back soon for showtime updates!</p>
            </div>
          )}

          {/* Date Selection and Shows Grid */}
          {selectedDate && (
            <>
              <div className="mb-8">
                <h3 className="text-lg md:text-xl font-semibold text-white mb-4">Showing on {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>

                {showsForDate.length === 0 ? (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
                    <p className="text-gray-400 text-base md:text-lg">No shows available for this date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {showsForDate.map((show) => (
                      <div
                        key={show._id}
                        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 hover:border-indigo-500 p-5 md:p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                      >
                        <div className="mb-4">
                          <p className="text-gray-400 text-xs md:text-sm uppercase tracking-wider font-semibold">Show Time</p>
                          <p className="text-2xl md:text-3xl font-bold text-white mt-1">{show.time}</p>
                        </div>

                        <div className="mb-4 pb-4 border-b border-gray-700">
                          <p className="text-gray-400 text-xs md:text-sm uppercase tracking-wider font-semibold">Price per Seat</p>
                          <p className="text-2xl md:text-3xl font-bold text-indigo-400 mt-1">₹{show.price.toFixed(2)}</p>
                        </div>

                        <div className="mb-6">
                          <p className="text-gray-400 text-xs md:text-sm uppercase tracking-wider font-semibold">Available Seats</p>
                          <p className="text-xl md:text-2xl font-bold text-green-400 mt-1">
                            {show.totalSeats - (show.occupiedSeats?.length || 0)} / {show.totalSeats}
                          </p>
                        </div>

                        <button
                          onClick={() => handleSelectShow(show)}
                          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm md:text-base"
                        >
                          Select Seats
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        movie={movie}
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
      />
    </div>
  );
}
