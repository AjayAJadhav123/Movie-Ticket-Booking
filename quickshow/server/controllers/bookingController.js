import Stripe from 'stripe';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { validateBookingPrice } from '../services/pricingService.js';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import User from '../models/User.js';
import { inngest } from '../config/inngest.js';

// Initialize Cashfree SDK (Version >=5)
let cashfree = null;
const initCashfree = () => {
  const clientId = process.env.CASHFREE_APP_ID;
  const clientSecret = process.env.CASHFREE_SECRET_KEY;
  const environment = process.env.CASHFREE_ENV === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
  
  console.log('--- Cashfree Diagnostics ---');
  console.log(`CASHFREE_APP_ID: ${clientId ? (clientId === 'your_app_id' ? 'present (default placeholder)' : 'present (custom)') : 'absent'}`);
  console.log(`CASHFREE_SECRET_KEY: ${clientSecret ? (clientSecret === 'your_secret_key' ? 'present (default placeholder)' : 'present (custom)') : 'absent'}`);
  console.log(`CASHFREE_ENVIRONMENT: ${process.env.CASHFREE_ENV || 'not set (defaulting to SANDBOX)'}`);
  
  if (!cashfree && clientId && clientSecret) {
    cashfree = new Cashfree(environment, clientId, clientSecret);
  }
  
  // Note: cashfree-pg SDK doesn't expose the base URL directly on the instance easily, 
  // but it's internal to the environment setting.
  console.log(`Cashfree endpoint env: ${environment === CFEnvironment.PRODUCTION ? 'PRODUCTION' : 'SANDBOX'}`);
  console.log('----------------------------');
  
  return cashfree;
};

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

// CASHFREE - Dynamic UPI QR Code Payment Flow (Replaces Razorpay)
// Note: Razorpay functions removed - using Cashfree for UPI payments

