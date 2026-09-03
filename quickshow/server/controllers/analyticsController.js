import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import User from '../models/User.js';
import Cinema from '../models/Cinema.js';
import Screen from '../models/Screen.js';

// ─── Shared helpers ───────────────────────────────────────────────────────────

/**
 * Build a MongoDB date-range filter from query params.
 * Supports: today | 7d | 30d | 90d | custom (startDate/endDate)
 * Returns { $gte: Date, $lte: Date } or null (all-time).
 */
function buildDateRange(query) {
  const { range, startDate, endDate } = query;

  if (range === 'custom') {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);
    if (isNaN(s) || isNaN(e) || s > e) return null;
    return { $gte: s, $lte: e };
  }

  const now = new Date();
  if (range === 'today') {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end   = new Date(now); end.setHours(23, 59, 59, 999);
    return { $gte: start, $lte: end };
  }
  if (range === '7d') {
    const start = new Date(now); start.setDate(now.getDate() - 7); start.setHours(0, 0, 0, 0);
    return { $gte: start, $lte: now };
  }
  if (range === '30d') {
    const start = new Date(now); start.setDate(now.getDate() - 30); start.setHours(0, 0, 0, 0);
    return { $gte: start, $lte: now };
  }
  if (range === '90d') {
    const start = new Date(now); start.setDate(now.getDate() - 90); start.setHours(0, 0, 0, 0);
    return { $gte: start, $lte: now };
  }
  // Default: last 30 days
  const start = new Date(now); start.setDate(now.getDate() - 30); start.setHours(0, 0, 0, 0);
  return { $gte: start, $lte: now };
}

const round2 = (n) => Math.round((n || 0) * 100) / 100;

// ─── Existing endpoints (preserved) ──────────────────────────────────────────

/**
 * GET /api/admin/analytics/overview
 * Core KPIs — all-time totals, occupancy.
 */
export const getAnalyticsOverview = async (req, res) => {
  try {
    const [revenueData, ticketData, occupancyData, totalUsers, activeShows] =
      await Promise.all([
        Booking.aggregate([
          { $match: { status: 'confirmed' } },
          { $group: { _id: null, totalRevenue: { $sum: '$amount' }, totalBookings: { $sum: 1 }, avgAmount: { $avg: '$amount' } } },
        ]),
        Booking.aggregate([
          { $match: { status: 'confirmed' } },
          { $group: { _id: null, totalTickets: { $sum: { $size: '$seats' } } } },
        ]),
        Show.aggregate([
          { $group: { _id: null, totalSeats: { $sum: '$totalSeats' }, occupiedSeats: { $sum: { $size: '$occupiedSeats' } } } },
        ]),
        User.countDocuments(),
        Show.countDocuments({ date: { $gte: new Date() } }),
      ]);

    const totalRevenue    = revenueData[0]?.totalRevenue   || 0;
    const totalBookings   = revenueData[0]?.totalBookings  || 0;
    const avgTicketPrice  = revenueData[0]?.avgAmount      || 0;
    const totalTickets    = ticketData[0]?.totalTickets    || 0;
    const totalSeats      = occupancyData[0]?.totalSeats   || 0;
    const occupiedSeats   = occupancyData[0]?.occupiedSeats || 0;
    const avgOccupancy    = totalSeats > 0 ? (occupiedSeats / totalSeats) * 100 : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue:        round2(totalRevenue),
        totalBookings,
        totalTickets,
        totalUsers,
        activeShows,
        avgTicketPrice:      round2(avgTicketPrice),
        avgOccupancy:        round2(avgOccupancy),
        occupancyPercentage: Math.round(avgOccupancy),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return res.status(500).json({ success: false, message: 'Error fetching analytics overview' });
  }
};

/**
 * GET /api/admin/analytics/revenue?range=30d
 * Daily revenue time-series with date-range filter.
 */
