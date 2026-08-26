import Show from '../models/Show.js';
import Booking from '../models/Booking.js';
import Movie from '../models/Movie.js';

/**
 * Dynamic Ticket Pricing Service
 * Calculates recommended ticket prices based on demand
 */

const PRICING_CONFIG = {
  minMultiplier: 0.8, // 80% of base price (minimum)
  maxMultiplier: 1.3, // 130% of base price (maximum)
  enabled: true,
};

/**
 * Calculate occupancy percentage for a show
 */
function calculateOccupancy(show) {
  if (!show.totalSeats || show.totalSeats === 0) return 0;
  const bookedSeats = (show.occupiedSeats?.length || 0) + (show.lockedSeats?.length || 0);
  return (bookedSeats / show.totalSeats) * 100;
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday)
 */
function getDayOfWeek(date) {
  return new Date(date).getDay();
}

/**
 * Check if date is a weekend
 */
function isWeekend(date) {
  const day = getDayOfWeek(date);
  return day === 5 || day === 6 || day === 0; // Friday, Saturday, Sunday
}

/**
 * Extract hour from time string (HH:MM format)
 */
function getShowHour(timeStr) {
  if (!timeStr) return 20; // Default to evening
  const parts = timeStr.split(':');
  return parseInt(parts[0]) || 20;
}

/**
 * Calculate demand score (0-100) using rule-based logic
 * This is transparent and can be replaced with ML later
 */
export function calculateDemandScore(show, movie) {
  let score = 50; // Base score

  // 1. Occupancy factor (0-30 points)
  const occupancy = calculateOccupancy(show);
  if (occupancy < 30) {
    score += 5; // Low occupancy
  } else if (occupancy < 50) {
    score += 10;
  } else if (occupancy < 70) {
    score += 20;
  } else if (occupancy < 90) {
    score += 25;
  } else {
    score += 30; // Very high occupancy
  }

  // 2. Movie rating factor (0-15 points)
  const rating = movie?.rating || 0;
  if (rating >= 8) {
    score += 15;
  } else if (rating >= 7) {
    score += 12;
  } else if (rating >= 6) {
    score += 8;
  } else if (rating >= 5) {
    score += 4;
  }

  // 3. Day/Time factor (0-15 points)
  const day = getDayOfWeek(show.date);
  const hour = getShowHour(show.time);
  const isWeek = isWeekend(show.date);

  // Weekend boost
  if (isWeek) {
    score += 8;
  }

  // Prime time (evening 6 PM - 11 PM) boost
  if (hour >= 18 && hour <= 23) {
    score += 7;
  } else if (hour >= 12 && hour < 18) {
    // Afternoon
    score += 3;
  }

  // 4. Remaining seats factor (0-10 points)
  const remainingSeats = show.totalSeats - (show.occupiedSeats?.length || 0);
  if (remainingSeats <= 5) {
    score += 10; // Very few seats left
  } else if (remainingSeats <= 20) {
    score += 7;
  } else if (remainingSeats <= 50) {
    score += 3;
  }

  // 5. Genre factor (0-5 points) - Action, Thriller, Horror tend to book faster
  const boostGenres = ['Action', 'Thriller', 'Horror', 'Adventure'];
  if (movie?.genres && movie.genres.some((g) => boostGenres.includes(g))) {
    score += 5;
  }

  // Clamp score between 0-100
  return Math.min(100, Math.max(0, score));
}

/**
 * Get demand level label from score
 */
export function getDemandLevel(score) {
  if (score >= 80) return 'VERY_HIGH';
  if (score >= 65) return 'HIGH';
  if (score >= 40) return 'NORMAL';
  return 'LOW';
}

/**
 * Calculate price multiplier based on demand score
 */
function calculatePriceMultiplier(demandScore) {
  const { minMultiplier, maxMultiplier } = PRICING_CONFIG;

  // Map demand score (0-100) to multiplier range
  // 0 score = min price (0.8)
  // 100 score = max price (1.3)
  const normalizedScore = demandScore / 100;
  const multiplier = minMultiplier + (maxMultiplier - minMultiplier) * normalizedScore;

  return Math.min(maxMultiplier, Math.max(minMultiplier, multiplier));
}

/**
 * Calculate final ticket price
 */
