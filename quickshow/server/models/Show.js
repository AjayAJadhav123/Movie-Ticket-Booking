import mongoose from 'mongoose';

const showSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true,
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
    theatre: {
      type: String,
      default: 'Theatre TBD',
    },
    screen: {
      type: String,
      default: 'Screen TBD',
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
    occupiedSeats: {
      type: [String],
      default: [],
    },
    lockedSeats: [
      {
        seatNumber: String,
        userId: String,
        bookedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

showSchema.index({ movieId: 1, date: 1, time: 1 }, { unique: true });

const Show = mongoose.model('Show', showSchema);
export default Show;