export const getRevenueAnalytics = async (req, res) => {
  try {
    const dateRange = buildDateRange(req.query);
    const matchStage = { status: 'confirmed' };
    if (dateRange) matchStage.createdAt = dateRange;

    const dailyRevenue = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          bookings: { $sum: 1 },
          tickets: { $sum: { $size: '$seats' } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalRevenue  = dailyRevenue.reduce((s, d) => s + d.revenue,  0);
    const totalBookings = dailyRevenue.reduce((s, d) => s + d.bookings, 0);
    const totalTickets  = dailyRevenue.reduce((s, d) => s + d.tickets,  0);

    return res.status(200).json({
      success: true,
      data: {
        chartData:    dailyRevenue,
        totalRevenue: round2(totalRevenue),
        totalBookings,
        totalTickets,
        avgDaily: dailyRevenue.length > 0 ? round2(totalRevenue / dailyRevenue.length) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return res.status(500).json({ success: false, message: 'Error fetching revenue analytics' });
  }
};

/**
 * GET /api/admin/analytics/movies
 * Top movies by revenue (from bookings via shows).
 */
export const getMovieAnalytics = async (req, res) => {
  try {
    const moviePerformance = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: '$showId', revenue: { $sum: '$amount' }, bookings: { $sum: 1 }, tickets: { $sum: { $size: '$seats' } } } },
      { $lookup: { from: 'shows', localField: '_id', foreignField: '_id', as: 'show' } },
      { $unwind: '$show' },
      { $lookup: { from: 'movies', localField: 'show.movieId', foreignField: '_id', as: 'movie' } },
      {
        $group: {
          _id: { $ifNull: ['$show.movieId', '$show.tmdbId'] },
          movieTitle:    { $first: { $ifNull: ['$movie.title', '$show.movieTitle'] } },
          totalRevenue:  { $sum: '$revenue' },
          totalBookings: { $sum: '$bookings' },
          totalTickets:  { $sum: '$tickets' },
          showCount:     { $sum: 1 },
          avgRating:     { $first: { $ifNull: [{ $arrayElemAt: ['$movie.rating', 0] }, 0] } },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 20 },
    ]);

    return res.status(200).json({ success: true, data: moviePerformance });
  } catch (error) {
    console.error('Error fetching movie analytics:', error);
    return res.status(500).json({ success: false, message: 'Error fetching movie analytics' });
  }
};

/**
 * GET /api/admin/analytics/genres
 */
export const getGenreAnalytics = async (req, res) => {
  try {
    const genreData = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $lookup: { from: 'shows', localField: 'showId', foreignField: '_id', as: 'show' } },
      { $unwind: '$show' },
      { $lookup: { from: 'movies', localField: 'show.movieId', foreignField: '_id', as: 'movie' } },
      { $unwind: '$movie' },
      { $unwind: '$movie.genres' },
      { $group: { _id: '$movie.genres', revenue: { $sum: '$amount' }, bookings: { $sum: 1 }, tickets: { $sum: { $size: '$seats' } } } },
      { $sort: { revenue: -1 } },
    ]);

    return res.status(200).json({ success: true, data: genreData });
  } catch (error) {
    console.error('Error fetching genre analytics:', error);
    return res.status(500).json({ success: false, message: 'Error fetching genre analytics' });
  }
};

/**
 * GET /api/admin/analytics/demand
 */
export const getDemandAnalytics = async (req, res) => {
  try {
    const [demandData, dayOfWeekData] = await Promise.all([
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $lookup: { from: 'shows', localField: 'showId', foreignField: '_id', as: 'show' } },
        { $unwind: '$show' },
        { $group: { _id: { $hour: { $toDate: { $multiply: [{ $toLong: '$createdAt' }, 1] } } }, bookings: { $sum: 1 }, revenue: { $sum: '$amount' }, tickets: { $sum: { $size: '$seats' } } } },
        { $sort: { _id: 1 } },
      ]),
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $lookup: { from: 'shows', localField: 'showId', foreignField: '_id', as: 'show' } },
        { $unwind: '$show' },
        { $group: { _id: { $dayOfWeek: '$show.date' }, bookings: { $sum: 1 }, revenue: { $sum: '$amount' }, avgOccupancy: { $avg: { $divide: [{ $size: '$seats' }, '$show.totalSeats'] } } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return res.status(200).json({ success: true, data: { byHour: demandData, byDayOfWeek: dayOfWeekData } });
  } catch (error) {
    console.error('Error fetching demand analytics:', error);
    return res.status(500).json({ success: false, message: 'Error fetching demand analytics' });
  }
};

