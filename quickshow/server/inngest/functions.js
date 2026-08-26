import { inngest } from '../config/inngest.js';
import { sendEmail, isEmailConfigured } from '../services/emailService.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';

export const sendBookingConfirmationEmail = inngest.createFunction(
  { id: 'send-booking-confirmation' },
  { event: 'booking/created' },
  async ({ event }) => {
    try {
      // Check if email service is configured
      if (!isEmailConfigured()) {
        console.warn('Email service not configured, skipping email send');
        return { success: true, emailSent: false, reason: 'Email service not configured' };
      }

      const { bookingId, userId, movieTitle, showDate, showTime, seats, amount } =
        event.data;

      // Check if email has already been sent for this booking
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        console.error(`Booking not found: ${bookingId}`);
        return { error: 'Booking not found' };
      }

      // Only send confirmation for confirmed bookings
      if (booking.status !== 'confirmed') {
        console.log(
          `Booking status is ${booking.status}, not confirmed. Skipping email for booking ${bookingId}`
        );
        return { success: true, emailSent: false, reason: 'Booking not confirmed' };
      }

      if (booking.emailSent) {
        console.log(`Email already sent for booking: ${bookingId}, skipping duplicate`);
        return { success: true, duplicate: true };
      }

      const user = await User.findOne({ clerkId: userId });

      if (!user) {
        console.error(`User not found: ${userId}`);
        return { error: 'User not found' };
      }

      const seatsText = seats.join(', ');
      const formattedDate = new Date(showDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      // amount is stored in rupees (not paise)
      const formattedAmount = Number(amount).toFixed(2);

      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px;">
          <div style="background-color: white; border-radius: 10px; padding: 30px; text-align: center;">
            <h1 style="color: #667eea; margin: 0 0 10px 0; font-size: 28px;">🎬 QuickShow</h1>
            <h2 style="color: #333; margin: 20px 0; font-size: 24px;">Booking Confirmed! 🎉</h2>
            
            <p style="color: #666; font-size: 16px; margin-bottom: 30px;">Hi <strong>${user.name}</strong>,</p>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Your ticket booking has been confirmed. Here are your booking details:</p>
            
            <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 25px; border-radius: 8px; margin: 20px 0; text-align: left;">
              <div style="border-bottom: 2px solid #667eea; padding-bottom: 15px; margin-bottom: 15px;">
                <p style="margin: 5px 0; font-size: 14px;">
                  <span style="color: #667eea; font-weight: bold;">🎬 Movie:</span> <span style="color: #333; font-weight: bold; font-size: 16px;">${movieTitle}</span>
                </p>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                  <p style="margin: 0 0 5px 0; font-size: 12px; color: #667eea; font-weight: bold;">📅 DATE</p>
                  <p style="margin: 0; font-size: 14px; color: #333;">${formattedDate}</p>
                </div>
                <div>
                  <p style="margin: 0 0 5px 0; font-size: 12px; color: #667eea; font-weight: bold;">🕐 TIME</p>
                  <p style="margin: 0; font-size: 14px; color: #333;">${showTime}</p>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="margin: 0 0 5px 0; font-size: 12px; color: #667eea; font-weight: bold;">🎫 SEATS</p>
                  <p style="margin: 0; font-size: 14px; color: #333; font-weight: bold;">${seatsText}</p>
                </div>
                <div>
                  <p style="margin: 0 0 5px 0; font-size: 12px; color: #667eea; font-weight: bold;">💰 AMOUNT</p>
                  <p style="margin: 0; font-size: 14px; color: #333; font-weight: bold;">₹${formattedAmount}</p>
                </div>
              </div>
            </div>

            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                <strong>Booking ID:</strong> ${bookingId}
              </p>
              ${booking.paymentId ? `<p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>Payment ID:</strong> ${booking.paymentId}</p>` : ''}
            </div>

            <div style="background-color: #fffbea; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="color: #856404; font-size: 13px; margin: 0;">
                ⏰ Please arrive at least 15 minutes before the show starts.
              </p>
            </div>

            <p style="color: #666; font-size: 14px; margin: 30px 0 10px 0;">Thank you for choosing QuickShow! 🍿</p>
            <p style="color: #999; font-size: 12px; margin: 0;">Have a fantastic movie experience!</p>
          </div>

          <div style="text-align: center; color: white; margin-top: 20px; font-size: 12px;">
            <p style="margin: 5px 0;">© 2024 QuickShow. All rights reserved.</p>
            <p style="margin: 5px 0;">This is an automated confirmation email. Please do not reply.</p>
          </div>
        </div>
      `;

      try {
        const result = await sendEmail(user.email, `✅ Booking Confirmation - ${movieTitle}`, html);

        if (result.success) {
          // Mark email as sent in the booking document
          await Booking.updateOne(
            { _id: bookingId },
            { emailSent: true }
          );

          console.log(
            `✅ Booking confirmation email sent to ${user.email} for booking ${bookingId}`
          );
          return { success: true, emailSent: true };
        } else {
          console.error(
            `Failed to send confirmation email to ${user.email}: ${result.error}`
          );
          return { success: true, emailSent: false, emailError: result.error };
        }
      } catch (emailError) {
        console.error(
          `Exception sending confirmation email to ${user.email}:`,
          emailError.message
        );
        return { success: true, emailSent: false, emailError: emailError.message };
      }
    } catch (error) {
      console.error('Error in sendBookingConfirmationEmail:', error.message);
      return { };
    }
  }
);

export const sendShowReminderEmail = inngest.createFunction(
  { id: 'send-show-reminder' },
  { event: 'show/reminder' },
  async ({ event }) => {
    try {
      if (!isEmailConfigured()) {
        console.warn('Email service not configured, skipping reminder email');
        return { success: true, emailSent: false, reason: 'Email service not configured' };
      }

      const { userId, movieTitle, showDate, showTime, seats } = event.data;

      const user = await User.findOne({ clerkId: userId });

      if (!user) {
        console.error(`User not found: ${userId}`);
        return { error: 'User not found' };
      }

      const formattedDate = new Date(showDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px;">
          <div style="background-color: white; border-radius: 10px; padding: 30px; text-align: center;">
            <h1 style="color: #667eea; margin: 0 0 10px 0; font-size: 28px;">🎬 QuickShow</h1>
            <h2 style="color: #333; margin: 20px 0; font-size: 22px;">Show Reminder 🎞️</h2>
            
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Hi <strong>${user.name}</strong>,</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Your movie is starting soon! Don't be late!</p>
            
            <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 25px; border-radius: 8px; margin: 20px 0; text-align: left;">
              <p style="margin: 5px 0 15px 0; font-size: 14px;">
                <span style="color: #667eea; font-weight: bold;">🎬 Movie:</span> <span style="color: #333; font-weight: bold; font-size: 16px;">${movieTitle}</span>
              </p>
              <p style="margin: 5px 0; font-size: 14px;">
                <span style="color: #667eea; font-weight: bold;">📅 Date:</span> <span style="color: #333;">${formattedDate}</span>
              </p>
              <p style="margin: 5px 0; font-size: 14px;">
                <span style="color: #667eea; font-weight: bold;">🕐 Time:</span> <span style="color: #333;">${showTime}</span>
              </p>
              <p style="margin: 5px 0; font-size: 14px;">
                <span style="color: #667eea; font-weight: bold;">🎫 Your Seats:</span> <span style="color: #333; font-weight: bold;">${seats.join(', ')}</span>
              </p>
            </div>

            <p style="color: #666; font-size: 14px; margin: 20px 0;">Head to the cinema now to grab your tickets!</p>
          </div>
        </div>
      `;

      const result = await sendEmail(user.email, `⏰ Reminder: ${movieTitle} is starting soon!`, html);

      if (result.success) {
        console.log(`✅ Show reminder email sent to ${user.email}`);
        return { success: true, emailSent: true };
      } else {
        console.error(`Failed to send reminder email to ${user.email}: ${result.error}`);
        return { success: false, emailError: result.error };
      }
    } catch (error) {
      console.error('Error in sendShowReminderEmail:', error.message);
      return { };
    }
  }
);

