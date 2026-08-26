import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3, TrendingUp, Users, DollarSign, Ticket, Zap,
  AlertCircle, RefreshCw, Calendar, Building2, Film,
  Clock, Activity, Monitor, ChevronDown,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ─── Palette ──────────────────────────────────────────────────────────────────
const COLORS = ['#6366F1', '#7C3AED', '#E11D48', '#F59E0B', '#10B981', '#0EA5E9', '#F97316', '#84CC16'];
const STATUS_COLORS = { confirmed: '#10B981', pending: '#F59E0B', cancelled: '#EF4444', failed: '#6B7280' };
const DAY_LABELS   = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Date-range options ───────────────────────────────────────────────────────
const RANGES = [
  { value: 'today', label: 'Today' },
  { value: '7d',    label: 'Last 7 Days' },
  { value: '30d',   label: 'Last 30 Days' },
  { value: '90d',   label: 'Last 3 Months' },
  { value: 'custom',label: 'Custom Range' },
];

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const fmt  = (n) => (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtK = (n) => n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n?.toFixed(0) || 0}`;

function KpiCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-white tracking-tight">{value}</p>
      <p className="text-sm font-medium text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeading({ icon: Icon, title, sub }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="p-2 rounded-lg bg-red-500/10">
        <Icon size={16} className="text-red-500" />
      </div>
      <div>
        <h2 className="text-base font-bold text-white leading-tight">{title}</h2>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

function EmptyState({ message = 'No data for this period' }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
      <BarChart3 size={36} className="mb-2 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '10px', color: '#F1F5F9', fontSize: 12 },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminAnalytics() {
  const { apiClient } = useApp();

  // Data state
  const [overview,        setOverview]        = useState(null);
  const [trends,          setTrends]          = useState(null);
  const [movies,          setMovies]          = useState(null);
  const [genres,          setGenres]          = useState(null);
  const [demand,          setDemand]          = useState(null);
  const [insights,        setInsights]        = useState(null);
  const [bookingStatus,   setBookingStatus]   = useState(null);
  const [cinemaAnalytics, setCinemaAnalytics] = useState(null);
  const [popularShows,    setPopularShows]    = useState(null);

  // UI state
  const [loading,      setLoading]    = useState(true);
  const [error,        setError]      = useState(null);
  const [activeTab,    setActiveTab]  = useState('overview');
  const [range,        setRange]      = useState('30d');
  const [groupBy,      setGroupBy]    = useState('day');
  const [customStart,  setCustomStart] = useState('');
  const [customEnd,    setCustomEnd]   = useState('');
  const [lastRefresh,  setLastRefresh] = useState(null);

  // Build query params for date-filtered endpoints
  const buildParams = useCallback((extra = {}) => {
    const params = { range, ...extra };
    if (range === 'custom') { params.startDate = customStart; params.endDate = customEnd; }
    return params;
  }, [range, customStart, customEnd]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = buildParams();
      const trendParams = buildParams({ groupBy });

      const [
        overviewRes, trendsRes, moviesRes, genresRes,
        demandRes, insightsRes, statusRes, cinemaRes, showsRes,
      ] = await Promise.allSettled([
        apiClient.get('/api/admin/analytics/overview'),
        apiClient.get('/api/admin/analytics/trends',          { params: trendParams }),
        apiClient.get('/api/admin/analytics/movies'),
        apiClient.get('/api/admin/analytics/genres'),
        apiClient.get('/api/admin/analytics/demand'),
        apiClient.get('/api/admin/analytics/insights'),
        apiClient.get('/api/admin/analytics/booking-status',  { params }),
        apiClient.get('/api/admin/analytics/cinema-analytics', { params }),
        apiClient.get('/api/admin/analytics/popular-shows',   { params }),
      ]);

      const safe = (res) => res.status === 'fulfilled' && res.value?.data?.success ? res.value.data.data : null;

      setOverview(safe(overviewRes));
      setTrends(safe(trendsRes));
      setMovies(safe(moviesRes));
      setGenres(safe(genresRes));
      setDemand(safe(demandRes));
      setInsights(safe(insightsRes));
      setBookingStatus(safe(statusRes));
      setCinemaAnalytics(safe(cinemaRes));
      setPopularShows(safe(showsRes));
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Analytics fetch error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError('Failed to load analytics. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [apiClient, buildParams, groupBy]);

  useEffect(() => { fetchAll(); }, [range, groupBy]);

  // ─── Tabs ──────────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'overview', label: 'Overview',  icon: BarChart3  },
    { id: 'revenue',  label: 'Revenue',   icon: DollarSign },
    { id: 'bookings', label: 'Bookings',  icon: Ticket     },
    { id: 'movies',   label: 'Movies',    icon: Film       },
    { id: 'cinemas',  label: 'Cinemas',   icon: Building2  },
    { id: 'insights', label: 'Insights',  icon: Zap        },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Activity size={14} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-red-500 uppercase tracking-widest">Real-time Analytics</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics Dashboard</h1>
            {lastRefresh && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Clock size={11} />
                Updated {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date range selector */}
            <div className="relative">
              <select
                value={range}
                onChange={e => setRange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-800/50 bg-[#0f172a] font-medium text-slate-300 shadow-sm focus:ring-2 focus:ring-red-500/20 outline-none cursor-pointer"
              >
                {RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Custom range inputs */}
            {range === 'custom' && (
              <>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="text-sm rounded-xl border border-slate-800/50 bg-[#0f172a] px-3 py-2 shadow-sm focus:ring-2 focus:ring-red-500/20 outline-none" />
                <span className="text-slate-400 text-sm">to</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="text-sm rounded-xl border border-slate-800/50 bg-[#0f172a] px-3 py-2 shadow-sm focus:ring-2 focus:ring-red-500/20 outline-none" />
              </>
            )}

            {/* Group-by (revenue tab) */}
            {activeTab === 'revenue' && (
              <div className="relative">
                <select
                  value={groupBy}
                  onChange={e => setGroupBy(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-800/50 bg-[#0f172a] font-medium text-slate-300 shadow-sm focus:ring-2 focus:ring-red-500/20 outline-none cursor-pointer"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}

            <button
              onClick={fetchAll}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f172a] border border-slate-800/50 text-sm font-semibold text-slate-300 shadow-sm hover:shadow-md hover:border-indigo-300 hover:text-red-500 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button onClick={fetchAll} className="text-red-600 text-sm font-semibold underline">Retry</button>
          </div>
        )}

        {/* ── Tabs nav ───────────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-8 bg-[#0f172a] rounded-xl border border-slate-800/50 p-1.5 overflow-x-auto shadow-sm">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  active
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-[#09090b]'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Loading skeleton ────────────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#0f172a] rounded-xl border border-slate-800/50 p-5 h-32 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-slate-700 mb-3" />
                <div className="h-7 bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════ TAB: OVERVIEW ════════════════════════════ */}
        {!loading && activeTab === 'overview' && (
          <>
            {/* KPI Row */}
            {overview && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <KpiCard label="Total Revenue"    value={`₹${fmt(overview.totalRevenue)}`}      sub={`${overview.totalBookings} confirmed bookings`}    icon={DollarSign} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
                <KpiCard label="Total Bookings"   value={fmt(overview.totalBookings)}           sub={`${overview.totalTickets} tickets sold`}            icon={Ticket}     color="bg-gradient-to-br from-indigo-500 to-violet-600" />
                <KpiCard label="Avg Occupancy"    value={`${overview.occupancyPercentage}%`}    sub="across all shows"                                   icon={Monitor}    color="bg-gradient-to-br from-rose-500 to-pink-600" />
                <KpiCard label="Registered Users" value={fmt(overview.totalUsers)}              sub={`${overview.activeShows} upcoming shows`}           icon={Users}      color="bg-gradient-to-br from-amber-500 to-orange-600" />
              </div>
            )}

            {/* Revenue trend (overview teaser) */}
            {trends?.chartData?.length > 0 && (
              <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-6 mb-8">
                <SectionHeading icon={TrendingUp} title="Revenue Trend" sub={`Total ₹${fmt(trends.totalRevenue)} · ${trends.totalBookings} bookings`} />
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends.chartData}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="_id" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} tickFormatter={fmtK} />
                      <Tooltip {...tooltipStyle} formatter={v => [`₹${fmt(v)}`, 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2.5} fill="url(#revGrad)" name="Revenue" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Demand by day of week */}
            {demand?.byDayOfWeek?.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-6">
                  <SectionHeading icon={Calendar} title="Bookings by Day of Week" />
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={demand.byDayOfWeek.map(d => ({ ...d, day: DAY_LABELS[d._id] || d._id }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="day" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
                        <Tooltip {...tooltipStyle} />
                        <Bar dataKey="bookings" fill="#7C3AED" radius={[6, 6, 0, 0]} name="Bookings" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-6">
                  <SectionHeading icon={Clock} title="Booking Volume by Hour" />
                  {demand?.byHour?.length > 0 ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demand.byHour.map(d => ({ ...d, hour: `${d._id}:00` }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="hour" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
                          <Tooltip {...tooltipStyle} />
                          <Bar dataKey="bookings" fill="#6366F1" radius={[6, 6, 0, 0]} name="Bookings" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyState />}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════ TAB: REVENUE ═════════════════════════════ */}
        {!loading && activeTab === 'revenue' && (
          <>
            {trends && (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                  <KpiCard label="Total Revenue"   value={`₹${fmt(trends.totalRevenue)}`}   icon={DollarSign} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
                  <KpiCard label="Total Bookings"  value={fmt(trends.totalBookings)}         icon={Ticket}     color="bg-gradient-to-br from-indigo-500 to-violet-600" />
                  <KpiCard label="Avg Per Period"  value={`₹${fmt(trends.avgPerPeriod)}`}   icon={TrendingUp} color="bg-gradient-to-br from-amber-500 to-orange-600" />
                </div>

                {/* Revenue time-series */}
                <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-6 mb-8">
                  <SectionHeading icon={TrendingUp} title="Revenue Over Time" sub={`Grouped by ${trends.groupBy} · ${RANGES.find(r=>r.value===range)?.label}`} />
                  {trends.chartData?.length > 0 ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trends.chartData}>
                          <defs>
                            <linearGradient id="areaRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#6366F1" stopOpacity={0}    />
                            </linearGradient>
                            <linearGradient id="areaBook" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#10B981" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}   />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="_id" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                          <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} tickFormatter={fmtK} />
                          <Tooltip {...tooltipStyle} formatter={(v, n) => [n === 'Revenue' ? `₹${fmt(v)}` : v, n]} />
                          <Legend />
                          <Area type="monotone" dataKey="revenue"  stroke="#6366F1" strokeWidth={2.5} fill="url(#areaRev)"  name="Revenue"  dot={false} />
                          <Area type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={2}   fill="url(#areaBook)" name="Bookings" dot={false} yAxisId={0} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyState />}
                </div>

                {/* Booking status breakdown */}
                {trends.statusBreakdown?.length > 0 && (
                  <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-6 mb-8">
                    <SectionHeading icon={Ticket} title="Booking Status Breakdown" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {trends.statusBreakdown.map(s => (
                        <div key={s._id} className="p-4 rounded-xl border border-slate-800/50 bg-[#09090b]">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[s._id] || '#94A3B8' }} />
                            <span className="text-sm font-semibold text-slate-300 capitalize">{s._id}</span>
                          </div>
                          <p className="text-2xl font-extrabold text-white">{fmt(s.count)}</p>
                          {s.amount > 0 && <p className="text-xs text-slate-500 mt-1">₹{fmt(s.amount)}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Genre revenue pie */}
                {genres?.length > 0 && (
                  <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-6">
                    <SectionHeading icon={Film} title="Revenue by Genre" />
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={genres} cx="50%" cy="50%" outerRadius={100} dataKey="revenue" nameKey="_id" label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {genres.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip {...tooltipStyle} formatter={v => [`₹${fmt(v)}`, 'Revenue']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}
            {!trends && !loading && <EmptyState message="No revenue data for the selected period" />}
          </>
        )}

        {/* ══════════════════════ TAB: BOOKINGS ════════════════════════════ */}
        {!loading && activeTab === 'bookings' && (
          <>
            {bookingStatus ? (
              <>
                {/* Status distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Status pie */}
                  <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-6">
                    <SectionHeading icon={Ticket} title="Booking Status Distribution" />
                    {bookingStatus.statusDistribution?.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={bookingStatus.statusDistribution.map(s => ({ name: s._id, value: s.count }))}
                              cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name"
                              label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                              {bookingStatus.statusDistribution.map((s, i) => (
                                <Cell key={i} fill={STATUS_COLORS[s._id] || COLORS[i]} />
                              ))}
                            </Pie>
                            <Tooltip {...tooltipStyle} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <EmptyState />}
                  </div>

                  {/* Payment method */}
                  <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-6">
                    <SectionHeading icon={DollarSign} title="Payment Method Distribution" />
                    {bookingStatus.paymentMethodDistribution?.length > 0 ? (
                      <>
                        <div className="h-52">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bookingStatus.paymentMethodDistribution.map(p => ({ method: p._id || 'unknown', count: p.count, amount: p.totalAmount }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis dataKey="method" stroke="#94A3B8" tick={{ fontSize: 12 }} />
                              <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
                              <Tooltip {...tooltipStyle} formatter={(v, n) => [n === 'amount' ? `₹${fmt(v)}` : v, n === 'amount' ? 'Revenue' : 'Count']} />
                              <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} name="count" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                          {bookingStatus.paymentMethodDistribution.map((p, i) => (
                            <div key={i} className="flex justify-between text-sm border-b border-slate-800/50 pb-1 last:border-0">
                              <span className="font-medium text-slate-300 capitalize">{p._id || 'Unknown'}</span>
                              <span className="text-slate-500">{p.count} bookings · ₹{fmt(p.totalAmount)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : <EmptyState />}
                  </div>
                </div>

                {/* Payment status */}
                {bookingStatus.paymentStatusDistribution?.length > 0 && (
                  <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-6 mb-8">
                    <SectionHeading icon={Activity} title="Payment Status" />
                    <div className="grid grid-cols-3 gap-4">
                      {bookingStatus.paymentStatusDistribution.map((p, i) => (
                        <div key={i} className="text-center p-4 bg-[#09090b] rounded-xl border border-slate-800/50">
                          <p className="text-2xl font-extrabold text-white">{fmt(p.count)}</p>
                          <p className="text-sm font-medium text-slate-500 mt-1 capitalize">{p._id}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent bookings */}
                {bookingStatus.recentBookings?.length > 0 && (
                  <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-6">
                    <SectionHeading icon={Clock} title="Recent Bookings" />
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-800/50">
                            {['Movie', 'Show Date', 'Seats', 'Amount', 'Status', 'Payment', 'Created'].map(h => (
                              <th key={h} className="text-left py-3 px-3 text-slate-500 font-semibold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bookingStatus.recentBookings.map((b, i) => (
                            <tr key={i} className="border-b border-slate-50 hover:bg-[#09090b] transition">
                              <td className="py-2.5 px-3 font-medium text-slate-200 max-w-[160px] truncate">{b.movieTitle || '—'}</td>
                              <td className="py-2.5 px-3 text-slate-400">{b.showDate ? new Date(b.showDate).toLocaleDateString() : '—'}</td>
                              <td className="py-2.5 px-3 text-slate-400">{b.seats?.length || 0}</td>
                              <td className="py-2.5 px-3 font-semibold text-white">₹{fmt(b.amount)}</td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                                  style={{ backgroundColor: `${STATUS_COLORS[b.status]}22`, color: STATUS_COLORS[b.status] }}>
                                  {b.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 capitalize">{b.paymentMethod || '—'}</td>
                              <td className="py-2.5 px-3 text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : <EmptyState message="No booking data for this period" />}
          </>
        )}

        {/* ══════════════════════ TAB: MOVIES ══════════════════════════════ */}
        {!loading && activeTab === 'movies' && (
          <>
            {movies?.length > 0 ? (
              <>
                {/* Top movies bar chart */}
                <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-6 mb-8">
                  <SectionHeading icon={Film} title="Top Movies by Revenue" />
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={movies.slice(0, 10).map(m => ({ title: m.movieTitle?.length > 15 ? m.movieTitle.slice(0, 15) + '…' : m.movieTitle, revenue: m.totalRevenue, bookings: m.totalBookings }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="title" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} tickFormatter={fmtK} />
                        <Tooltip {...tooltipStyle} formatter={(v, n) => [n === 'revenue' ? `₹${fmt(v)}` : v, n === 'revenue' ? 'Revenue' : 'Bookings']} />
                        <Bar dataKey="revenue" fill="#6366F1" radius={[6, 6, 0, 0]} name="revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-6">
                  <SectionHeading icon={Film} title="Movie Performance Table" />
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800/50">
                          {['#', 'Movie', 'Revenue', 'Bookings', 'Tickets', 'Shows', 'Rating'].map(h => (
                            <th key={h} className="text-left py-3 px-3 text-slate-500 font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {movies.map((m, i) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-[#09090b] transition">
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-200">{m.movieTitle}</td>
                            <td className="py-2.5 px-3 font-bold text-emerald-700">₹{fmt(m.totalRevenue)}</td>
                            <td className="py-2.5 px-3 text-slate-300">{fmt(m.totalBookings)}</td>
                            <td className="py-2.5 px-3 text-slate-400">{fmt(m.totalTickets)}</td>
                            <td className="py-2.5 px-3 text-slate-400">{m.showCount}</td>
                            <td className="py-2.5 px-3">
                              {m.avgRating > 0 && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-semibold">
                                  ⭐ {Number(m.avgRating).toFixed(1)}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : <EmptyState message="No movie performance data yet. Revenue tracking begins once bookings are confirmed." />}

            {/* Popular shows */}
            {popularShows?.length > 0 && (
              <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-6 mt-8">
                <SectionHeading icon={Calendar} title="Popular Shows" sub="By revenue for selected period" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800/50">
                        {['Movie', 'Date', 'Time', 'Theatre', 'Screen', 'Occupancy', 'Revenue', 'Bookings'].map(h => (
                          <th key={h} className="text-left py-3 px-3 text-slate-500 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {popularShows.map((s, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-[#09090b] transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-200 max-w-[160px] truncate">{s.movieTitle}</td>
                          <td className="py-2.5 px-3 text-slate-400">{s.date ? new Date(s.date).toLocaleDateString() : '—'}</td>
                          <td className="py-2.5 px-3 text-slate-400">{s.time}</td>
                          <td className="py-2.5 px-3 text-slate-500 max-w-[120px] truncate">{s.theatre}</td>
                          <td className="py-2.5 px-3 text-slate-500">{s.screen}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-700 rounded-full max-w-[60px]">
                                <div className="h-1.5 rounded-full bg-red-500/10" style={{ width: `${Math.min(s.occupancyPct, 100)}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-slate-300">{s.occupancyPct?.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-emerald-700">₹{fmt(s.totalRevenue)}</td>
                          <td className="py-2.5 px-3 text-slate-400">{s.totalBookings}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════ TAB: CINEMAS ═════════════════════════════ */}
        {!loading && activeTab === 'cinemas' && (
          <>
            {cinemaAnalytics ? (
              <>
                {/* Cinema revenue chart */}
                {cinemaAnalytics.cinemaRevenue?.length > 0 ? (
                  <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-6 mb-8">
                    <SectionHeading icon={Building2} title="Revenue by Cinema / Theatre" sub="Derived from booking show.theatre field" />
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cinemaAnalytics.cinemaRevenue.map(c => ({ name: c._id?.length > 18 ? c._id.slice(0, 18) + '…' : c._id, revenue: c.totalRevenue, bookings: c.totalBookings, occupancy: Math.round(c.avgOccupancy) }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                          <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} tickFormatter={fmtK} />
                          <Tooltip {...tooltipStyle} formatter={(v, n) => [n === 'revenue' ? `₹${fmt(v)}` : v, n === 'revenue' ? 'Revenue' : n]} />
                          <Legend />
                          <Bar dataKey="revenue"  fill="#6366F1" radius={[6, 6, 0, 0]} name="revenue" />
                          <Bar dataKey="bookings" fill="#10B981" radius={[6, 6, 0, 0]} name="bookings" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : <EmptyState message="No cinema booking revenue for this period" />}

                {/* Cinema database list */}
                {cinemaAnalytics.cinemaList?.length > 0 && (
                  <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-6 mb-8">
                    <SectionHeading icon={Building2} title="Registered Cinemas" />
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-800/50">
                            {['Name', 'City', 'Status', 'Screens', 'Capacity'].map(h => (
                              <th key={h} className="text-left py-3 px-3 text-slate-500 font-semibold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {cinemaAnalytics.cinemaList.map((c, i) => (
                            <tr key={i} className="border-b border-slate-50 hover:bg-[#09090b] transition">
                              <td className="py-2.5 px-3 font-semibold text-slate-200">{c.name}</td>
                              <td className="py-2.5 px-3 text-slate-400">{c.city}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-800 text-slate-500'}`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-400">{c.totalScreens}</td>
                              <td className="py-2.5 px-3 text-slate-400">{c.totalCapacity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Show occupancy per theatre */}
                {cinemaAnalytics.showOccupancy?.length > 0 && (
                  <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-6">
                    <SectionHeading icon={Monitor} title="Show Occupancy by Theatre" />
                    <div className="space-y-3">
                      {cinemaAnalytics.showOccupancy.map((t, i) => {
                        const pct = t.totalSeats > 0 ? Math.round((t.occupiedSeats / t.totalSeats) * 100) : 0;
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-1.5">
                              <span className="font-medium text-slate-300 truncate max-w-[60%]">{t._id || 'Unknown Theatre'}</span>
                              <span className="text-slate-500 text-xs">{t.showCount} shows · {pct}% occupied</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-2 rounded-full transition-all duration-500 ${pct > 70 ? 'bg-emerald-500' : pct > 40 ? 'bg-amber-500' : 'bg-red-500/10'}`}
                                style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : <EmptyState message="No cinema analytics data" />}
          </>
        )}

        {/* ══════════════════════ TAB: INSIGHTS ════════════════════════════ */}
        {!loading && activeTab === 'insights' && (
          <>
            {insights?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                {insights.map((ins, i) => (
                  <div key={i} className={`p-5 rounded-xl border-l-4 ${ins.priority === 'high' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'}`}>
                    <div className="flex items-start gap-3">
                      <Zap size={18} className={ins.priority === 'high' ? 'text-red-500 flex-shrink-0 mt-0.5' : 'text-blue-500 flex-shrink-0 mt-0.5'} />
                      <div>
                        <h3 className={`font-bold mb-1.5 ${ins.priority === 'high' ? 'text-red-900' : 'text-blue-900'}`}>{ins.title}</h3>
                        <p className={`text-sm leading-relaxed ${ins.priority === 'high' ? 'text-red-700' : 'text-blue-700'}`}>{ins.description}</p>
                        <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${ins.priority === 'high' ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'}`}>
                          {ins.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-12 text-center mb-8">
                <Zap size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-400 mb-2">No Insights Yet</h3>
                <p className="text-slate-500 text-sm">Insights will appear once the system has confirmed bookings to analyze.</p>
              </div>
            )}

            {/* Demand forecast */}
            {/* (Rendered separately; re-use the DemandForecast data from existing endpoint */}
          </>
        )}

        {/* ── No data fallback ─────────────────────────────────────────────── */}
        {!loading && !overview && !error && activeTab === 'overview' && (
          <div className="bg-[#0f172a] rounded-xl border border-slate-800/50 shadow-sm p-12 text-center">
            <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No Analytics Data</h3>
            <p className="text-slate-500">Analytics will appear once shows and bookings are created in the system.</p>
          </div>
        )}
    </div>
  );
}
