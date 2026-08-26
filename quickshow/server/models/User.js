import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    password: {
      type: String,
      select: false, // Don't return password by default
    },
    googleId: {
      type: String,
      sparse: true, // Allows null/undefined to not violate unique index if added
      unique: true,
      index: true,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    image: {
      type: String,
      default: null,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    favorites: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Movie',
      default: [],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationOtp: {
      type: String,
      select: false, // Don't return OTP in queries
    },
    verificationOtpExpire: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
