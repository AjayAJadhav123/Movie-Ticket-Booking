import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart3, TrendingUp, Users, DollarSign, Ticket, Zap, AlertCircle } from 'lucide-react';
import Loading from '../../components/Loading';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AdminAnalytics() {
  const { apiClient, loading } = useApp();
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [movies, setMovies] = useState(null);
  const [genres, setGenres] = useState(null);
  const [demand, setDemand] = useState(null);
  const [insights, setInsights] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setDataLoading(true);
      setError(null);

      const [overviewRes, revenueRes, moviesRes, genresRes, demandRes, insightsRes, forecastRes] =
        await Promise.all([
          apiClient.get('/api/admin/analytics/overview'),
          apiClient.get('/api/admin/analytics/revenue'),
          apiClient.get('/api/admin/analytics/movies'),
          apiClient.get('/api/admin/analytics/genres'),
          apiClient.get('/api/admin/analytics/demand'),
          apiClient.get('/api/admin/analytics/insights'),
          apiClient.get('/api/admin/analytics/forecast'),
        ]);

      setOverview(overviewRes.data.data);
      setRevenue(revenueRes.data.data);
      setMovies(moviesRes.data.data);
      setGenres(genresRes.data.data);
      setDemand(demandRes.data.data);
      setInsights(insightsRes.data.data);
      setForecast(forecastRes.data.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setDataLoading(false);
    }
  };

  if (dataLoading && !overview) {
    return <Loading />;
  }

  const COLORS = ['#6366F1', '#7C3AED', '#E11D48', '#F59E0B', '#10B981', '#0EA5E9'];

  return (
    <div className="min-h-screen pt-20 pb-16 bg-slate-50">
      <div className="container mx-auto px-4 py-6 md:py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Analytics Dashboard</h1>
          <p className="text-slate-600">Real-time business intelligence and movie demand insights</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900 font-medium">Error Loading Analytics</p>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={fetchAnalyticsData}
                className="mt-2 text-red-600 hover:text-red-700 font-medium text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-600 font-medium">Total Revenue</h3>
                <DollarSign size={24} className="text-indigo-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">₹{overview.totalRevenue?.toFixed(0)}</p>
              <p className="text-sm text-slate-500 mt-2">From {overview.totalBookings} bookings</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-600 font-medium">Total Bookings</h3>
                <Ticket size={24} className="text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{overview.totalBookings}</p>
              <p className="text-sm text-slate-500 mt-2">{overview.totalTickets} tickets sold</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-600 font-medium">Avg Occupancy</h3>
                <BarChart3 size={24} className="text-rose-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{overview.occupancyPercentage}%</p>
              <p className="text-sm text-slate-500 mt-2">Average across all shows</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-600 font-medium">Active Users</h3>
                <Users size={24} className="text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{overview.totalUsers}</p>
              <p className="text-sm text-slate-500 mt-2">Registered members</p>
            </div>
          </div>
        )}

        {/* Revenue Analytics Chart */}
        {revenue && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Revenue Trend (Last 30 Days)</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenue.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="_id" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366F1"
                    strokeWidth={2}
                    dot={{ fill: '#6366F1', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Revenue (₹)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
              <div>
                <p className="text-slate-600 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">₹{revenue.totalRevenue?.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-slate-600 text-sm">Total Bookings</p>
                <p className="text-2xl font-bold text-slate-900">{revenue.totalBookings}</p>
              </div>
              <div>
                <p className="text-slate-600 text-sm">Daily Average</p>
                <p className="text-2xl font-bold text-slate-900">₹{revenue.avgDaily?.toFixed(0)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Genre Performance */}
          {genres && genres.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Revenue by Genre</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genres}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ _id, revenue }) => `${_id}: ₹${(revenue / 1000).toFixed(0)}k`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {genres.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `₹${value?.toFixed(0)}`}
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#F1F5F9',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Demand by Hour */}
          {demand && demand.byHour && demand.byHour.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Demand by Hour</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demand.byHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="_id" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#F1F5F9',
                      }}
                    />
                    <Bar dataKey="bookings" fill="#7C3AED" name="Bookings" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Movie Performance Table */}
        {movies && movies.length > 0 && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Top Performing Movies</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-slate-900 font-semibold">Movie</th>
                    <th className="text-right py-3 px-4 text-slate-900 font-semibold">Revenue</th>
                    <th className="text-right py-3 px-4 text-slate-900 font-semibold">Bookings</th>
                    <th className="text-right py-3 px-4 text-slate-900 font-semibold">Tickets</th>
                    <th className="text-right py-3 px-4 text-slate-900 font-semibold">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {movies.slice(0, 10).map((movie, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-slate-700">{movie.movieTitle}</td>
                      <td className="text-right py-3 px-4 text-slate-900 font-semibold">
                        ₹{movie.totalRevenue?.toFixed(0)}
                      </td>
                      <td className="text-right py-3 px-4 text-slate-700">{movie.totalBookings}</td>
                      <td className="text-right py-3 px-4 text-slate-700">{movie.totalTickets}</td>
                      <td className="text-right py-3 px-4">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                          ⭐ {movie.avgRating?.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Insights */}
        {insights && insights.length > 0 && (
          <div className="card p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Zap size={24} className="text-yellow-600" />
              <h2 className="text-xl font-bold text-slate-900">AI Business Insights</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.priority === 'high'
                      ? 'bg-red-50 border-red-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <h3 className={`font-semibold mb-1 ${
                    insight.priority === 'high' ? 'text-red-900' : 'text-blue-900'
                  }`}>
                    {insight.title}
                  </h3>
                  <p className={`text-sm ${
                    insight.priority === 'high' ? 'text-red-700' : 'text-blue-700'
                  }`}>
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demand Forecast */}
        {forecast && forecast.length > 0 && (
          <div className="card p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Upcoming Show Demand Forecast</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-slate-900 font-semibold">Movie</th>
                    <th className="text-left py-3 px-4 text-slate-900 font-semibold">Date & Time</th>
                    <th className="text-center py-3 px-4 text-slate-900 font-semibold">Occupancy</th>
                    <th className="text-center py-3 px-4 text-slate-900 font-semibold">Predicted</th>
                    <th className="text-center py-3 px-4 text-slate-900 font-semibold">Demand</th>
                    <th className="text-center py-3 px-4 text-slate-900 font-semibold">Rating</th>
                    <th className="text-right py-3 px-4 text-slate-900 font-semibold">Available</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((show, idx) => {
                    const demandColor =
                      show.demandLevel === 'VERY_HIGH'
                        ? 'bg-red-100 text-red-800'
                        : show.demandLevel === 'HIGH'
                        ? 'bg-orange-100 text-orange-800'
                        : show.demandLevel === 'NORMAL'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800';

                    return (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-slate-700 font-medium">{show.movieTitle}</td>
                        <td className="py-3 px-4 text-slate-700">
                          {new Date(show.date).toLocaleDateString()} {show.time}
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs font-semibold">
                            {show.currentOccupancy}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs font-semibold">
                            {show.predictedOccupancy}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${demandColor}`}>
                            {show.demandLevel}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                            ⭐ {show.movieRating?.toFixed(1)}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4 text-slate-900 font-semibold">
                          {show.availableSeats}/{show.totalSeats}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!dataLoading && !overview && (
          <div className="card p-12 text-center">
            <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No Analytics Data</h3>
            <p className="text-slate-500">Analytics will appear once you have bookings and shows in the system.</p>
          </div>
        )}
      </div>
    </div>
  );
}