// CASHFREE - Dynamic UPI QR Code Payment Flow
export const createCashfreeOrder = async (req, res) => {
  try {
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      console.error('Cashfree config missing:', {
        appId: !!process.env.CASHFREE_APP_ID,
        secretKey: !!process.env.CASHFREE_SECRET_KEY,
      });
      return res.status(503).json({
        success: false,
        message: 'Cashfree is not configured',
      });
    }

    const userId = req.userId || 'test_user_id';
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

    // ✅ SECURITY: Validate seat format
    const VALID_SEAT_FORMAT = /^[A-Z]{1,2}\d{1,3}$/; // e.g., A1, AA12, Z99
    const invalidSeats = seats.filter(seat => !VALID_SEAT_FORMAT.test(String(seat)));
    if (invalidSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid seat format. Expected format like A1, B5, etc. Got: ${invalidSeats.join(', ')}`,
      });
    }

    // ✅ SECURITY: Limit seats per booking (prevent abuse)
    if (seats.length > 12) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 12 seats per booking',
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
      user = new User({
        clerkId: userId,
        name: 'User',
        email: `user+${userId}@example.com`,
      });
      await user.save();
    }

    const pricePerSeat = show.price;
    const subtotalAmount = pricePerSeat * seats.length;
    const taxAmount = Math.round(subtotalAmount * 0.1 * 100) / 100;
    const totalAmount = subtotalAmount + taxAmount;
    
    console.log(`💰 Cashfree Booking: ${seats.length} seats × ₹${pricePerSeat} = ₹${subtotalAmount} + ₹${taxAmount} tax = ₹${totalAmount} INR`);

    // Calculate dynamic price with validation
    const pricingResult = await validateBookingPrice(showId, seats.length);
    let finalPricePerSeat = pricePerSeat; // Fallback
    let finalTotalAmount = totalAmount; // Fallback
    let demandInfo = null;

    if (pricingResult.success) {
      const pricing = pricingResult.data;
      finalPricePerSeat = pricing.dynamicPrice;
      finalTotalAmount = pricing.total;
      demandInfo = {
        basePrice: pricing.basePrice,
        dynamicPrice: pricing.dynamicPrice,
        demandScore: pricing.demandScore,
      };

      console.log(
        `💲 Dynamic Pricing Applied: ${seats.length} seats × ₹${finalPricePerSeat} = ₹${pricing.subtotal} + ₹${pricing.tax} tax = ₹${finalTotalAmount} INR (Demand Score: ${pricing.demandScore})`
      );
    } else {
      console.warn('Dynamic pricing unavailable, using base price:', pricingResult.error);
    }

    const booking = new Booking({
      userId,
      showId,
      seats,
      amount: finalTotalAmount,
      status: 'pending',
      paymentMethod: 'cashfree',
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

    // Emit Socket.IO event to notify other users that seats are locked
    const io = req.app.locals.io;
    if (io) {
      io.to(`show:${showId}`).emit('seats:locked', {
        seats,
        userId,
        timestamp: new Date(),
      });
    }

    // Initialize Cashfree
    try {
      const cfInstance = initCashfree();
      
      if (!cfInstance) {
        return res.status(503).json({
          success: false,
          message: 'Cashfree SDK not initialized. Check your credentials.',
        });
      }

      const orderId = `order_${booking._id.toString()}_${Date.now()}`;

      const request = {
        order_id: orderId,
        order_amount: finalTotalAmount,
        order_currency: 'INR',
        customer_details: {
          customer_id: userId,
          customer_email: user.email,
          customer_phone: '9000000000',
          customer_name: user.name || 'Customer',
        },
        order_meta: {
          return_url: `${process.env.FRONTEND_URL}/my-bookings?order_id=${orderId}`,
          notify_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/booking/cashfree-webhook`,
        },
        order_note: `QuickShow - ${show.movieId?.title} - Seats: ${seats.join(',')}`,
      };

      const response = await cfInstance.PGCreateOrder(request);

      console.log('✅ Cashfree order created:', orderId, 'Response:', response.data);

      const paymentSessionId = response.data?.payment_session_id || response?.data?.payment_session_id;

      await Booking.updateOne(
        { _id: booking._id },
        { cashfreeOrderId: orderId }
      );

      return res.status(200).json({
        success: true,
        data: {
          orderId: orderId,
          bookingId: booking._id.toString(),
          amount: finalTotalAmount,
          currency: 'INR',
          paymentSessionId: paymentSessionId,
          demandInfo,
        },
      });
    } catch (cashfreeError) {
      console.error('Cashfree SDK error:', {
        name: cashfreeError?.name,
        message: cashfreeError?.message,
        code: cashfreeError?.code,
        full: cashfreeError,
      });
      throw cashfreeError;
    }
  } catch (error) {
    console.error('Error creating Cashfree order:', {
      message: error?.message || 'Unknown error',
      code: error?.code,
      name: error?.name,
    });
    
    // ✅ SECURITY: Sanitize error message - don't leak internal errors
    let statusCode = error?.response?.status || 500;
    let errorMessage = 'Error creating payment order';
    
    // Only expose specific errors to client
    if (error?.response?.status === 400) {
      errorMessage = error?.response?.data?.message || 'Invalid payment request';
      statusCode = 400;
    } else if (error?.response?.status === 503) {
      errorMessage = 'Payment service temporarily unavailable';
      statusCode = 503;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
    });
  }
};

// Verify Cashfree payment
export const verifyCashfreePayment = async (req, res) => {
  try {
    if (!process.env.CASHFREE_SECRET_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Cashfree is not configured',
      });
    }

    const userId = req.userId;
    const { orderId, paymentId, bookingId } = req.body;

    if (!orderId || !paymentId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification fields',
      });
    }

    // Get booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify booking belongs to user
    if (booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized booking access',
      });
    }

    // Initialize Cashfree
    const cfInstance = initCashfree();
    
    if (!cfInstance) {
      return res.status(503).json({
        success: false,
        message: 'Cashfree SDK not initialized',
      });
    }

    // Get payment from Cashfree
    const paymentResponse = await cfInstance.PGOrderFetchPayment(orderId, paymentId);

    if (paymentResponse.data?.payment_status === 'SUCCESS') {
      if (booking.status !== 'confirmed') {
        booking.status = 'confirmed';
        booking.paymentId = paymentId;
        booking.cashfreeOrderId = orderId;
        await booking.save();

        // Mark seats as occupied
        const seats = booking.seats;
        const show = await Show.findById(booking.showId);

        if (show) {
          show.occupiedSeats = Array.from(
            new Set([...show.occupiedSeats, ...seats])
          );
          show.lockedSeats = show.lockedSeats.filter(
            (locked) => !seats.includes(locked.seatNumber)
          );
          await show.save();
        }

        // Send event
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

        console.log(`✅ Cashfree Payment Verified & Booking Confirmed: ${booking._id}`);
      }

      return res.status(200).json({
        success: true,
        data: {
          status: 'confirmed',
          bookingId: booking._id,
          amount: booking.amount,
          message: 'Payment verified and booking confirmed',
        },
      });
    } else {
      return res.status(200).json({
        success: true,
        data: {
          status: paymentResponse.data?.payment_status || 'FAILED',
          message: 'Payment not successful',
        },
      });
    }
  } catch (error) {
    console.error('Error verifying Cashfree payment:', error?.message);
    return res.status(500).json({
      success: false,
      message: 'Error verifying payment',
    });
  }
};

