import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import User from '../models/User.js';

/**
 * GET /api/admin/analytics/overview
 * Get comprehensive analytics overview
 */
export const getAnalyticsOverview = async (req, res) => {
  try {
    // Revenue metrics
    const revenueData = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalBookings: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
    ]);

    // Ticket metrics
    const ticketData = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: { $size: '$seats' } },
        },
      },
    ]);

    // Occupancy metrics
    const occupancyData = await Show.aggregate([
      {
        $group: {
          _id: null,
          totalSeats: { $sum: '$totalSeats' },
          occupiedSeats: {
            $sum: { $size: '$occupiedSeats' },
          },
        },
      },
    ]);

    // Users
    const totalUsers = await User.countDocuments();

    // Active shows
    const activeShows = await Show.countDocuments({
      date: { $gte: new Date() },
    });

    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const totalBookings = revenueData[0]?.totalBookings || 0;
    const avgTicketPrice = revenueData[0]?.avgAmount || 0;
    const totalTickets = ticketData[0]?.totalTickets || 0;
    const totalSeats = occupancyData[0]?.totalSeats || 0;
    const occupiedSeats = occupancyData[0]?.occupiedSeats || 0;
    const avgOccupancy = totalSeats > 0 ? (occupiedSeats / totalSeats) * 100 : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBookings,
        totalTickets,
        totalUsers,
        activeShows,
        avgTicketPrice: Math.round(avgTicketPrice * 100) / 100,
        avgOccupancy: Math.round(avgOccupancy * 100) / 100,
        occupancyPercentage: Math.round(avgOccupancy),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching analytics overview',
    });
  }
};

/**
 * GET /api/admin/analytics/revenue
 * Get revenue analytics with time-series data
 */
export const getRevenueAnalytics = async (req, res) => {
  try {
    // Daily revenue for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenue = await Booking.aggregate([
      {
        $match: {
          status: 'confirmed',
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          revenue: { $sum: '$amount' },
          bookings: { $sum: 1 },
          tickets: { $sum: { $size: '$seats' } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Total for period
    const totalRevenue = dailyRevenue.reduce((sum, day) => sum + day.revenue, 0);
    const totalBookings = dailyRevenue.reduce((sum, day) => sum + day.bookings, 0);
    const totalTickets = dailyRevenue.reduce((sum, day) => sum + day.tickets, 0);

    return res.status(200).json({
      success: true,
      data: {
        chartData: dailyRevenue,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBookings,
        totalTickets,
        avgDaily: dailyRevenue.length > 0
          ? Math.round((totalRevenue / dailyRevenue.length) * 100) / 100
          : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching revenue analytics',
    });
  }
};

/**
 * GET /api/admin/analytics/movies
 * Get movie performance analytics
 */
export const getMovieAnalytics = async (req, res) => {
  try {
    const moviePerformance = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: '$showId',
          revenue: { $sum: '$amount' },
          bookings: { $sum: 1 },
          tickets: { $sum: { $size: '$seats' } },
        },
      },
      {
        $lookup: {
          from: 'shows',
          localField: '_id',
          foreignField: '_id',
          as: 'show',
        },
      },
      { $unwind: '$show' },
      {
        $lookup: {
          from: 'movies',
          localField: 'show.movieId',
          foreignField: '_id',
          as: 'movie',
        },
      },
      { $unwind: '$movie' },
      {
        $group: {
          _id: '$movie._id',
          movieTitle: { $first: '$movie.title' },
          totalRevenue: { $sum: '$revenue' },
          totalBookings: { $sum: '$bookings' },
          totalTickets: { $sum: '$tickets' },
          showCount: { $sum: 1 },
          avgRating: { $first: '$movie.rating' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 20 },
    ];

    return res.status(200).json({
      success: true,
      data: moviePerformance,
    });
  } catch (error) {
    console.error('Error fetching movie analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching movie analytics',
    });
  }
};

/**
 * GET /api/admin/analytics/genres
 * Get genre performance analytics
 */
export const getGenreAnalytics = async (req, res) => {
  try {
    const genreData = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $lookup: {
          from: 'shows',
          localField: 'showId',
          foreignField: '_id',
          as: 'show',
        },
      },
      { $unwind: '$show' },
      {
        $lookup: {
          from: 'movies',
          localField: 'show.movieId',
          foreignField: '_id',
          as: 'movie',
        },
      },
      { $unwind: '$movie' },
      { $unwind: '$movie.genres' },
      {
        $group: {
          _id: '$movie.genres',
          revenue: { $sum: '$amount' },
          bookings: { $sum: 1 },
          tickets: { $sum: { $size: '$seats' } },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: genreData,
    });
  } catch (error) {
    console.error('Error fetching genre analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching genre analytics',
    });
  }
};

