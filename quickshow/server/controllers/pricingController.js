import {
  getShowPricing,
  validateBookingPrice,
  getPricingConfig,
  updatePricingConfig,
} from '../services/pricingService.js';

/**
 * GET /api/pricing/show/:showId
 * Get dynamic pricing information for a show
 */
export const getShowDynamicPrice = async (req, res) => {
  try {
    const { showId } = req.params;

    if (!showId) {
      return res.status(400).json({
        success: false,
        message: 'Show ID is required',
      });
    }

    const result = await getShowPricing(showId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error getting show pricing:', error);
    return res.status(500).json({
      success: false,
      message: 'Error calculating pricing',
    });
  }
};

/**
 * POST /api/pricing/validate
 * Validate and calculate final booking price before payment
 */
export const validatePrice = async (req, res) => {
  try {
    const { showId, seatCount } = req.body;

    if (!showId || !seatCount || seatCount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Show ID and valid seat count are required',
      });
    }

    const result = await validateBookingPrice(showId, seatCount);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error validating price:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating pricing',
    });
  }
};

/**
 * GET /api/pricing/config
 * Get pricing configuration (admin only)
 */
export const getPricingConfigEndpoint = async (req, res) => {
  try {
    // In production, check if user is admin
    const config = getPricingConfig();

    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error getting pricing config:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting pricing configuration',
    });
  }
};

/**
 * PUT /api/pricing/config
 * Update pricing configuration (admin only)
 */
export const updatePricingConfigEndpoint = async (req, res) => {
  try {
    // In production, check if user is admin
    const { enabled, minMultiplier, maxMultiplier } = req.body;

    const config = {
      ...(enabled !== undefined && { enabled }),
      ...(minMultiplier !== undefined && { minMultiplier }),
      ...(maxMultiplier !== undefined && { maxMultiplier }),
    };

    if (Object.keys(config).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No configuration parameters provided',
      });
    }

    const updatedConfig = updatePricingConfig(config);

    return res.status(200).json({
      success: true,
      data: updatedConfig,
      message: 'Pricing configuration updated successfully',
    });
  } catch (error) {
    console.error('Error updating pricing config:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating pricing configuration',
    });
  }
};
