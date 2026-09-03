import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import emailService from '../services/emailService.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: Generate JWT
export const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing');

  return jwt.sign(
    {
      id: user._id, // Using standard MongoDB _id as the primary id
      isAdmin: user.isAdmin,
      email: user.email,
      name: user.name,
      tokenVersion: user.tokenVersion || 0,
    },
    secret,
    { expiresIn: '24h' } // Standard 24 hour session
  );
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOtpEmailTemplate = (otp, name) => {
  return `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
      <div style="background: linear-gradient(135deg, #e50914 0%, #b80710 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">QUICKSHOW</h1>
      </div>
      <div style="padding: 40px 30px; background-color: #141414;">
        <h2 style="color: #ffffff; margin-top: 0; font-size: 22px;">Verify your email address</h2>
        <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">Hello ${name},</p>
        <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">Thank you for registering with QuickShow. To complete your registration and secure your account, please use the following One-Time Password (OTP):</p>
        
        <div style="background-color: #0a0a0a; border: 1px solid #27272a; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #e50914;">${otp}</span>
        </div>
        
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">This code is valid for <strong>10 minutes</strong>. If you did not request this verification, please ignore this email.</p>
      </div>
      <div style="background-color: #0a0a0a; padding: 20px; text-align: center; border-top: 1px solid #27272a;">
        <p style="color: #71717a; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} QuickShow. All rights reserved.</p>
      </div>
    </div>
  `;
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
export const register = async (req, res) => {
  let isResponded = false;

  // Global fallback: absolutely ensure the request doesn't hang indefinitely (15s max)
  const globalTimeout = setTimeout(() => {
    if (!isResponded) {
      isResponded = true;
      return res.status(504).json({ success: false, message: 'Server timeout. Please try again later.' });
    }
  }, 15000);

  const safeRespond = (status, data) => {
    if (!isResponded) {
      isResponded = true;
      clearTimeout(globalTimeout);
      return res.status(status).json(data);
    }
  };

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return safeRespond(400, { success: false, message: 'Please provide name, email, and password' });
    }

    // Check if user exists (with 5s DB timeout)
    const existingUser = await Promise.race([
      User.findOne({ email: email.toLowerCase() }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB Timeout')), 5000))
    ]);

    if (existingUser) {
      if (!existingUser.isVerified) {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        const otp = generateOTP();

        existingUser.password = hashedPassword;
        existingUser.name = name;
        existingUser.verificationOtp = otp;
        existingUser.verificationOtpExpire = Date.now() + 10 * 60 * 1000;

        if (process.env.NODE_ENV !== 'production') {
          console.log(`[DEV/TEST] Registration (resend) OTP for ${email}: ${otp}`);
        }

        // Save user (with 5s DB timeout)
        await Promise.race([
          existingUser.save(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB Timeout')), 5000))
        ]);
        if (process.env.OTP_MODE === 'demo') {
          return safeRespond(200, { 
            success: true, 
            message: 'Demo Mode Active. Please use the provided OTP.',
            demoOtp: otp 
          });
        }

        try {
          const emailResult = await emailService.sendEmail(
            existingUser.email,
            'Verify your QuickShow account',
            getOtpEmailTemplate(otp, existingUser.name)
          );

          if (!emailResult.success) {
            console.error(`[OTP Error] Failed to send OTP to ***@${existingUser.email.split('@')[1]}: ${emailResult.error}`);
            return safeRespond(400, { success: false, message: 'Failed to send OTP email. Please check if your email provider is correctly configured.' });
          }
        } catch (emailErr) {
          console.error(`[OTP Error] Exception sending OTP: ${emailErr.message}`);
          return safeRespond(500, { success: false, message: 'Failed to send OTP email.' });
        }

        return safeRespond(200, { success: true, message: 'Account updated. Please verify your email with the OTP sent.' });
      }
      return safeRespond(400, { success: false, message: 'User already exists and is verified. Please log in.' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOTP();

    // Create user (with 5s DB timeout)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV/TEST] Registration OTP for ${email}: ${otp}`);
    }
    const newUser = await Promise.race([
      User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        isVerified: false,
        verificationOtp: otp,
        verificationOtpExpire: Date.now() + 10 * 60 * 1000,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB Timeout')), 5000))
    ]);
    if (process.env.OTP_MODE === 'demo') {
      return safeRespond(201, { 
        success: true, 
        message: 'Demo Mode Active. Please use the provided OTP.',
        demoOtp: otp 
      });
    }

    try {
      const emailResult = await emailService.sendEmail(
        newUser.email,
        'Verify your QuickShow account',
        getOtpEmailTemplate(otp, newUser.name)
      );

      if (!emailResult.success) {
        console.error(`[OTP Error] Failed to send OTP to ***@${newUser.email.split('@')[1]}: ${emailResult.error}`);
        return safeRespond(400, { success: false, message: 'Failed to send OTP email. Please check if your email provider is correctly configured.' });
      }
    } catch (emailErr) {
      console.error(`[OTP Error] Exception sending OTP: ${emailErr.message}`);
      return safeRespond(500, { success: false, message: 'Failed to send OTP email.' });
    }

    return safeRespond(201, { success: true, message: 'Account created. Please verify your email with the OTP sent.' });
  } catch (error) {
    if (error.message === 'MongoDB Timeout') {
      return safeRespond(504, { success: false, message: 'Database operation timed out. Please try again.' });
    }
    console.error('Register error:', error);
    return safeRespond(500, { success: false, message: 'Server error' });
  }
};

// @route   POST /api/auth/verify-otp
// @desc    Verify email OTP
// @access  Public
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      verificationOtp: otp,
      verificationOtpExpire: { $gt: Date.now() }
    }).select('+verificationOtp +verificationOtpExpire');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   POST /api/auth/resend-otp
// @desc    Resend email OTP
// @access  Public
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    const otp = generateOTP();
    user.verificationOtp = otp;
    user.verificationOtpExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV/TEST] Resend OTP for ${email}: ${otp}`);
    }
    if (process.env.OTP_MODE === 'demo') {
      return res.status(200).json({ 
        success: true, 
        message: 'Demo Mode Active. Please use the provided OTP.',
        demoOtp: otp 
      });
    }

    const emailResult = await emailService.sendEmail(
      user.email,
      'Your New QuickShow Verification Code',
      getOtpEmailTemplate(otp, user.name)
    );

    if (!emailResult.success) {
      console.error(`[OTP Error] Failed to resend OTP to ***@${user.email.split('@')[1]}: ${emailResult.error}`);
      return res.status(400).json({ success: false, message: 'Failed to resend OTP email. Please check your email configuration.' });
    }

    res.status(200).json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user (include password for verification)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(401).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check password
    if (!user.password) {
      return res.status(401).json({ success: false, message: 'Please login using the method you signed up with (e.g., Google)' });
    }

    // Check if user is verified
    if (user.isVerified === false) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
        notVerified: true
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Successful login, reset attempts
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        image: user.image
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'There is no user with that email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expire (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `
      <h1>You have requested a password reset</h1>
      <p>Please make a PUT request to the following link to reset your password:</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
    `;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV/TEST] Password Reset URL for ${email}: ${resetUrl}`);
    }

    try {
      // Fire and forget email to prevent hanging if SMTP is blocked
      emailService.sendEmail(
        user.email,
        'Password Reset Request - QuickShow',
        message
      ).catch(err => console.error(err));

      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   PUT /api/auth/reset-password/:resettoken
// @desc    Reset password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Please provide a new password' });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);

    // Revoke all existing sessions by incrementing token version
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        image: user.image
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @route   POST /api/auth/google
// @desc    Google Auth Login/Register
// @access  Public
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential missing' });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (user) {
      // If user exists but doesn't have googleId set (e.g. they registered via email first), link it
      if (!user.googleId) {
        user.googleId = googleId;
        // Optionally update their picture if they don't have one
        if (!user.image && picture) {
          user.image = picture;
        }
        await user.save();
      }
    } else {
      // Register new user
      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId,
        image: picture,
        // No password needed for Google auth users
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        image: user.image
      },
    });
  } catch (error) {
    console.error('Google Auth error:', error);
    res.status(500).json({ success: false, message: 'Google Authentication failed' });
  }
};

