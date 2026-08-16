import Stripe from 'stripe';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import User from '../models/User.js';
import { inngest } from '../config/inngest.js';

export const createStripeSession = async (req, res) => {
  try {
    // Initialize Stripe inside the function to ensure env vars are loaded
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured',
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    const userId = req.userId;
    const { showId, seats } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!showId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Show ID and seats are required',
      });
    }

    const show = await Show.findById(showId).populate('movieId');

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    const occupiedSeatSet = new Set(show.occupiedSeats);
    const selectedSeatSet = new Set(seats);

    for (const seat of selectedSeatSet) {
      if (occupiedSeatSet.has(seat)) {
        return res.status(409).json({
          success: false,
          message: 'One or more selected seats are already occupied',
        });
      }
    }

    // Get user, create if doesn't exist
    let user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      // Create a basic user entry from Clerk userId
      user = new User({
        clerkId: userId,
        name: 'User',
        email: `user+${userId}@example.com`,
      });
      await user.save();
    }

    const pricePerSeat = show.price;
    const subtotalAmount = pricePerSeat * seats.length;
    const taxAmount = Math.round(subtotalAmount * 0.1 * 100) / 100; // 10% tax
    const totalAmount = subtotalAmount + taxAmount;
    
    console.log(`💰 Booking Calculation: ${seats.length} seats × ₹${pricePerSeat} = ₹${subtotalAmount} + ₹${taxAmount} tax = ₹${totalAmount} total`);

    const booking = new Booking({
      userId,
      showId,
      seats,
      amount: totalAmount,
      status: 'pending',
      movieTitle: show.movieId?.title || 'Unknown Movie',
      showDate: show.date,
      showTime: show.time,
    });

    await booking.save();

    const lockedSeatsEntry = seats.map((seat) => ({
      seatNumber: seat,
      userId,
      bookedAt: new Date(),
    }));

    await Show.updateOne(
      { _id: showId },
      {
        $push: { lockedSeats: { $each: lockedSeatsEntry } },
      }
    );

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'upi'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `${show.movieId?.title || 'Movie'} - Seats: ${seats.join(', ')}`,
              description: `Show: ${show.time} on ${show.date.toDateString()}`,
            },
            unit_amount: Math.round(pricePerSeat * 100),
          },
          quantity: seats.length,
        },
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'Taxes & Fees (10%)',
              description: 'Service tax and booking fees',
            },
            unit_amount: Math.round(taxAmount * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      success_url: `${process.env.FRONTEND_URL}/my-bookings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/seat-layout/${showId}`,
      metadata: {
        bookingId: booking._id.toString(),
        showId,
        userId,
        seats: JSON.stringify(seats),
      },
    });

    await Booking.updateOne(
      { _id: booking._id },
      { stripeSessionId: session.id }
    );

    return res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
        bookingId: booking._id,
        clientSecret: session.client_secret,
      },
    });
  } catch (error) {
    console.error('Error creating Stripe session:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error creating payment session',
    });
  }
};

// New endpoint to verify payment status from Stripe directly
export const verifyPaymentSession = async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured',
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { sessionId, bookingId } = req.query;

    if (!sessionId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and booking ID are required',
      });
    }

    // Get booking to verify ownership
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify this session belongs to this booking
    if (booking.stripeSessionId !== sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID does not match booking',
      });
    }

    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Session status reference:
    // - 'open': Checkout session still in progress
    // - 'complete': Checkout completed (payment may be processing)
    // - 'expired': Session expired without completion

    if (session.status === 'complete' && session.payment_status === 'paid') {
      // Payment is confirmed
      if (booking.status !== 'confirmed') {
        // This handles case where webhook might have failed/delayed
        booking.status = 'confirmed';
        booking.paymentId = session.payment_intent;
        await booking.save();

        const seats = JSON.parse(session.metadata.seats);
        const show = await Show.findById(session.metadata.showId);

        if (show) {
          show.occupiedSeats = Array.from(
            new Set([...show.occupiedSeats, ...seats])
          );
          show.lockedSeats = show.lockedSeats.filter(
            (locked) => !seats.includes(locked.seatNumber)
          );
          await show.save();
        }

        console.log(`✅ Session Verified & Booking Confirmed: ${booking._id}`);
      }

      return res.status(200).json({
        success: true,
        data: {
          status: 'paid',
          bookingStatus: booking.status,
          amount: booking.amount,
        },
      });
    } else if (session.payment_status === 'unpaid') {
      return res.status(200).json({
        success: true,
        data: {
          status: 'unpaid',
          bookingStatus: booking.status,
          message: 'Payment is still processing',
        },
      });
    } else {
      return res.status(200).json({
        success: true,
        data: {
          status: session.payment_status,
          bookingStatus: booking.status,
        },
      });
    }
  } catch (error) {
    console.error('Error verifying payment session:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error verifying payment session',
    });
  }
};

