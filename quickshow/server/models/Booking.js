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

// TTL index for automatic deletion of expired bookings (10 minutes)
bookingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
