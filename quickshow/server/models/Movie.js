import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    overview: {
      type: String,
      default: '',
    },
    poster_path: {
      type: String,
      default: null,
    },
    backdrop_path: {
      type: String,
      default: null,
    },
    release_date: {
      type: Date,
      default: null,
    },
    genres: {
      type: [String],
      default: [],
    },
    cast: {
      type: [String],
      default: [],
    },
    tmdbId: {
      type: Number,
      unique: true,
      sparse: true,
      index: true,
    },
    language: {
      type: String,
      default: 'en',
    },
    rating: {
      type: Number,
      default: 0,
    },
    trailer: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Movie = mongoose.model('Movie', movieSchema);
export default Movie;