/**
 * GET /api/admin/analytics/insights
 */
export const getAIInsights = async (req, res) => {
  try {
    const insights = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [peakTimeData, weekdayData, topGenre, lowOccupancyShows, highDemandMovies] =
      await Promise.all([
        Booking.aggregate([
          { $match: { status: 'confirmed', createdAt: { $gte: sevenDaysAgo } } },
          { $lookup: { from: 'shows', localField: 'showId', foreignField: '_id', as: 'show' } },
          { $unwind: '$show' },
          { $group: { _id: { $hour: '$show.date' }, bookings: { $sum: 1 }, occupancy: { $avg: { $divide: [{ $size: '$seats' }, '$show.totalSeats'] } } } },
          { $sort: { bookings: -1 } },
          { $limit: 1 },
        ]),
        Booking.aggregate([
          { $match: { status: 'confirmed', createdAt: { $gte: sevenDaysAgo } } },
          { $lookup: { from: 'shows', localField: 'showId', foreignField: '_id', as: 'show' } },
          { $unwind: '$show' },
          { $group: { _id: { $dayOfWeek: '$show.date' }, bookings: { $sum: 1 }, revenue: { $sum: '$amount' } } },
        ]),
        Booking.aggregate([
          { $match: { status: 'confirmed' } },
          { $lookup: { from: 'shows', localField: 'showId', foreignField: '_id', as: 'show' } },
          { $unwind: '$show' },
          { $lookup: { from: 'movies', localField: 'show.movieId', foreignField: '_id', as: 'movie' } },
          { $unwind: '$movie' },
          { $unwind: '$movie.genres' },
          { $group: { _id: '$movie.genres', revenue: { $sum: '$amount' } } },
          { $sort: { revenue: -1 } },
          { $limit: 1 },
        ]),
        Show.aggregate([
          { $match: { date: { $gte: new Date() } } },
          { $addFields: { occupancy: { $divide: [{ $size: '$occupiedSeats' }, '$totalSeats'] } } },
          { $match: { occupancy: { $lt: 0.2 } } },
          { $count: 'total' },
        ]),
        Booking.aggregate([
          { $match: { status: 'confirmed' } },
          { $lookup: { from: 'shows', localField: 'showId', foreignField: '_id', as: 'show' } },
          { $unwind: '$show' },
          { $lookup: { from: 'movies', localField: 'show.movieId', foreignField: '_id', as: 'movie' } },
          { $unwind: '$movie' },
          { $group: { _id: '$movie._id', movieTitle: { $first: '$movie.title' }, totalBookings: { $sum: 1 }, uniqueShows: { $push: '$showId' } } },
          { $addFields: { showCount: { $size: { $setUnion: ['$uniqueShows'] } } } },
          { $match: { totalBookings: { $gt: 50 }, showCount: { $lt: 5 } } },
          { $sort: { totalBookings: -1 } },
          { $limit: 1 },
        ]),
      ]);

    if (peakTimeData.length > 0) {
      const hour = peakTimeData[0]._id;
      const occupancy = Math.round(peakTimeData[0].occupancy * 100);
      insights.push({ type: 'peak_time', title: 'Peak Booking Time', description: `${hour}:00 shows have ${occupancy}% average occupancy and highest demand.`, priority: 'high' });
    }

    const weekendBookings = weekdayData.filter(d => d._id === 1 || d._id === 7).reduce((s, d) => s + d.bookings, 0);
    const weekdayBookings = weekdayData.filter(d => d._id !== 1 && d._id !== 7).reduce((s, d) => s + d.bookings, 0);
    if (weekendBookings > weekdayBookings && weekdayBookings > 0) {
      const increase = Math.round(((weekendBookings - weekdayBookings) / weekdayBookings) * 100);
      insights.push({ type: 'weekend_demand', title: 'Weekend Surge', description: `Weekend shows have ${increase}% higher bookings. Consider adding more weekend shows.`, priority: 'high' });
    }

    if (topGenre.length > 0) {
      insights.push({ type: 'top_genre', title: 'Revenue Leader', description: `${topGenre[0]._id} movies generated the highest revenue. Focus on acquiring more titles.`, priority: 'medium' });
    }

    if (lowOccupancyShows[0]?.total > 0) {
      insights.push({ type: 'low_occupancy', title: 'Low Demand Shows', description: `${lowOccupancyShows[0].total} upcoming shows have less than 20% occupancy. Consider running promotions.`, priority: 'medium' });
    }

    if (highDemandMovies.length > 0) {
      const movie = highDemandMovies[0];
      insights.push({ type: 'high_demand', title: 'Add More Shows', description: `"${movie.movieTitle}" has ${movie.totalBookings} bookings across only ${movie.showCount} shows. Add more shows to meet demand.`, priority: 'high' });
    }

    return res.status(200).json({ success: true, data: insights });
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    return res.status(500).json({ success: false, message: 'Error fetching AI insights' });
  }
};