// Cashfree webhook with signature verification
export const handleCashfreeWebhook = async (req, res) => {
  try {
    // ✅ CRITICAL FIX: Verify Cashfree webhook signature
    const signature = req.headers['x-cf-signature'] || req.headers['x-cashfree-signature'];
    const timestamp = req.headers['x-cf-timestamp'] || req.headers['x-cashfree-timestamp'];
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_SECRET_KEY;

    if (!signature || !timestamp || !webhookSecret) {
      console.error('Webhook verification failed: missing signature, timestamp, or secret');
      return res.status(401).json({
        success: false,
        message: 'Webhook verification failed - missing headers or secret',
      });
    }

    // Verify HMAC-SHA256 signature
    const crypto = await import('crypto');
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const message = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(message)
      .digest('base64');

    if (signature !== expectedSignature) {
      console.error('Webhook signature verification FAILED');
      console.error(`Expected: ${expectedSignature}`);
      console.error(`Got: ${signature}`);
      return res.status(401).json({
        success: false,
        message: 'Webhook signature verification failed',
      });
    }

    console.log('✅ Cashfree webhook signature verified');

    const event = req.body;

    if (event.type === 'PAYMENT_SUCCESS' || event.type === 'PAYMENT_FAILED') {
      const orderId = event.data?.order?.order_id;
      const paymentStatus = event.data?.payment?.payment_status;

      const booking = await Booking.findOne({ cashfreeOrderId: orderId });

      if (!booking) {
        console.warn(`Booking not found for order: ${orderId}`);
        return res.status(200).json({ success: true });
      }

      if (paymentStatus === 'SUCCESS' && booking.status === 'pending') {
        booking.status = 'confirmed';
        booking.paymentId = event.data?.payment?.cf_payment_id;
        await booking.save();

        const seats = booking.seats;
        const show = await Show.findById(booking.showId);

        if (show) {
          show.occupiedSeats = Array.from(
            new Set([...show.occupiedSeats, ...seats])
          );
          show.lockedSeats = show.lockedSeats.filter(
            (locked) => !seats.includes(locked.seatNumber)
          );
          await show.save();

          // Emit Socket.IO event to notify other users that seats are now occupied
          const io = req.app.locals.io;
          if (io) {
            io.to(`show:${show._id.toString()}`).emit('seats:occupied', {
              seats,
              userId: booking.userId,
              timestamp: new Date(),
            });
          }
        }

        console.log(`✅ Webhook: Payment Confirmed - Booking ${booking._id}`);
      } else if (paymentStatus === 'FAILED' && booking.status === 'pending') {
        booking.status = 'failed';
        await booking.save();

        const seats = booking.seats;
        const show = await Show.findById(booking.showId);

        if (show) {
          show.lockedSeats = show.lockedSeats.filter(
            (locked) => !seats.includes(locked.seatNumber)
          );
          await show.save();

          // Emit Socket.IO event to notify other users that locked seats are now released
          const io = req.app.locals.io;
          if (io) {
            io.to(`show:${show._id.toString()}`).emit('seats:released', {
              seats,
              userId: booking.userId,
              timestamp: new Date(),
            });
          }
        }

        console.log(`❌ Webhook: Payment Failed - Booking ${booking._id}`);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling Cashfree webhook:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error processing webhook',
    });
  }
};

// End of Cashfree exports

export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.userId !== req.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Release seats
    await Show.updateOne(
      { _id: booking.showId },
      { $pull: { lockedSeats: { seatId: { $in: booking.seats } } } }
    );

    return res.status(200).json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({ success: false, message: 'Error cancelling booking' });
  }
};