export const sendNewShowNotification = inngest.createFunction(
  { id: 'send-new-show-notification' },
  { event: 'show/published' },
  async ({ event }) => {
    try {
      if (!isEmailConfigured()) {
        console.warn('Email service not configured, skipping new show notification');
        return { success: true, usersNotified: 0, reason: 'Email service not configured' };
      }

      const { movieTitle, showDate, showTime, genre } = event.data;

      const users = await User.find();

      if (users.length === 0) {
        console.log('No users found for new show notification');
        return { success: true, usersNotified: 0 };
      }

      const formattedDate = new Date(showDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px;">
          <div style="background-color: white; border-radius: 10px; padding: 30px; text-align: center;">
            <h1 style="color: #667eea; margin: 0 0 10px 0; font-size: 28px;">🎬 QuickShow</h1>
            <h2 style="color: #333; margin: 20px 0; font-size: 22px;">New Show Available! 🍿</h2>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">A new movie show has been added to QuickShow.</p>
            
            <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 25px; border-radius: 8px; margin: 20px 0; text-align: left;">
              <p style="margin: 5px 0 15px 0; font-size: 14px;">
                <span style="color: #667eea; font-weight: bold;">🎬 Movie:</span> <span style="color: #333; font-weight: bold; font-size: 16px;">${movieTitle}</span>
              </p>
              <p style="margin: 5px 0; font-size: 14px;">
                <span style="color: #667eea; font-weight: bold;">📅 Date:</span> <span style="color: #333;">${formattedDate}</span>
              </p>
              <p style="margin: 5px 0; font-size: 14px;">
                <span style="color: #667eea; font-weight: bold;">🕐 Time:</span> <span style="color: #333;">${showTime}</span>
              </p>
              ${genre ? `<p style="margin: 5px 0; font-size: 14px;"><span style="color: #667eea; font-weight: bold;">🎭 Genre:</span> <span style="color: #333;">${genre}</span></p>` : ''}
            </div>

            <p style="color: #666; font-size: 14px; margin: 20px 0;">Visit QuickShow now to book your tickets!</p>
          </div>
        </div>
      `;

      let successCount = 0;
      let failureCount = 0;

      for (const user of users) {
        try {
          const result = await sendEmail(
            user.email,
            `🎬 New Show Available: ${movieTitle}`,
            htmlTemplate
          );

          if (result.success) {
            successCount++;
          } else {
            console.error(`Failed to send to ${user.email}: ${result.error}`);
            failureCount++;
          }
        } catch (err) {
          console.error(`Exception sending to ${user.email}:`, err.message);
          failureCount++;
        }
      }

      console.log(
        `✅ New show notification sent to ${successCount}/${users.length} users (${failureCount} failures)`
      );
      return { success: true, usersNotified: successCount, failures: failureCount };
    } catch (error) {
      console.error('Error in sendNewShowNotification:', error.message);
      return { };
    }
  }
);