export function calculateDynamicPrice(basePrice, demandScore) {
  const multiplier = calculatePriceMultiplier(demandScore);
  const dynamicPrice = basePrice * multiplier;

  // Round to nearest rupee
  return Math.round(dynamicPrice);
}

/**
 * Get complete pricing information for a show
 */
export async function getShowPricing(showId) {
  try {
    const show = await Show.findById(showId).populate('movieId').lean();

    if (!show) {
      return {
        success: false,
        error: 'Show not found',
      };
    }

    const movie = show.movieId;
    const basePrice = show.price || 0;
    const occupancy = calculateOccupancy(show);
    const remainingSeats = show.totalSeats - (show.occupiedSeats?.length || 0) - (show.lockedSeats?.length || 0);
    const demandScore = calculateDemandScore(show, movie);
    const demandLevel = getDemandLevel(demandScore);
    const recommendedPrice = calculateDynamicPrice(basePrice, demandScore);

    // Build reason for price change
    const reasons = [];
    if (occupancy > 80) {
      reasons.push('High occupancy');
    }
    if (isWeekend(show.date)) {
      reasons.push('Weekend demand');
    }
    const hour = getShowHour(show.time);
    if (hour >= 18 && hour <= 23) {
      reasons.push('Prime time');
    }
    if (movie?.rating >= 7.5) {
      reasons.push('Popular movie');
    }
    if (remainingSeats <= 20) {
      reasons.push('Limited availability');
    }

    const reason = reasons.length > 0 ? reasons.join(', ') : 'Standard pricing';

    return {
      success: true,
      data: {
        showId: show._id.toString(),
        basePrice,
        recommendedPrice,
        demandScore: Math.round(demandScore),
        demandLevel,
        occupancy: Math.round(occupancy),
        remainingSeats,
        totalSeats: show.totalSeats,
        reason,
        movieTitle: movie?.title || 'Unknown',
        showDate: show.date,
        showTime: show.time,
        theatre: show.theatre,
        screen: show.screen,
      },
    };
  } catch (error) {
    console.error('Error calculating show pricing:', error);
    return {
      success: false,
      };
  }
}

/**
 * Validate and calculate final booking price
 * This is called during payment to ensure correct amount
 */
export async function validateBookingPrice(showId, seatCount) {
  try {
    const show = await Show.findById(showId).populate('movieId').lean();

    if (!show) {
      return {
        success: false,
        error: 'Show not found',
      };
    }

    const movie = show.movieId;
    const basePrice = show.price || 0;
    const demandScore = calculateDemandScore(show, movie);
    const dynamicPrice = calculateDynamicPrice(basePrice, demandScore);

    // Calculate subtotal and total with tax
    const subtotal = dynamicPrice * seatCount;
    const tax = Math.round(subtotal * 0.1 * 100) / 100;
    const total = subtotal + tax;

    return {
      success: true,
      data: {
        basePrice,
        dynamicPrice,
        demandScore: Math.round(demandScore),
        seatCount,
        subtotal: Math.round(subtotal * 100) / 100,
        tax,
        total: Math.round(total * 100) / 100,
      },
    };
  } catch (error) {
    console.error('Error validating booking price:', error);
    return {
      success: false,
      };
  }
}

/**
 * Get pricing configuration for admin
 */
export function getPricingConfig() {
  return {
    enabled: PRICING_CONFIG.enabled,
    minMultiplier: PRICING_CONFIG.minMultiplier,
    maxMultiplier: PRICING_CONFIG.maxMultiplier,
    minPercentage: Math.round(PRICING_CONFIG.minMultiplier * 100),
    maxPercentage: Math.round(PRICING_CONFIG.maxMultiplier * 100),
  };
}

/**
 * Update pricing configuration (admin only)
 */
export function updatePricingConfig(config) {
  if (config.hasOwnProperty('enabled')) {
    PRICING_CONFIG.enabled = config.enabled;
  }
  if (config.hasOwnProperty('minMultiplier')) {
    // Ensure min is at least 0.5 (50%)
    PRICING_CONFIG.minMultiplier = Math.max(0.5, config.minMultiplier);
  }
  if (config.hasOwnProperty('maxMultiplier')) {
    // Ensure max is at most 2.0 (200%)
    PRICING_CONFIG.maxMultiplier = Math.min(2.0, config.maxMultiplier);
  }
  return PRICING_CONFIG;
}
