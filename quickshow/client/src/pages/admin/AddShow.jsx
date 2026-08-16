import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function AddShow() {
  const { apiClient } = useApp();
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [formData, setFormData] = useState({
    movieId: '',
    date: '',
    time: '',
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.movieId || !formData.date || !formData.time || !formData.price) {
      toast.error('All fields are required');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/api/show/add', {
        movieId: formData.movieId,
        date: new Date(formData.date).toISOString(),
        time: formData.time,
        price: parseFloat(formData.price),
        totalSeats: parseInt(formData.totalSeats),
      });

      if (response.data.success) {
        toast.success('Show added successfully');
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

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 lg:py-12 max-w-2xl">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8">Add New Show</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-4 md:p-8">
        <div className="mb-4 md:mb-6">
          <label className="block text-gray-700 font-semibold mb-2 text-sm md:text-base">Movie</label>
          <select
            name="movieId"
            value={formData.movieId}
            onChange={handleInputChange}
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 text-sm md:text-base"
          >
            <option value="">Select a movie</option>
            {movies.map((movie) => (
              <option key={movie._id} value={movie._id}>
                {movie.title}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 md:mb-6">
          <label className="block text-gray-700 font-semibold mb-2 text-sm md:text-base">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 text-sm md:text-base"
          />
        </div>

        <div className="mb-4 md:mb-6">
          <label className="block text-gray-700 font-semibold mb-2 text-sm md:text-base">Time</label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleInputChange}
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 text-sm md:text-base"
          />
        </div>

        <div className="mb-4 md:mb-6">
          <label className="block text-gray-700 font-semibold mb-2 text-sm md:text-base">Price per Seat ($)</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 text-sm md:text-base"
          />
        </div>

        <div className="mb-4 md:mb-6">
          <label className="block text-gray-700 font-semibold mb-2 text-sm md:text-base">Total Seats</label>
          <input
            type="number"
            name="totalSeats"
            value={formData.totalSeats}
            onChange={handleInputChange}
            min="1"
            className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 text-sm md:text-base"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 py-3 md:py-4 text-sm md:text-base font-semibold"
        >
          {loading ? 'Adding Show...' : 'Add Show'}
        </button>
      </form>
    </div>
  );
}