/**
 * GET /api/admin/analytics/demand
 * Get demand analysis
 */
export const getDemandAnalytics = async (req, res) => {
  try {
    const demandData = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $lookup: {
          from: 'shows',
          localField: 'showId',
          foreignField: '_id',
          as: 'show',
        },
      },
      { $unwind: '$show' },
      {
        $group: {
          _id: {
            $hour: { $toDate: { $multiply: [{ $toLong: '$createdAt' }, 1] } },
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$amount' },
          tickets: { $sum: { $size: '$seats' } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get day-of-week analytics
    const dayOfWeekData = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $lookup: {
          from: 'shows',
          localField: 'showId',
          foreignField: '_id',
          as: 'show',
        },
      },
      { $unwind: '$show' },
      {
        $group: {
          _id: { $dayOfWeek: '$show.date' },
          bookings: { $sum: 1 },
          revenue: { $sum: '$amount' },
          avgOccupancy: { $avg: { $divide: [{ $size: '$seats' }, '$show.totalSeats'] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        byHour: demandData,
        byDayOfWeek: dayOfWeekData,
      },
    });
  } catch (error) {
    console.error('Error fetching demand analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching demand analytics',
    });
  }
};

/**
 * GET /api/admin/analytics/insights
 * Get AI business insights based on real data
 */
export const getAIInsights = async (req, res) => {
  try {
    const insights = [];

    // Get last 7 days data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Peak time analysis
    const peakTimeData = await Booking.aggregate([
      {
        $match: {
          status: 'confirmed',
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $lookup: {
          from: 'shows',
          localField: 'showId',
          foreignField: '_id',
          as: 'show',
        },
      },
      { $unwind: '$show' },
      {
        $group: {
          _id: { $hour: '$show.date' },
          bookings: { $sum: 1 },
          occupancy: { $avg: { $divide: [{ $size: '$seats' }, '$show.totalSeats'] } },
        },
      },
      { $sort: { bookings: -1 } },
      { $limit: 1 },
    ]);

    if (peakTimeData.length > 0) {
      const hour = peakTimeData[0]._id;
      const occupancy = Math.round(peakTimeData[0].occupancy * 100);
      insights.push({
        type: 'peak_time',
        title: 'Peak Booking Time',
        description: `${hour}:00 shows have ${occupancy}% average occupancy and highest demand.`,
        priority: 'high',
      });
    }

    // 2. Weekend analysis
    const weekdayData = await Booking.aggregate([
      {
        $match: {
          status: 'confirmed',
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $lookup: {
          from: 'shows',
          localField: 'showId',
          foreignField: '_id',
          as: 'show',
        },
      },
      { $unwind: '$show' },
      {
        $group: {
          _id: { $dayOfWeek: '$show.date' },
          bookings: { $sum: 1 },
          revenue: { $sum: '$amount' },
        },
      },
    ]);

    const weekendBookings = weekdayData
      .filter((d) => d._id === 0 || d._id === 6) // Sunday, Saturday
      .reduce((sum, d) => sum + d.bookings, 0);

    const weekdayBookings = weekdayData
      .filter((d) => d._id !== 0 && d._id !== 6)
      .reduce((sum, d) => sum + d.bookings, 0);

    if (weekendBookings > weekdayBookings) {
      const increase = Math.round(((weekendBookings - weekdayBookings) / weekdayBookings) * 100);
      insights.push({
        type: 'weekend_demand',
        title: 'Weekend Surge',
        description: `Weekend shows have ${increase}% higher bookings than weekdays. Consider adding more weekend shows.`,
        priority: 'high',
      });
    }

    // 3. Top genre analysis
    const topGenre = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $lookup: {
          from: 'shows',
          localField: 'showId',
          foreignField: '_id',
          as: 'show',
        },
      },
      { $unwind: '$show' },
      {
        $lookup: {
          from: 'movies',
          localField: 'show.movieId',
          foreignField: '_id',
          as: 'movie',
        },
      },
      { $unwind: '$movie' },
      { $unwind: '$movie.genres' },
      {
        $group: {
          _id: '$movie.genres',
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 1 },
    ]);

    if (topGenre.length > 0) {
      insights.push({
        type: 'top_genre',
        title: 'Revenue Leader',
        description: `${topGenre[0]._id} movies generated the highest revenue. Focus on acquiring more ${topGenre[0]._id} titles.`,
        priority: 'medium',
      });
    }

    // 4. Low occupancy warning
    const lowOccupancyShows = await Show.aggregate([
      { $match: { date: { $gte: new Date() } } },
      {
        $addFields: {
          occupancy: {
            $divide: [{ $size: '$occupiedSeats' }, '$totalSeats'],
          },
        },
      },
      { $match: { occupancy: { $lt: 0.2 } } },
      { $count: 'total' },
    ]);

    if (lowOccupancyShows[0]?.total > 0) {
      insights.push({
        type: 'low_occupancy',
        title: 'Low Demand Shows',
        description: `${lowOccupancyShows[0].total} upcoming shows have less than 20% occupancy. Consider running promotions.`,
        priority: 'medium',
      });
    }

    // 5. High demand opportunities
    const highDemandMovies = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $lookup: {
          from: 'shows',
          localField: 'showId',
          foreignField: '_id',
          as: 'show',
        },
      },
      { $unwind: '$show' },
      {
        $lookup: {
          from: 'movies',
          localField: 'show.movieId',
          foreignField: '_id',
          as: 'movie',
        },
      },
      { $unwind: '$movie' },
      {
        $group: {
          _id: '$movie._id',
          movieTitle: { $first: '$movie.title' },
          totalBookings: { $sum: 1 },
          uniqueShows: { $push: '$showId' },
        },
      },
      { $addFields: { showCount: { $size: { $setUnion: ['$uniqueShows'] } } } },
      { $match: { totalBookings: { $gt: 50 }, showCount: { $lt: 5 } } },
      { $sort: { totalBookings: -1 } },
      { $limit: 1 },
    ]);

    if (highDemandMovies.length > 0) {
      const movie = highDemandMovies[0];
      insights.push({
        type: 'high_demand',
        title: 'Add More Shows',
        description: `"${movie.movieTitle}" has ${movie.totalBookings} bookings across only ${movie.showCount} shows. Add more shows to meet demand.`,
        priority: 'high',
      });
    }

    return res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching AI insights',
    });
  }
};