export const handleStripeWebhook = async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({
      success: false,
      message: 'Stripe is not configured',
    });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({
      success: false,
      message: 'Missing signature or webhook secret',
    });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody || JSON.stringify(req.body),
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({
      success: false,
      message: 'Webhook signature verification failed',
    });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const booking = await Booking.findById(session.metadata.bookingId);

      if (!booking) {
        console.warn(
          `Booking not found for session: ${session.metadata.bookingId}`
        );
        return res.status(200).json({ success: true });
      }

      if (booking.status === 'confirmed') {
        console.log(
          `Booking already confirmed: ${booking._id}, skipping duplicate event`
        );
        return res.status(200).json({ success: true });
      }

      booking.status = 'confirmed';
      booking.paymentId = session.payment_intent;
      await booking.save();

      console.log(`✅ Payment Confirmed: Booking ${booking._id} - Amount: ₹${booking.amount} INR - Status: ${booking.status}`);

      const seats = JSON.parse(session.metadata.seats);
      const show = await Show.findById(session.metadata.showId);

      if (show) {
        show.occupiedSeats = Array.from(
          new Set([...show.occupiedSeats, ...seats])
        );
        show.lockedSeats = show.lockedSeats.filter(
          (locked) => !seats.includes(locked.seatNumber)
        );
        await show.save();
      }

      await inngest.send({
        name: 'booking/created',
        data: {
          bookingId: booking._id.toString(),
          userId: booking.userId,
          movieTitle: booking.movieTitle,
          showDate: booking.showDate,
          showTime: booking.showTime,
          seats: seats,
          amount: booking.amount,
        },
      });

      console.log(`✅ Booking confirmed: ${booking._id}`);
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      const booking = await Booking.findById(session.metadata.bookingId);

      if (booking && booking.status === 'pending') {
        booking.status = 'cancelled';
        await booking.save();

        const seats = JSON.parse(session.metadata.seats);
        const show = await Show.findById(session.metadata.showId);

        if (show) {
          show.lockedSeats = show.lockedSeats.filter(
            (locked) => !seats.includes(locked.seatNumber)
          );
          await show.save();
        }

        console.log(`⏱️ Booking expired and cancelled: ${booking._id}`);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing webhook',
    });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const bookings = await Booking.find({ userId })
      .populate({
        path: 'showId',
        populate: 'movieId',
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user bookings',
    });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const userId = req.userId;
    const { bookingId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const booking = await Booking.findById(bookingId).populate({
      path: 'showId',
      populate: 'movieId',
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify ownership: ensure the booking belongs to the authenticated user
    if (booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this booking',
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching booking',
    });
  }
};

export const getAdminBookings = async (req, res) => {
  try {
    const { page = 1, status, movieId } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (movieId) {
      const show = await Show.find({ movieId });
      const showIds = show.map((s) => s._id);
      query.showId = { $in: showIds };
    }

    const bookings = await Booking.find(query)
      .populate({
        path: 'showId',
        populate: 'movieId',
      })
      .limit(50)
      .skip((page - 1) * 50)
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / 50),
      },
    });
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching admin bookings',
    });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const totalRevenue = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalBookings = await Booking.countDocuments();

    const activeShows = await Show.countDocuments({
      date: { $gte: new Date() },
    });

    const registeredUsers = await User.countDocuments();

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalBookings,
        activeShows,
        registeredUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching admin stats',
    });
  }
};
