import Cinema from '../models/Cinema.js';
import Screen from '../models/Screen.js';
import Show from '../models/Show.js';

// @desc    Get all cinemas
// @route   GET /api/cinema
// @access  Public
export const getAllCinemas = async (req, res) => {
  try {
    const { city, status, search, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    
    if (city) {
      filter.city = new RegExp(city, 'i');
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') },
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const cinemas = await Cinema.find(filter)
      .sort({ city: 1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Cinema.countDocuments(filter);
    
    res.json({
      success: true,
      data: cinemas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching cinemas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cinemas',
      error: error.message,
    });
  }
};

// @desc    Get cinema by ID
// @route   GET /api/cinema/:id
// @access  Public
export const getCinemaById = async (req, res) => {
  try {
    const cinema = await Cinema.findById(req.params.id);
    
    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: 'Cinema not found',
      });
    }
    
    // Get screens for this cinema
    const screens = await Screen.find({ cinemaId: cinema._id, status: 'active' });
    
    res.json({
      success: true,
      data: {
        ...cinema.toObject(),
        screens,
      },
    });
  } catch (error) {
    console.error('Error fetching cinema:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cinema',
      error: error.message,
    });
  }
};

// @desc    Get all cities with cinemas
// @route   GET /api/cinema/cities
// @access  Public
export const getCities = async (req, res) => {
  try {
    const cities = await Cinema.distinct('city', { status: 'active' });
    
    res.json({
      success: true,
      data: cities.sort(),
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message,
    });
  }
};

// @desc    Create new cinema
// @route   POST /api/cinema
// @access  Admin
export const createCinema = async (req, res) => {
  try {
    const { name, city, address, contact, facilities, coordinates } = req.body;
    
    // Validation
    if (!name || !city || !address || !contact?.phone || !contact?.email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, city, address, contact (phone & email)',
      });
    }
    
    // Check if cinema already exists in the same city
    const existingCinema = await Cinema.findOne({
      name: new RegExp(`^${name}$`, 'i'),
      city: new RegExp(`^${city}$`, 'i'),
    });
    
    if (existingCinema) {
      return res.status(400).json({
        success: false,
        message: `Cinema "${name}" already exists in ${city}`,
      });
    }
    
    const cinema = await Cinema.create({
      name,
      city,
      address,
      contact,
      facilities: facilities || [],
      coordinates,
      status: 'active',
    });
    
    res.status(201).json({
      success: true,
      message: 'Cinema created successfully',
      data: cinema,
    });
  } catch (error) {
    console.error('Error creating cinema:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message),
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create cinema',
      error: error.message,
    });
  }
};

// @desc    Update cinema
// @route   PUT /api/cinema/:id
// @access  Admin
export const updateCinema = async (req, res) => {
  try {
    const { name, city, address, contact, facilities, coordinates, status } = req.body;
    
    const cinema = await Cinema.findById(req.params.id);
    
    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: 'Cinema not found',
      });
    }
    
    // Check for duplicate name in the same city if name or city is being changed
    if ((name && name !== cinema.name) || (city && city !== cinema.city)) {
      const existingCinema = await Cinema.findOne({
        _id: { $ne: req.params.id },
        name: new RegExp(`^${name || cinema.name}$`, 'i'),
        city: new RegExp(`^${city || cinema.city}$`, 'i'),
      });
      
      if (existingCinema) {
        return res.status(400).json({
          success: false,
          message: `Cinema "${name || cinema.name}" already exists in ${city || cinema.city}`,
        });
      }
    }
    
    // Update fields
    if (name) cinema.name = name;
    if (city) cinema.city = city;
    if (address) cinema.address = address;
    if (contact) cinema.contact = { ...cinema.contact, ...contact };
    if (facilities) cinema.facilities = facilities;
    if (coordinates) cinema.coordinates = coordinates;
    if (status) cinema.status = status;
    
    await cinema.save();
    
    res.json({
      success: true,
      message: 'Cinema updated successfully',
      data: cinema,
    });
  } catch (error) {
    console.error('Error updating cinema:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message),
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update cinema',
      error: error.message,
    });
  }
};

// @desc    Delete/Deactivate cinema
// @route   DELETE /api/cinema/:id
// @access  Admin
export const deleteCinema = async (req, res) => {
  try {
    const { permanent } = req.query;
    
    const cinema = await Cinema.findById(req.params.id);
    
    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: 'Cinema not found',
      });
    }
    
    // Check if cinema has active shows
    const activeShows = await Show.countDocuments({
      theatre: cinema.name,
      date: { $gte: new Date() },
    });
    
    if (activeShows > 0 && permanent === 'true') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete cinema. It has ${activeShows} active shows. Deactivate instead or delete shows first.`,
      });
    }
    
    if (permanent === 'true') {
      // Permanent delete - also delete all screens
      await Screen.deleteMany({ cinemaId: cinema._id });
      await cinema.deleteOne();
      
      return res.json({
        success: true,
        message: 'Cinema and all associated screens deleted permanently',
      });
    } else {
      // Soft delete - just deactivate
      cinema.status = 'inactive';
      await cinema.save();
      
      return res.json({
        success: true,
        message: 'Cinema deactivated successfully',
        data: cinema,
      });
    }
  } catch (error) {
    console.error('Error deleting cinema:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete cinema',
      error: error.message,
    });
  }
};

// @desc    Get cinema statistics
// @route   GET /api/cinema/:id/stats
// @access  Admin
export const getCinemaStats = async (req, res) => {
  try {
    const cinema = await Cinema.findById(req.params.id);
    
    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: 'Cinema not found',
      });
    }
    
    const screens = await Screen.find({ cinemaId: cinema._id });
    const activeScreens = screens.filter(s => s.status === 'active');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalShows = await Show.countDocuments({
      theatre: cinema.name,
    });
    
    const upcomingShows = await Show.countDocuments({
      theatre: cinema.name,
      date: { $gte: today },
    });
    
    res.json({
      success: true,
      data: {
        cinema,
        totalScreens: screens.length,
        activeScreens: activeScreens.length,
        totalCapacity: cinema.totalCapacity,
        totalShows,
        upcomingShows,
      },
    });
  } catch (error) {
    console.error('Error fetching cinema stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cinema statistics',
      error: error.message,
    });
  }
};