/**
 * GET /api/admin/analytics/forecast
 * Get demand forecast for upcoming shows
 */
export const getDemandForecast = async (req, res) => {
  try {
    // Get upcoming shows with historical demand data
    const upcomingShows = await Show.aggregate([
      { $match: { date: { $gte: new Date() } } },
      {
        $lookup: {
          from: 'movies',
          localField: 'movieId',
          foreignField: '_id',
          as: 'movie',
        },
      },
      { $unwind: '$movie' },
      {
        $addFields: {
          currentOccupancy: {
            $divide: [{ $size: '$occupiedSeats' }, '$totalSeats'],
          },
        },
      },
      { $sort: { date: 1 } },
      { $limit: 20 },
    ]);

    // For each show, calculate predicted demand
    const forecast = await Promise.all(
      upcomingShows.map(async (show) => {
        // Get historical bookings for similar shows (same movie, similar day/time)
        const dayOfWeek = new Date(show.date).getDay();
        const hour = parseInt(show.time.split(':')[0]);

        const historicalData = await Booking.aggregate([
          { $match: { status: 'confirmed' } },
          {
            $lookup: {
              from: 'shows',
              localField: 'showId',
              foreignField: '_id',
              as: 'show',
            },
          },
          { $unwind: '$show' },
          {
            $match: {
              'show.movieId': show.movieId,
            },
          },
          {
            $addFields: {
              hour: { $hour: '$show.date' },
              dayOfWeek: { $dayOfWeek: '$show.date' },
            },
          },
          {
            $group: {
              _id: null,
              avgOccupancy: { $avg: { $divide: [{ $size: '$seats' }, '$show.totalSeats'] } },
              avgBookings: { $avg: { $literal: 1 } },
              totalBookings: { $sum: 1 },
            },
          },
        ]);

        let predictedOccupancy = show.currentOccupancy;
        let demandLevel = 'NORMAL';

        if (historicalData.length > 0) {
          const historical = historicalData[0];
          predictedOccupancy = historical.avgOccupancy || show.currentOccupancy;

          if (predictedOccupancy >= 0.8) {
            demandLevel = 'VERY_HIGH';
          } else if (predictedOccupancy >= 0.65) {
            demandLevel = 'HIGH';
          } else if (predictedOccupancy >= 0.4) {
            demandLevel = 'NORMAL';
          } else {
            demandLevel = 'LOW';
          }
        }

        return {
          showId: show._id.toString(),
          movieTitle: show.movie.title,
          date: show.date,
          time: show.time,
          theatre: show.theatre,
          screen: show.screen,
          currentOccupancy: Math.round(show.currentOccupancy * 100),
          predictedOccupancy: Math.round(predictedOccupancy * 100),
          demandLevel,
          movieRating: show.movie.rating,
          totalSeats: show.totalSeats,
          availableSeats: show.totalSeats - show.occupiedSeats.length,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    console.error('Error fetching demand forecast:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching demand forecast',
    });
  }
};
