import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
    favorites: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Movie',
      default: [],
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
