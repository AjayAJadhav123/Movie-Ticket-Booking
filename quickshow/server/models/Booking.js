import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
      index: true,
    },
    seats: {
      type: [String],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'razorpay', 'cashfree'],
      default: 'cashfree',
    },
    paymentId: {
      type: String,
      default: null,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    stripeSessionId: {
      type: String,
      default: null,
    },
    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },
    cashfreeOrderId: {
      type: String,
      default: null,
      index: true,
    },
    movieTitle: {
      type: String,
      default: '',
    },
    showDate: {
      type: Date,
      default: null,
    },
    showTime: {
      type: String,
      default: '',
    },
    emailSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// TTL index: auto-delete expired bookings using the expiresAt field
// Confirmed bookings should have expiresAt set to null/far future to prevent deletion
bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for querying user bookings by status
bookingSchema.index({ userId: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
