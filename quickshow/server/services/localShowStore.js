import { randomUUID } from 'crypto';

// Development fallback for when MongoDB is unavailable. This keeps the admin
// slot workflow and seat-availability UI usable locally. Data lives for the
// server session only; production must use MongoDB for durable bookings.
const shows = [];

const movieKey = (value) => String(value || '').replace(/^tmdb_/, '');

export const listLocalShows = ({ movieId, date } = {}) => shows
  .filter((show) => !movieId || movieKey(show.movieId?.tmdbId) === movieKey(movieId))
  .filter((show) => !date || new Date(show.date).toDateString() === new Date(date).toDateString())
  .sort((a, b) => new Date(a.date) - new Date(b.date) || a.time.localeCompare(b.time));

export const getLocalShow = (id) => shows.find((show) => show._id === id);

export const createLocalShow = ({ tmdbId, movieTitle, date, time, theatre, screen, price, totalSeats }) => {
  const normalizedMovieId = movieKey(tmdbId);
  const duplicate = shows.some((show) =>
    movieKey(show.movieId?.tmdbId) === normalizedMovieId &&
    new Date(show.date).toDateString() === new Date(date).toDateString() &&
    show.time === time && show.theatre === theatre && show.screen === screen
  );
  if (duplicate) return null;

  const show = {
    _id: `local_${randomUUID()}`,
    movieId: {
      _id: normalizedMovieId,
      tmdbId: Number(normalizedMovieId) || normalizedMovieId,
      title: movieTitle || `TMDB Movie ${normalizedMovieId}`,
    },
    date: new Date(date).toISOString(),
    time,
    theatre,
    screen,
    price: Number(price),
    totalSeats: Number(totalSeats) || 100,
    occupiedSeats: [],
    lockedSeats: [],
  };
  shows.push(show);
  return show;
};

export const removeLocalShow = (id) => {
  const index = shows.findIndex((show) => show._id === id);
  if (index === -1) return false;
  shows.splice(index, 1);
  return true;
};
