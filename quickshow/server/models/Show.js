import mongoose from 'mongoose';

const showSchema = new mongoose.Schema(
  {
    // MongoDB Movie reference (optional - for movies synced to DB)
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      index: true,
    },
    // TMDB ID (required - works even if movie not in MongoDB)
    tmdbId: {
      type: Number,
      required: true,
      index: true,
    },
    // Movie title (denormalized for quick display without lookup)
    movieTitle: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    time: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
    },
    theatre: {
      type: String,
      required: true,
      default: 'Theatre TBD',
    },
    screen: {
      type: String,
      required: true,
      default: 'Screen 1',
    },
    screenType: {
      type: String,
      enum: ['Standard', 'Premium', 'IMAX', 'Recliner', '4DX'],
      default: 'Standard',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    totalSeats: {
      type: Number,
      default: 100,
    },
    rows: {
      type: Number,
      default: 10,
    },
    seatsPerRow: {
      type: Number,
      default: 10,
    },
    occupiedSeats: {
      type: [String],
      default: [],
    },
    seatLayout: {
      type: [
        {
          row: String,
          number: Number,
          seatNumber: String,
          type: {
            type: String,
            default: 'Standard',
          },
          isAvailable: {
            type: Boolean,
            default: true,
          },
        }
      ],
      default: [],
    },
    lockedSeats: [
      {
        seatNumber: String,
        userId: String,
        lockedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

showSchema.index({ tmdbId: 1, date: 1, time: 1, theatre: 1, screen: 1 });
showSchema.index({ date: 1, theatre: 1 });

const Show = mongoose.model('Show', showSchema);
export default Show;