/**
 * GET /api/admin/analytics/forecast
 */
export const getDemandForecast = async (req, res) => {
  try {
    const upcomingShows = await Show.aggregate([
      { $match: { date: { $gte: new Date() } } },
      { $lookup: { from: 'movies', localField: 'movieId', foreignField: '_id', as: 'movie' } },
      { $unwind: { path: '$movie', preserveNullAndEmptyArrays: true } },
      { $addFields: { currentOccupancy: { $divide: [{ $size: '$occupiedSeats' }, '$totalSeats'] } } },
      { $sort: { date: 1 } },
      { $limit: 20 },
    ]);

    const forecast = await Promise.all(
      upcomingShows.map(async (show) => {
        const historicalData = await Booking.aggregate([
          { $match: { status: 'confirmed' } },
          { $lookup: { from: 'shows', localField: 'showId', foreignField: '_id', as: 'show' } },
          { $unwind: '$show' },
          { $match: { 'show.tmdbId': show.tmdbId } },
          { $group: { _id: null, avgOccupancy: { $avg: { $divide: [{ $size: '$seats' }, '$show.totalSeats'] } }, totalBookings: { $sum: 1 } } },
        ]);

        let predictedOccupancy = show.currentOccupancy;
        let demandLevel = 'NORMAL';
        if (historicalData.length > 0) {
          predictedOccupancy = historicalData[0].avgOccupancy || show.currentOccupancy;
          if (predictedOccupancy >= 0.8) demandLevel = 'VERY_HIGH';
          else if (predictedOccupancy >= 0.65) demandLevel = 'HIGH';
          else if (predictedOccupancy >= 0.4) demandLevel = 'NORMAL';
          else demandLevel = 'LOW';
        }

        return {
          showId:              show._id.toString(),
          movieTitle:          show.movie?.title || show.movieTitle,
          date:                show.date,
          time:                show.time,
          theatre:             show.theatre,
          screen:              show.screen,
          currentOccupancy:    Math.round(show.currentOccupancy * 100),
          predictedOccupancy:  Math.round(predictedOccupancy * 100),
          demandLevel,
          movieRating:         show.movie?.rating || 0,
          totalSeats:          show.totalSeats,
          availableSeats:      show.totalSeats - show.occupiedSeats.length,
        };
      })
    );

    return res.status(200).json({ success: true, data: forecast });
  } catch (error) {
    console.error('Error fetching demand forecast:', error);
    return res.status(500).json({ success: false, message: 'Error fetching demand forecast' });
  }
};

/**
 * GET /api/admin/analytics/counts
 * Dashboard overview entity counts.
 */
