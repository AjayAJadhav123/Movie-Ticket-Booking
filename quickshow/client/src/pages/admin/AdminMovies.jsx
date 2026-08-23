import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Loading from '../../components/Loading';
import { Search, Trash2, Plus, AlertCircle, Loader, X, Film } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
      const response = await apiClient.get('/api/movie/search-tmdb', {
        params: { query: tmdbSearchTerm }
      });
      if (!response.data.success) {
        setTmdbApiKeyMissing(true);
        toast.error(response.data.message || 'Error searching TMDB');
        return;
      }
      setTmdbResults(response.data.data);
      if (response.data.data.length === 0) toast.error('No movies found matching your search');
    } catch (error) {
      console.error('Error searching TMDB:', error);
      if (error.response?.data?.message?.includes('TMDB API key')) setTmdbApiKeyMissing(true);
      toast.error(error.response?.data?.message || 'Error searching TMDB');
    } finally {
      setTmdbLoading(false);
    }
  };

  const importMovie = async (tmdbMovie) => {
    try {
      const response = await apiClient.post('/api/movie/add', {
        tmdbId: tmdbMovie.id || tmdbMovie.tmdbId,
        title: tmdbMovie.title,
        overview: tmdbMovie.overview,
        poster_path: tmdbMovie.poster_path,
        backdrop_path: tmdbMovie.backdrop_path,
        release_date: tmdbMovie.release_date,
        rating: tmdbMovie.vote_average || tmdbMovie.rating,
        genres: tmdbMovie.genres || [],
        language: tmdbMovie.original_language || tmdbMovie.language,
        duration: tmdbMovie.runtime || tmdbMovie.duration || 120,
      });

      if (response.data.success) {
        toast.success(`"${tmdbMovie.title}" imported successfully!`);
        fetchMovies();
      }
    } catch (error) {
      console.error('Error importing movie:', error);
      toast.error(error.response?.data?.message || 'Error importing movie');
    }
  };

  const deleteMovie = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      try {
        setDeleting(id);
        const response = await apiClient.delete(`/api/movie/${id}`);
        if (response.data.success) {
          toast.success(`"${title}" deleted successfully`);
          fetchMovies();
        }
      } catch (error) {
        console.error('Error deleting movie:', error);
        toast.error(error.response?.data?.message || 'Error deleting movie');
      } finally {
        setDeleting(null);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Film className="text-indigo-600" /> Manage Movies
          </h1>
          <p className="text-slate-500 text-sm mt-1">Import and manage movies synced from TMDB</p>
        </div>
        <button
          onClick={() => setShowTMDBModal(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <Plus size={18} /> Import from TMDB
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search synced movies by title..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
            />
          </div>
          <select
            value={selectedGenre}
            onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white min-w-[200px]"
          >
            <option value="">All Genres</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          {(searchTerm || selectedGenre) && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedGenre(''); setPage(1); }}
              className="px-4 py-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Movie List */}
      {loading ? (
        <Loading />
      ) : movies.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No Movies Found</h3>
          <p className="text-slate-500 text-sm">
            {searchTerm || selectedGenre ? 'Try different search or filter criteria.' : 'Click "Import from TMDB" to add movies to your database.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">Poster</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Release Date</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4 hidden md:table-cell">Genres</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movies.map((movie) => (
                  <tr key={movie._id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3">
                      {movie.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt={movie.title} className="h-16 w-12 object-cover rounded-md shadow-sm" />
                      ) : (
                        <div className="h-16 w-12 bg-slate-200 rounded-md flex items-center justify-center text-[10px] text-slate-500 text-center">No Image</div>
                      )}
                    </td>
                    <td className="px-6 py-3 font-semibold text-slate-800">{movie.title}</td>
                    <td className="px-6 py-3 text-slate-600">{movie.release_date ? new Date(movie.release_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-3 text-slate-600 font-medium">★ {movie.rating?.toFixed(1) || '0.0'}</td>
                    <td className="px-6 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {movie.genres?.slice(0, 2).map((genre) => (
                          <span key={genre} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md text-xs">{genre}</span>
                        ))}
                        {movie.genres?.length > 2 && <span className="text-xs text-slate-400 pt-1">+{movie.genres.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => deleteMovie(movie._id, movie.title)}
                        disabled={deleting === movie._id}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        title="Delete Movie"
                      >
                        {deleting === movie._id ? <Loader size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
              <span className="text-sm text-slate-600 font-medium">
                Page {pagination.page} of {pagination.pages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-slate-100 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-slate-100 transition"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Import from TMDB</h2>
              <button onClick={() => setShowTMDBModal(false)} className="text-slate-500 hover:bg-slate-200 p-2 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {tmdbApiKeyMissing ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex gap-3">
                  <AlertCircle size={20} />
                  <div>
                    <p className="font-bold">TMDB API Key Missing</p>
                    <p className="text-sm">Please set TMDB_API_KEY in server/.env to use this feature.</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Search TMDB for movies..."
                    value={tmdbSearchTerm}
                    onChange={(e) => setTmdbSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchTMDB()}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                  <button
                    onClick={searchTMDB}
                    disabled={tmdbLoading}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
                  >
                    {tmdbLoading ? <Loader size={18} className="animate-spin" /> : <Search size={18} />}
                    Search
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-0 bg-slate-50">
              {tmdbResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {tmdbResults.map((movie) => (
                    <div key={movie.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition group">
                      {movie.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} className="w-full h-48 object-cover" />
                      ) : (
                        <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-slate-400">No Image</div>
                      )}
                      <div className="p-4">
                        <h4 className="font-bold text-slate-900 truncate" title={movie.title}>{movie.title}</h4>
                        <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                          <span>{movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                          <span className="font-semibold text-amber-500">★ {movie.vote_average?.toFixed(1) || movie.rating?.toFixed(1)}</span>
                        </div>
                        <button
                          onClick={() => importMovie(movie)}
                          className="w-full mt-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition"
                        >
                          Import
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : tmdbLoading ? (
                <div className="flex justify-center items-center py-12 text-indigo-600">
                  <Loader size={32} className="animate-spin" />
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  Search for a movie title to import from TMDB.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
