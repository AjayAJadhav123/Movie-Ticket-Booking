import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function AddShow() {
  const { apiClient } = useApp();
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [searchMovieName, setSearchMovieName] = useState('');
  const [tmdbSearchResults, setTmdbSearchResults] = useState([]);
  const [searchingTMDB, setSearchingTMDB] = useState(false);
  const [formData, setFormData] = useState({
    movieId: '',
    tmdbId: '',
    date: '',
    time: '',
    theatre: '',
    screen: '',
    price: '',
    totalSeats: '100',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const response = await apiClient.get('/api/movie/list?page=1');
      if (response.data.success) {
        setMovies(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Error loading movies');
    }
  };

  const searchTMDBMovies = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setTmdbSearchResults([]);
      return;
    }

    try {
      setSearchingTMDB(true);
      const response = await apiClient.get('/api/movie/search-tmdb', {
        params: { query: searchTerm },
      });
      if (response.data.success) {
        setTmdbSearchResults(response.data.data || []);
      }
    } catch (error) {
      console.error('Error searching TMDB:', error);
      setTmdbSearchResults([]);
    } finally {
      setSearchingTMDB(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMovieSelect = (movieId, isTMDB = false) => {
    if (isTMDB) {
      setFormData((prev) => ({
        ...prev,
        tmdbId: movieId,
        movieId: '', // Clear DB movie ID
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        movieId,
        tmdbId: '', // Clear TMDB ID
      }));
    }
    setSearchMovieName('');
    setTmdbSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const movieId = formData.movieId || formData.tmdbId;
    
    if (!movieId || !formData.date || !formData.time || !formData.price || !formData.theatre || !formData.screen) {
      toast.error('All fields are required');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        movieId: formData.movieId || undefined,
        tmdbId: formData.tmdbId || undefined,
        date: new Date(formData.date).toISOString(),
        time: formData.time,
        theatre: formData.theatre,
        screen: formData.screen,
        price: parseFloat(formData.price),
        totalSeats: parseInt(formData.totalSeats),
      };

      // Remove undefined fields
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      const response = await apiClient.post('/api/show/add', payload);

      if (response.data.success) {
        toast.success('Show added successfully');
        setFormData({
          movieId: '',
          tmdbId: '',
          date: '',
          time: '',
          theatre: '',
          screen: '',
          price: '',
          totalSeats: '100',
        });
        navigate('/admin/list-shows');
      } else {
        toast.error(response.data.message || 'Error adding show');
      }
    } catch (error) {
      console.error('Error adding show:', error);
      toast.error(error.response?.data?.message || 'Error adding show');
    } finally {
      setLoading(false);
    }
  };

  const selectedMovie = movies.find((m) => m._id === formData.movieId);
  const filteredMovies = searchMovieName
    ? movies.filter((m) =>
        m.title.toLowerCase().includes(searchMovieName.toLowerCase())
      )
    : [];

  // Handle search input with debounce for TMDB
  const handleSearchInput = (value) => {
    setSearchMovieName(value);
    if (value.trim().length > 2) {
      searchTMDBMovies(value);
    } else {
      setTmdbSearchResults([]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 lg:py-12 max-w-2xl pt-24">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8 text-slate-900">Add New Show</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-4 md:p-8 border border-slate-200">
        {/* Movie Selection */}
        <div className="mb-4 md:mb-6">
          <label className="block text-slate-700 font-semibold mb-2 text-sm md:text-base">Movie</label>
          
          {formData.movieId && selectedMovie ? (
            <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-300 rounded-lg mb-4">
              <div>
                <p className="font-semibold text-slate-900">{selectedMovie.title}</p>
                <p className="text-xs text-slate-600">Database ID: {selectedMovie._id}</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, movieId: '', tmdbId: '' }))}
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Change
              </button>
            </div>
          ) : formData.tmdbId ? (
            <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-300 rounded-lg mb-4">
              <div>
                <p className="font-semibold text-slate-900">{tmdbSearchResults.find(m => m.id === parseInt(formData.tmdbId))?.title || 'Selected Movie'}</p>
                <p className="text-xs text-slate-600">TMDB ID: {formData.tmdbId}</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, movieId: '', tmdbId: '' }))}
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Search movie by title..."
                value={searchMovieName}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 text-sm md:text-base mb-2"
              />
              
              {/* TMDB Search Results */}
              {searchingTMDB && (
                <div className="text-center py-3 text-slate-600 text-sm">Searching TMDB...</div>
              )}
              
              {!searchingTMDB && searchMovieName.trim().length > 2 && tmdbSearchResults.length > 0 && (
                <div className="border border-slate-300 rounded-lg mb-4 overflow-hidden">
                  <div className="bg-purple-100 px-4 py-2 font-semibold text-sm text-purple-900 border-b">
                    TMDB Results
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {tmdbSearchResults.map((movie) => (
                      <button
                        key={movie.id}
                        type="button"
                        onClick={() => handleMovieSelect(movie.id, true)}
                        className="w-full text-left px-4 py-2 hover:bg-purple-50 border-b border-slate-200 last:border-b-0"
                      >
                        <p className="font-medium text-slate-900">{movie.title}</p>
                        <p className="text-xs text-slate-600">
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'} • {movie.vote_average?.toFixed(1)}/10
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Database Movies */}
              {searchMovieName && filteredMovies.length > 0 && (
                <div className="border border-slate-300 rounded-lg mb-4 overflow-hidden">
                  <div className="bg-indigo-100 px-4 py-2 font-semibold text-sm text-indigo-900 border-b">
                    Database Movies
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredMovies.map((movie) => (
                      <button
                        key={movie._id}
                        type="button"
                        onClick={() => handleMovieSelect(movie._id, false)}
                        className="w-full text-left px-4 py-2 hover:bg-indigo-50 border-b border-slate-200 last:border-b-0"
                      >
                        <p className="font-medium text-slate-900">{movie.title}</p>
                        <p className="text-xs text-slate-600">{movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchMovieName && filteredMovies.length === 0 && tmdbSearchResults.length === 0 && !searchingTMDB && (
                <p className="text-slate-600 text-sm py-2">No movies found</p>
              )}

              {!searchMovieName && (
                <select
                  value={formData.movieId}
                  onChange={(e) => handleMovieSelect(e.target.value, false)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 text-sm md:text-base"
                >
                  <option value="">Select a movie from database</option>
                  {movies.map((movie) => (
                    <option key={movie._id} value={movie._id}>
                      {movie.title}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Date */}
          <div>
            <label className="block text-slate-700 font-semibold mb-2 text-sm md:text-base">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 text-sm md:text-base"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-slate-700 font-semibold mb-2 text-sm md:text-base">Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 text-sm md:text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Theatre */}
          <div>
            <label className="block text-slate-700 font-semibold mb-2 text-sm md:text-base">Theatre</label>
            <input
              type="text"
              name="theatre"
              value={formData.theatre}
              onChange={handleInputChange}
              placeholder="e.g., PVR Cinemas"
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 text-sm md:text-base"
            />
          </div>

          {/* Screen */}
          <div>
            <label className="block text-slate-700 font-semibold mb-2 text-sm md:text-base">Screen</label>
            <input
              type="text"
              name="screen"
              value={formData.screen}
              onChange={handleInputChange}
              placeholder="e.g., Screen 1"
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 text-sm md:text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Price */}
          <div>
            <label className="block text-slate-700 font-semibold mb-2 text-sm md:text-base">Price per Seat (₹)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              step="10"
              min="0"
              placeholder="200"
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 text-sm md:text-base"
            />
          </div>

          {/* Total Seats */}
          <div>
            <label className="block text-slate-700 font-semibold mb-2 text-sm md:text-base">Total Seats</label>
            <input
              type="number"
              name="totalSeats"
              value={formData.totalSeats}
              onChange={handleInputChange}
              min="1"
              placeholder="100"
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 text-sm md:text-base"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || (!formData.movieId && !formData.tmdbId)}
          className="w-full btn-primary disabled:opacity-50 py-3 md:py-4 text-sm md:text-base font-semibold"
        >
          {loading ? 'Adding Show...' : 'Add Show'}
        </button>
      </form>
    </div>
  );
}

