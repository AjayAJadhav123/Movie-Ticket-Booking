import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Loading from '../../components/Loading';
import { Search, Trash2, Plus, AlertCircle, Loader } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminMovies() {
  const { apiClient } = useApp();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showTMDBModal, setShowTMDBModal] = useState(false);
  const [tmdbSearchTerm, setTmdbSearchTerm] = useState('');
  const [tmdbResults, setTmdbResults] = useState([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbApiKeyMissing, setTmdbApiKeyMissing] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    fetchMovies();
  }, [searchTerm, selectedGenre, page]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const params = { page };
      if (searchTerm) params.search = searchTerm;
      if (selectedGenre) params.genre = selectedGenre;

      const response = await apiClient.get('/api/movie/list', { params });
      if (response.data.success) {
        setMovies(response.data.data);
        setPagination(response.data.pagination);

        // Extract unique genres
        const allGenres = new Set();
        response.data.data.forEach((movie) => {
          if (movie.genres) {
            movie.genres.forEach((genre) => allGenres.add(genre));
          }
        });
        setGenres(Array.from(allGenres).sort());
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Error fetching movies');
    } finally {
      setLoading(false);
    }
  };

  const searchTMDB = async () => {
    if (!tmdbSearchTerm.trim()) {
      toast.error('Please enter a movie title');
      return;
    }

    try {
      setTmdbLoading(true);
      const response = await apiClient.get('/api/movie/now-playing');

      if (!response.data.success) {
        setTmdbApiKeyMissing(true);
        toast.error('TMDB API key is not configured. Contact admin.');
        return;
      }

      // Filter results based on search term
      const filtered = response.data.data.filter(
        (movie) =>
          movie.title.toLowerCase().includes(tmdbSearchTerm.toLowerCase()) ||
          (movie.original_title &&
            movie.original_title
              .toLowerCase()
              .includes(tmdbSearchTerm.toLowerCase()))
      );

      setTmdbResults(filtered);

      if (filtered.length === 0) {
        toast.info('No movies found matching your search');
      }
    } catch (error) {
      console.error('Error searching TMDB:', error);
      if (error.response?.data?.message?.includes('TMDB API key')) {
        setTmdbApiKeyMissing(true);
      }
      toast.error(error.response?.data?.message || 'Error searching TMDB');
    } finally {
      setTmdbLoading(false);
    }
  };

  const importMovie = async (tmdbMovie) => {
    try {
      const response = await apiClient.post('/api/movie/add', {
        tmdbId: tmdbMovie.id,
      });

      if (response.data.success) {
        toast.success(`Movie "${tmdbMovie.title}" imported successfully`);
        setShowTMDBModal(false);
        setTmdbSearchTerm('');
        setTmdbResults([]);
        setPage(1);
        fetchMovies();
      }
    } catch (error) {
      console.error('Error importing movie:', error);
      toast.error(
        error.response?.data?.message ||
          'Error importing movie (may already exist)'
      );
    }
  };

  const deleteMovie = async (movieId, movieTitle) => {
    if (window.confirm(`Delete "${movieTitle}"?`)) {
      try {
        setDeleting(movieId);
        const response = await apiClient.delete(`/api/movie/${movieId}`);

        if (response.data.success) {
          toast.success('Movie deleted successfully');
          fetchMovies();
        }
      } catch (error) {
        console.error('Error deleting movie:', error);
        toast.error('Error deleting movie');
      } finally {
        setDeleting(null);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 lg:py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Manage Movies</h1>
        <button
          onClick={() => setShowTMDBModal(true)}
          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-indigo-600 text-slate-900 rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-sm md:text-base w-full sm:w-auto justify-center sm:justify-start"
        >
          <Plus size={18} />
          Import from TMDB
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-slate-50 rounded-lg shadow-lg p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
            />
          </div>

          {/* Genre Filter */}
          <select
            value={selectedGenre}
            onChange={(e) => {
              setSelectedGenre(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
          >
            <option value="">All Genres</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {(searchTerm || selectedGenre) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGenre('');
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-200 text-slate-800 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Movies Table/Grid */}
      {loading ? (
        <Loading />
      ) : movies.length === 0 ? (
        <div className="text-center py-8 md:py-12 bg-slate-50 rounded-lg">
          <AlertCircle size={40} className="mx-auto text-slate-400 mb-3 md:mb-4" />
          <p className="text-slate-500 text-base md:text-lg">No movies found.</p>
          <p className="text-slate-400 text-sm md:text-base">
            {searchTerm || selectedGenre
              ? 'Try different search or filter criteria.'
              : 'Import movies from TMDB to get started.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max md:min-w-0">
              <thead className="bg-slate-100 border-b border-gray-200">
                <tr>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-slate-700">
                    Poster
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-slate-700">
                    Title
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-slate-700 hidden sm:table-cell">
                    Release
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-slate-700 hidden lg:table-cell">
                    Rating
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-slate-700 hidden md:table-cell">
                    Genres
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-semibold text-slate-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {movies.map((movie) => (
                  <tr key={movie._id} className="border-b border-gray-200 hover:bg-gray-50 text-xs md:text-sm">
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                          alt={movie.title}
                          className="h-12 md:h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="h-12 md:h-16 w-8 md:w-12 bg-gray-200 rounded flex items-center justify-center text-xs text-slate-500">
                          No Image
                        </div>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div>
                        <p className="font-semibold text-slate-800 truncate">{movie.title}</p>
                        <p className="text-xs text-slate-500">ID: {movie.tmdbId}</p>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-slate-600 hidden sm:table-cell whitespace-nowrap">
                      {movie.release_date
                        ? new Date(movie.release_date).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 hidden lg:table-cell whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-800">
                        ★ {movie.rating?.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {movie.genres && movie.genres.length > 0 ? (
                          movie.genres.slice(0, 2).map((genre) => (
                            <span
                              key={genre}
                              className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded whitespace-nowrap"
                            >
                              {genre}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">No genres</span>
                        )}
                        {movie.genres && movie.genres.length > 2 && (
                          <span className="text-xs text-slate-500">
                            +{movie.genres.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-center">
                      <button
                        onClick={() => deleteMovie(movie._id, movie.title)}
                        disabled={deleting === movie._id}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors inline-flex"
                      >
                        {deleting === movie._id ? (
                          <Loader size={16} className="animate-spin md:w-5 md:h-5" />
                        ) : (
                          <Trash2 size={16} className="md:w-5 md:h-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 bg-gray-50 border-t border-gray-200">
              <div className="text-xs md:text-sm text-slate-600">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 md:px-4 py-2 bg-gray-200 text-slate-800 rounded text-xs md:text-sm disabled:opacity-50 font-semibold"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                  className="px-3 md:px-4 py-2 bg-gray-200 text-slate-800 rounded text-xs md:text-sm disabled:opacity-50 font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TMDB Import Modal */}
      {showTMDBModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-slate-50 rounded-lg shadow-xl w-full max-w-md md:max-w-2xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-slate-50 border-b border-gray-200 p-3 md:p-6 flex justify-between items-center">
              <h2 className="text-lg md:text-2xl font-bold">Import from TMDB</h2>
              <button
                onClick={() => {
                  setShowTMDBModal(false);
                  setTmdbSearchTerm('');
                  setTmdbResults([]);
                  setTmdbApiKeyMissing(false);
                }}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-3 md:p-6">
              {tmdbApiKeyMissing && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4 flex gap-3">
                  <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-yellow-800 text-sm md:text-base">TMDB API Key Missing</p>
                    <p className="text-xs md:text-sm text-yellow-700 mt-1">
                      Add TMDB_API_KEY to your server .env file to enable movie imports.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Search movie title..."
                  value={tmdbSearchTerm}
                  onChange={(e) => setTmdbSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchTMDB()}
                  className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
                  disabled={tmdbApiKeyMissing}
                />
                <button
                  onClick={searchTMDB}
                  disabled={tmdbLoading || tmdbApiKeyMissing}
                  className="px-3 md:px-6 py-2 bg-indigo-600 text-slate-900 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm md:text-base font-semibold"
                >
                  {tmdbLoading ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
                  Search
                </button>
              </div>

              {tmdbResults.length === 0 && tmdbSearchTerm && !tmdbLoading && (
                <p className="text-slate-500 text-center py-8 text-sm md:text-base">No results found</p>
              )}

              <div className="space-y-2 md:space-y-3">
                {tmdbResults.map((movie) => (
                  <div key={movie.id} className="border border-gray-200 rounded-lg p-3 md:p-4 flex gap-3 md:gap-4 hover:bg-gray-50">
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                        alt={movie.title}
                        className="h-16 md:h-20 w-12 md:w-14 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="h-16 md:h-20 w-12 md:w-14 bg-gray-200 rounded flex items-center justify-center text-xs flex-shrink-0">
                        No Image
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm md:text-base truncate">{movie.title}</p>
                      <p className="text-xs md:text-sm text-slate-600">{movie.release_date}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {movie.overview}
                      </p>
                    </div>
                    <button
                      onClick={() => importMovie(movie)}
                      className="px-3 md:px-4 py-2 bg-green-600 text-slate-900 rounded hover:bg-green-700 whitespace-nowrap h-fit text-xs md:text-sm font-semibold flex-shrink-0"
                    >
                      Import
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