export const getCounts = async (req, res) => {
  try {
    const [
      totalUsers, totalMovies, totalCinemas, totalScreens, totalShows, totalBookings,
      revenueData, todayData,
    ] = await Promise.all([
      User.countDocuments(),
      Movie.countDocuments(),
      Cinema.countDocuments(),
      Screen.countDocuments(),
      Show.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Booking.aggregate([
        {
          $match: {
            status: 'confirmed',
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lt:  new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        },
        { $group: { _id: null, todayRevenue: { $sum: '$amount' }, todayBookings: { $sum: 1 } } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers, totalMovies, totalCinemas, totalScreens, totalShows, totalBookings,
        totalRevenue:   round2(revenueData[0]?.total || 0),
        todayRevenue:   round2(todayData[0]?.todayRevenue || 0),
        todayBookings:  todayData[0]?.todayBookings || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching counts:', error);
    return res.status(500).json({ success: false, message: 'Error fetching entity counts' });
  }
};

// ─── NEW Phase 8 endpoints ────────────────────────────────────────────────────

/**
 * GET /api/admin/analytics/trends?range=30d&groupBy=day
 * Revenue + bookings time-series with groupBy (day | week | month).
 */
export const getTrends = async (req, res) => {
  try {
    const dateRange = buildDateRange(req.query);
    const groupBy   = req.query.groupBy || 'day';

    const matchStage = { status: 'confirmed' };
    if (dateRange) matchStage.createdAt = dateRange;

    let groupFormat;
    if (groupBy === 'week')  groupFormat = '%Y-W%V';
    else if (groupBy === 'month') groupFormat = '%Y-%m';
    else groupFormat = '%Y-%m-%d';

    const [revenueByPeriod, bookingsByPeriod] = await Promise.all([
      Booking.aggregate([
        { $match: matchStage },
        { $group: {
          _id:      { $dateToString: { format: groupFormat, date: '$createdAt' } },
          revenue:  { $sum: '$amount' },
          bookings: { $sum: 1 },
          tickets:  { $sum: { $size: '$seats' } },
        }},
        { $sort: { _id: 1 } },
      ]),
      Booking.aggregate([
        { $match: { createdAt: dateRange || { $exists: true } } },
        { $group: {
          _id:    '$status',
          count:  { $sum: 1 },
          amount: { $sum: '$amount' },
        }},
      ]),
    ]);

    const totalRevenue  = revenueByPeriod.reduce((s, d) => s + d.revenue,  0);
    const totalBookings = revenueByPeriod.reduce((s, d) => s + d.bookings, 0);

    return res.status(200).json({
      success: true,
      data: {
        chartData:      revenueByPeriod,
        statusBreakdown: bookingsByPeriod,
        totalRevenue:   round2(totalRevenue),
        totalBookings,
        avgPerPeriod:   revenueByPeriod.length ? round2(totalRevenue / revenueByPeriod.length) : 0,
        dateRange:      req.query.range || '30d',
        groupBy,
      },
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    return res.status(500).json({ success: false, message: 'Error fetching trends data' });
  }
};

/**
 * GET /api/admin/analytics/booking-status?range=30d
 * Booking status & payment distribution + method breakdown.
 */
export const getBookingStatus = async (req, res) => {
  try {
    const dateRange = buildDateRange(req.query);
    const matchAll  = dateRange ? { createdAt: dateRange } : {};

    const [statusDist, paymentMethodDist, paymentStatusDist, recentBookings] =
      await Promise.all([
        Booking.aggregate([
          { $match: matchAll },
          { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
          { $sort: { count: -1 } },
        ]),
        Booking.aggregate([
          { $match: { ...matchAll, status: 'confirmed' } },
          { $group: { _id: '$paymentMethod', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
          { $sort: { count: -1 } },
        ]),
        Booking.aggregate([
          { $match: matchAll },
          { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Booking.find(dateRange ? { createdAt: dateRange } : {})
          .sort({ createdAt: -1 })
          .limit(10)
          .select('status paymentMethod amount seats movieTitle showDate showTime createdAt'),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        statusDistribution:        statusDist,
        paymentMethodDistribution: paymentMethodDist,
        paymentStatusDistribution: paymentStatusDist,
        recentBookings,
      },
    });
  } catch (error) {
    console.error('Error fetching booking status:', error);
    return res.status(500).json({ success: false, message: 'Error fetching booking status data' });
  }
};

/**
 * GET /api/admin/analytics/cinema-analytics?range=30d
 * Per-cinema revenue, bookings, occupancy.
 */
export const getCinemaAnalytics = async (req, res) => {
  try {
    const dateRange = buildDateRange(req.query);
    const matchStage = { status: 'confirmed' };
    if (dateRange) matchStage.createdAt = dateRange;

    // Cinema analytics via show.theatre name (since bookings don't have cinemaId directly)
    const [cinemaRevenue, cinemaList] = await Promise.all([
      Booking.aggregate([
        { $match: matchStage },
        { $lookup: { from: 'shows', localField: 'showId', foreignField: '_id', as: 'show' } },
        { $unwind: '$show' },
        {
          $group: {
            _id:           '$show.theatre',
            totalRevenue:  { $sum: '$amount' },
            totalBookings: { $sum: 1 },
            totalTickets:  { $sum: { $size: '$seats' } },
            avgOccupancy:  { $avg: { $divide: [{ $size: '$seats' }, '$show.totalSeats'] } },
            showCount:     { $addToSet: '$show._id' },
          },
        },
        {
          $project: {
            _id: 1,
            totalRevenue: 1,
            totalBookings: 1,
            totalTickets: 1,
            avgOccupancy: { $multiply: ['$avgOccupancy', 100] },
            showCount: { $size: '$showCount' },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ]),
      Cinema.find({}).select('name city status totalScreens totalCapacity').lean(),
    ]);

    // Occupancy per cinema from Show model
    const showOccupancy = await Show.aggregate([
      {
        $group: {
          _id:           '$theatre',
          totalSeats:    { $sum: '$totalSeats' },
          occupiedSeats: { $sum: { $size: '$occupiedSeats' } },
          showCount:     { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        cinemaRevenue,
        cinemaList,
        showOccupancy,
      },
    });
  } catch (error) {
    console.error('Error fetching cinema analytics:', error);
    return res.status(500).json({ success: false, message: 'Error fetching cinema analytics' });
  }
};

/**
 * GET /api/admin/analytics/popular-shows?range=30d
 * Top shows by bookings + occupancy.
 */
export const getPopularShows = async (req, res) => {
  try {
    const dateRange = buildDateRange(req.query);
    const matchStage = { status: 'confirmed' };
    if (dateRange) matchStage.createdAt = dateRange;

    const popularShows = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:           '$showId',
          totalRevenue:  { $sum: '$amount' },
          totalBookings: { $sum: 1 },
          totalTickets:  { $sum: { $size: '$seats' } },
        },
      },
      { $lookup: { from: 'shows', localField: '_id', foreignField: '_id', as: 'show' } },
      { $unwind: '$show' },
      {
        $addFields: {
          occupancyPct: {
            $multiply: [
              { $divide: [{ $size: '$show.occupiedSeats' }, '$show.totalSeats'] },
              100,
            ],
          },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalBookings: 1,
          totalTickets: 1,
          occupancyPct: { $round: ['$occupancyPct', 1] },
          movieTitle:   '$show.movieTitle',
          date:         '$show.date',
          time:         '$show.time',
          theatre:      '$show.theatre',
          screen:       '$show.screen',
          screenType:   '$show.screenType',
          totalSeats:   '$show.totalSeats',
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 20 },
    ]);

    return res.status(200).json({ success: true, data: popularShows });
  } catch (error) {
    console.error('Error fetching popular shows:', error);
    return res.status(500).json({ success: false, message: 'Error fetching popular shows' });
  }
};
