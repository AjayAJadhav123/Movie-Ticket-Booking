import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Play, Calendar, Clock, Ticket, Star, Globe, Users } from 'lucide-react';
import Loading from '../components/Loading';
import TrailerModal from '../components/TrailerModal';
import { toast } from 'react-toastify';
import { useMovieImageWithFallback } from '../hooks/useMovieImage';
import { getPlaceholderImage } from '../utils/imageUtils';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchMovieById, apiClient, loading } = useApp();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [showsForDate, setShowsForDate] = useState([]);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const { posterUrl, backdropUrl, isLoading, onPosterError, onBackdropError } = useMovieImageWithFallback(movie);

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
    return backdropUrl;
  };

  const getPosterUrl = () => {
    return posterUrl;
  };

  if (loading || !movie) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-white pt-16 pb-16">
      {/* Hero Section with Backdrop */}
      <div className="relative w-full overflow-hidden mb-12">
        {/* Backdrop */}
        <div
          className="relative h-80 sm:h-96 md:h-[500px] lg:h-screen bg-gradient-to-b from-slate-100 via-white to-white bg-cover bg-center"
          style={backdropUrl ? { backgroundImage: `url(${backdropUrl})` } : {}}
          onError={() => {
            onBackdropError();
          }}
        >
          {!isLoading && backdropUrl && (
            <img
              src={backdropUrl}
              alt="backdrop"
              className="hidden"
              onLoad={() => {}}
              onError={onBackdropError}
            />
          )}

          {/* Professional Light Overlays for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white" />

          {/* Content Container */}
          <div className="relative h-full flex items-end lg:items-center">
            <div className="w-full">
              <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                  {/* Poster */}
                  <div className="hidden md:flex justify-center">
                    <div className="relative rounded-xl overflow-hidden shadow-2xl">
                      <img
                        src={posterUrl}
                        alt={movie.title}
                        onError={onPosterError}
                        className="w-40 md:w-48 lg:w-56 h-60 md:h-72 lg:h-80 object-cover transition-opacity duration-500"
                      />
                    </div>
                  </div>

                  {/* Movie Info */}
                  <div className="md:col-span-2 lg:col-span-3 text-slate-900 flex flex-col justify-end lg:justify-center pb-4 md:pb-0">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 drop-shadow-lg text-slate-900">
                      {movie.title}
                    </h1>

                    {/* Mobile Poster */}
                    {posterUrl && (
                      <div className="md:hidden mb-4 rounded-lg overflow-hidden shadow-xl max-w-xs">
                        <img
                          src={posterUrl}
                          alt={movie.title}
                          onError={onPosterError}
                          className="w-full h-auto object-cover max-h-64"
                        />
                      </div>
                    )}

                    {/* Quick Info */}
                    <div className="space-y-3 mb-6 text-sm md:text-base">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar size={18} />
                        <span>{movie.release_date ? new Date(movie.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                      </div>

                      {movie.rating && (
                        <div className="flex items-center gap-2 text-amber-600">
                          <Star size={18} fill="currentColor" />
                          <span className="font-bold">{movie.rating.toFixed(1)}/10</span>
                        </div>
                      )}

                      {movie.vote_average && (
                        <div className="flex items-center gap-2 text-amber-600">
                          <Star size={18} fill="currentColor" />
                          <span className="font-bold">{movie.vote_average.toFixed(1)}/10</span>
                        </div>
                      )}

                      {movie.language && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Globe size={18} />
                          <span>{movie.language.toUpperCase()}</span>
                        </div>
                      )}

                      {movie.genres && movie.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {movie.genres.map((genre) => (
                            <span
                              key={genre}
                              className="px-3 py-1 bg-indigo-100 border border-indigo-300 text-indigo-600 rounded-full text-xs md:text-sm font-semibold"
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
                          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 w-full md:w-auto justify-center md:justify-start text-sm md:text-base shadow-lg hover:shadow-xl"
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
      </div>

      {/* Overview Section */}
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h2 className="section-title">Story</h2>
          <p className="text-slate-700 text-base md:text-lg leading-relaxed max-w-4xl">
            {movie.overview}
          </p>

          {/* Cast Section */}
          {movie.cast && movie.cast.length > 0 && (
            <div className="mt-10 md:mt-14">
              <div className="flex items-center gap-3 mb-6">
                <Users size={28} className="text-indigo-600" />
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900">Cast</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {movie.cast.map((actor, index) => (
                  <span
                    key={index}
                    className="bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full text-sm md:text-base font-semibold border border-indigo-300 hover:bg-indigo-200 transition-colors"
                  >
                    {actor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Shows Section */}
        <div>
          <h2 className="section-title">Book Tickets</h2>

          {/* No Shows Message */}
          {!selectedDate && showsForDate.length === 0 && (
            <div className="card card-hover p-8 md:p-12 text-center">
              <Ticket size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-700 text-lg md:text-xl">No shows available for this movie at the moment.</p>
              <p className="text-slate-600 text-sm md:text-base mt-2">Check back soon for showtime updates!</p>
            </div>
          )}

          {/* Date Selection and Shows Grid */}
          {selectedDate && (
            <>
              <div className="mb-8">
                <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-4">Showing on {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>

                {showsForDate.length === 0 ? (
                  <div className="card card-hover p-8 text-center">
                    <p className="text-slate-600 text-base md:text-lg">No shows available for this date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {showsForDate.map((show) => (
                      <div
                        key={show._id}
                        className="card card-hover p-5 md:p-6 transform transition-all hover:-translate-y-1"
                      >
                        <div className="mb-4">
                          <p className="text-slate-600 text-xs uppercase tracking-wider font-semibold">Show Time</p>
                          <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">{show.time}</p>
                        </div>

                        <div className="mb-4 pb-4 border-b border-slate-200">
                          <p className="text-slate-600 text-xs uppercase tracking-wider font-semibold">Price per Seat</p>
                          <p className="text-2xl md:text-3xl font-bold text-indigo-600 mt-2">₹{show.price.toFixed(2)}</p>
                        </div>

                        <div className="mb-6">
                          <p className="text-slate-600 text-xs uppercase tracking-wider font-semibold">Available Seats</p>
                          <p className="text-xl md:text-2xl font-bold text-green-600 mt-2">
                            {show.totalSeats - (show.occupiedSeats?.length || 0)} / {show.totalSeats}
                          </p>
                        </div>

                        <button
                          onClick={() => handleSelectShow(show)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm md:text-base shadow-md hover:shadow-lg"
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

