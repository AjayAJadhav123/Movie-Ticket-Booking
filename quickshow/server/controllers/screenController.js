import Screen from '../models/Screen.js';
import Cinema from '../models/Cinema.js';
import Show from '../models/Show.js';

// @desc    Get all screens for a cinema
// @route   GET /api/screen/cinema/:cinemaId
// @access  Public
export const getScreensByCinema = async (req, res) => {
  try {
    const { cinemaId } = req.params;
    const { status } = req.query;
    
    const filter = { cinemaId };
    if (status) {
      filter.status = status;
    }
    
    const screens = await Screen.find(filter)
      .populate('cinemaId', 'name city')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: screens,
    });
  } catch (error) {
    console.error('Error fetching screens:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch screens',
      });
  }
};

// @desc    Get screen by ID
// @route   GET /api/screen/:id
// @access  Public
export const getScreenById = async (req, res) => {
  try {
    const screen = await Screen.findById(req.params.id).populate('cinemaId', 'name city address');
    
    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found',
      });
    }
    
    res.json({
      success: true,
      data: screen,
    });
  } catch (error) {
    console.error('Error fetching screen:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch screen',
      });
  }
};

// @desc    Create new screen
// @route   POST /api/screen
// @access  Admin
export const createScreen = async (req, res) => {
  try {
    const { cinemaId, name, screenType, rows, seatsPerRow, seatLayout, facilities, priceMultiplier } = req.body;
    
    // Validation
    if (!cinemaId || !name || !rows || !seatsPerRow) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: cinemaId, name, rows, seatsPerRow',
      });
    }
    
    // Verify cinema exists
    const cinema = await Cinema.findById(cinemaId);
    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: 'Cinema not found',
      });
    }
    
    // Check for duplicate screen name in the same cinema
    const existingScreen = await Screen.findOne({
      cinemaId,
      name: new RegExp(`^${name}$`, 'i'),
    });
    
    if (existingScreen) {
      return res.status(400).json({
        success: false,
        message: `Screen "${name}" already exists in this cinema`,
      });
    }
    
    // Calculate total capacity
    let totalCapacity = rows * seatsPerRow;
    if (seatLayout && seatLayout.length > 0) {
      totalCapacity = seatLayout.filter(seat => seat.isAvailable).length;
    }
    
    const screen = await Screen.create({
      cinemaId,
      name,
      screenType: screenType || 'Standard',
      rows,
      seatsPerRow,
      seatLayout: seatLayout || [],
      totalCapacity,
      facilities: facilities || [],
      priceMultiplier: priceMultiplier || 1.0,
      status: 'active',
    });
    
    await screen.populate('cinemaId', 'name city');
    
    res.status(201).json({
      success: true,
      message: 'Screen created successfully',
      data: screen,
    });
  } catch (error) {
    console.error('Error creating screen:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message),
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Screen with this name already exists in this cinema',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create screen',
      });
  }
};

// @desc    Update screen
// @route   PUT /api/screen/:id
// @access  Admin
export const updateScreen = async (req, res) => {
  try {
    const { name, screenType, rows, seatsPerRow, seatLayout, facilities, priceMultiplier, status } = req.body;
    
    const screen = await Screen.findById(req.params.id);
    
    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found',
      });
    }
    
    // Check for duplicate name if name is being changed
    if (name && name !== screen.name) {
      const existingScreen = await Screen.findOne({
        _id: { $ne: req.params.id },
        cinemaId: screen.cinemaId,
        name: new RegExp(`^${name}$`, 'i'),
      });
      
      if (existingScreen) {
        return res.status(400).json({
          success: false,
          message: `Screen "${name}" already exists in this cinema`,
        });
      }
    }
    
    // Update fields
    if (name) screen.name = name;
    if (screenType) screen.screenType = screenType;
    if (rows) screen.rows = rows;
    if (seatsPerRow) screen.seatsPerRow = seatsPerRow;
    if (seatLayout) screen.seatLayout = seatLayout;
    if (facilities) screen.facilities = facilities;
    if (priceMultiplier !== undefined) screen.priceMultiplier = priceMultiplier;
    if (status) screen.status = status;
    
    await screen.save();
    await screen.populate('cinemaId', 'name city');
    
    res.json({
      success: true,
      message: 'Screen updated successfully',
      data: screen,
    });
  } catch (error) {
    console.error('Error updating screen:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message),
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Screen with this name already exists in this cinema',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update screen',
      });
  }
};

// @desc    Delete screen
// @route   DELETE /api/screen/:id
// @access  Admin
export const deleteScreen = async (req, res) => {
  try {
    const { permanent } = req.query;
    
    const screen = await Screen.findById(req.params.id);
    
    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found',
      });
    }
    
    // Check if screen has active shows
    const cinema = await Cinema.findById(screen.cinemaId);
    const activeShows = await Show.countDocuments({
      theatre: cinema.name,
      screen: screen.name,
      date: { $gte: new Date() },
    });
    
    if (activeShows > 0 && permanent === 'true') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete screen. It has ${activeShows} active shows. Deactivate instead or delete shows first.`,
      });
    }
    
    if (permanent === 'true') {
      await screen.deleteOne();
      
      return res.json({
        success: true,
        message: 'Screen deleted permanently',
      });
    } else {
      screen.status = 'inactive';
      await screen.save();
      
      return res.json({
        success: true,
        message: 'Screen deactivated successfully',
        data: screen,
      });
    }
  } catch (error) {
    console.error('Error deleting screen:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete screen',
      });
  }
};

// @desc    Get screen layout
// @route   GET /api/screen/:id/layout
// @access  Public
export const getScreenLayout = async (req, res) => {
  try {
    const screen = await Screen.findById(req.params.id).select('seatLayout rows seatsPerRow totalCapacity');
    
    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        seatLayout: screen.seatLayout,
        rows: screen.rows,
        seatsPerRow: screen.seatsPerRow,
        totalCapacity: screen.totalCapacity,
      },
    });
  } catch (error) {
    console.error('Error fetching screen layout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch screen layout',
      });
  }
};

// @desc    Update seat layout
// @route   PUT /api/screen/:id/layout
// @access  Admin
export const updateSeatLayout = async (req, res) => {
  try {
    const { seatLayout } = req.body;
    
    if (!seatLayout || !Array.isArray(seatLayout)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid seat layout array',
      });
    }
    
    const screen = await Screen.findById(req.params.id);
    
    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found',
      });
    }
    
    screen.seatLayout = seatLayout;
    screen.totalCapacity = seatLayout.filter(seat => seat.isAvailable).length;
    
    await screen.save();
    
    res.json({
      success: true,
      message: 'Seat layout updated successfully',
      data: screen,
    });
  } catch (error) {
    console.error('Error updating seat layout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update seat layout',
      });
  }
};
