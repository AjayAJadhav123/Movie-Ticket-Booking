import mongoose from 'mongoose';

const cinemaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Cinema name is required'],
      trim: true,
      minlength: [2, 'Cinema name must be at least 2 characters'],
      maxlength: [100, 'Cinema name cannot exceed 100 characters'],
      index: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    contact: {
      phone: {
        type: String,
        required: [true, 'Phone number is required'],
        validate: {
          validator: function(v) {
            return /^[\d\s\-\+\(\)]+$/.test(v);
          },
          message: 'Invalid phone number format',
        },
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        validate: {
          validator: function(v) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: 'Invalid email format',
        },
      },
    },
    facilities: {
      type: [String],
      default: [],
      validate: {
        validator: function(arr) {
          const validFacilities = [
            'Parking',
            'Food Court',
            'Wheelchair Access',
            'Recliner Seats',
            '3D',
            'IMAX',
            '4DX',
            'Dolby Atmos',
            'Air Conditioning',
            'Online Booking',
          ];
          return arr.every(facility => validFacilities.includes(facility));
        },
        message: 'Invalid facility provided',
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
      index: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        validate: {
          validator: function(v) {
            return v >= -90 && v <= 90;
          },
          message: 'Latitude must be between -90 and 90',
        },
      },
      longitude: {
        type: Number,
        validate: {
          validator: function(v) {
            return v >= -180 && v <= 180;
          },
          message: 'Longitude must be between -180 and 180',
        },
      },
    },
    totalScreens: {
      type: Number,
      default: 0,
      min: [0, 'Total screens cannot be negative'],
    },
    totalCapacity: {
      type: Number,
      default: 0,
      min: [0, 'Total capacity cannot be negative'],
    },
  },
  { timestamps: true }
);

// Compound index for unique cinema name per city
cinemaSchema.index({ name: 1, city: 1 }, { unique: true });

// Index for location-based queries
cinemaSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

const Cinema = mongoose.model('Cinema', cinemaSchema);
export default Cinema;
