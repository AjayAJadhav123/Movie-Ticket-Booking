import Stripe from 'stripe';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import User from '../models/User.js';
import { inngest } from '../config/inngest.js';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export const createStripeSession = async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured. Add STRIPE_SECRET_KEY to server/.env.',
      });
    }

    const userId = req.auth?.userId;
    const { showId, seats, seatType } = req.body;

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

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const pricePerSeat = show.price;
    const totalAmount = pricePerSeat * seats.length;

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
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${show.movieId?.title || 'Movie'} - Seats: ${seats.join(', ')}`,
              description: `Show: ${show.time} on ${show.date.toDateString()}`,
            },
            unit_amount: pricePerSeat * 100,
          },
          quantity: seats.length,
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
        bookingId: booking._id,
        clientSecret: session.client_secret,
      },
    });
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating payment session',
    });
  }
};

export const handleStripeWebhook = async (req, res) => {
  if (!stripe || !process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({
      success: false,
      message: 'Stripe is not configured',
    });
  }

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
    const userId = req.auth?.userId;

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
    const userId = req.auth?.userId;
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
