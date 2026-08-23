import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema({
  row: {
    type: String,
    required: true,
  },
  number: {
    type: Number,
    required: true,
  },
  seatNumber: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Standard', 'Premium', 'Recliner', 'VIP', 'Wheelchair'],
    default: 'Standard',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

const screenSchema = new mongoose.Schema(
  {
    cinemaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cinema',
      required: [true, 'Cinema reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Screen name is required'],
      trim: true,
      minlength: [1, 'Screen name must be at least 1 character'],
      maxlength: [50, 'Screen name cannot exceed 50 characters'],
    },
    screenType: {
      type: String,
      enum: ['Standard', 'Premium', 'IMAX', 'Recliner', '4DX', 'Dolby Atmos'],
      default: 'Standard',
    },
    rows: {
      type: Number,
      required: [true, 'Number of rows is required'],
      min: [1, 'Rows must be at least 1'],
      max: [50, 'Rows cannot exceed 50'],
    },
    seatsPerRow: {
      type: Number,
      required: [true, 'Seats per row is required'],
      min: [1, 'Seats per row must be at least 1'],
      max: [100, 'Seats per row cannot exceed 100'],
    },
    seatLayout: {
      type: [seatSchema],
      default: [],
    },
    totalCapacity: {
      type: Number,
      required: true,
      min: [1, 'Total capacity must be at least 1'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
      index: true,
    },
    facilities: {
      type: [String],
      default: [],
      validate: {
        validator: function(arr) {
          const validFacilities = [
            '3D',
            'IMAX',
            '4DX',
            'Dolby Atmos',
            'Laser Projection',
            'Recliner Seats',
            'Premium Sound',
            'Air Conditioning',
          ];
          return arr.every(facility => validFacilities.includes(facility));
        },
        message: 'Invalid facility provided',
      },
    },
    priceMultiplier: {
      type: Number,
      default: 1.0,
      min: [0.5, 'Price multiplier cannot be less than 0.5'],
      max: [5.0, 'Price multiplier cannot exceed 5.0'],
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate screen names within the same cinema
screenSchema.index({ cinemaId: 1, name: 1 }, { unique: true });

// Pre-save hook to generate seat layout if not provided
screenSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('rows') || this.isModified('seatsPerRow')) {
    // Only auto-generate if seatLayout is empty
    if (!this.seatLayout || this.seatLayout.length === 0) {
      const layout = [];
      const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
      for (let i = 0; i < this.rows; i++) {
        const rowLetter = i < 26 ? rowLetters[i] : `${rowLetters[Math.floor(i / 26) - 1]}${rowLetters[i % 26]}`;
        
        for (let j = 1; j <= this.seatsPerRow; j++) {
          layout.push({
            row: rowLetter,
            number: j,
            seatNumber: `${rowLetter}${j}`,
            type: 'Standard',
            isAvailable: true,
          });
        }
      }
      
      this.seatLayout = layout;
    }
  }
  
  // Always update total capacity based on available seats
  if (this.seatLayout && this.seatLayout.length > 0) {
    this.totalCapacity = this.seatLayout.filter(seat => seat.isAvailable).length;
  }
  next();
});

// Method to update cinema's total screens and capacity
screenSchema.post('save', async function() {
  const Cinema = mongoose.model('Cinema');
  const screens = await mongoose.model('Screen').find({ cinemaId: this.cinemaId, status: 'active' });
  
  const totalCapacity = screens.reduce((sum, screen) => sum + screen.totalCapacity, 0);
  
  await Cinema.findByIdAndUpdate(this.cinemaId, {
    totalScreens: screens.length,
    totalCapacity: totalCapacity,
  });
});

// Update cinema stats when screen is deleted
screenSchema.post('remove', async function() {
  const Cinema = mongoose.model('Cinema');
  const screens = await mongoose.model('Screen').find({ cinemaId: this.cinemaId, status: 'active' });
  
  const totalCapacity = screens.reduce((sum, screen) => sum + screen.totalCapacity, 0);
  
  await Cinema.findByIdAndUpdate(this.cinemaId, {
    totalScreens: screens.length,
    totalCapacity: totalCapacity,
  });
});

const Screen = mongoose.model('Screen', screenSchema);
export default Screen;
