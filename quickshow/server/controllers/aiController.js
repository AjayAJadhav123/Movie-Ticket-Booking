import { OpenAI } from 'openai';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

// Initialize OpenAI lazily when needed
let openai = null;

function getOpenAIClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// The booking helper must remain usable if an API key is absent, expired, or
// rate-limited. This deliberately gives only guidance; it never invents
// showtimes, prices, or availability.
function getLocalAssistantReply(message) {
  const text = message.toLowerCase().trim();

  if (/^(hi|hello|hey)\b/.test(text)) {
    return 'Hi! I can help you browse movies, find a showtime, check seats, and guide you through booking. Which movie are you interested in?';
  }
  if (/show|time|slot|available|seat|ticket/.test(text)) {
    return 'Open a movie, choose one of its available dates and showtimes, then select your seats. The seat map marks occupied seats and shows the remaining availability before payment.';
  }
  if (/price|cost|fee|payment/.test(text)) {
    return 'Each show page displays the current per-seat price. The booking screen calculates the total, including the displayed taxes and fees, before you continue to payment.';
  }
  if (/recommend|suggest|genre|watch/.test(text)) {
    return 'You can browse Trending, Now Showing, and Popular titles on the home page, or use the Movies search box to find a title or genre.';
  }
  if (/book|booking/.test(text)) {
    return 'Choose a movie, select a date and showtime, pick your seats, and use Proceed to Payment. Your ticket appears in My Bookings after payment is confirmed.';
  }
  return 'I can help you find a movie, check available shows and seats, or explain the booking process. Try asking “What movies are showing?” or “How do I book tickets?”';
}

const sendLocalAssistantReply = (res, message, reason) =>
  res.status(200).json({
    success: true,
    data: { message: getLocalAssistantReply(message), conversationId: null },
    source: 'local_assistant',
    ...(reason ? { notice: reason } : {}),
  });

// System prompt for QuickShow AI Assistant
const SYSTEM_PROMPT = `You are QuickShow AI, a helpful movie booking assistant for the QuickShow movie ticket booking platform.

Your role is to help users:
1. Search for movies by genre, title, or rating
2. Find available shows and showtimes
3. Check ticket prices and availability
4. Make movie recommendations based on user preferences
5. Provide booking guidance

IMPORTANT RULES:
- NEVER invent or make up movie data, showtimes, prices, or availability
- ALWAYS ask for clarification if the user's request is ambiguous
- When users ask to book, NEVER process payment directly - guide them to the booking page
- You have access to real QuickShow API data through function calls
- Provide recommendations only based on real data from the system
- Always be helpful, polite, and professional

When a user asks about:
- Movies: Use search and filter capabilities
- Showtimes: Query available shows for specific date/movie
- Prices: Show actual ticket prices from the system
- Bookings: Guide them to complete the booking on the website

Format responses in a friendly, conversational manner.`;

// Function definitions for Claude to call
const AVAILABLE_FUNCTIONS = [
  {
    name: 'search_movies',
    description: 'Search for movies by title, genre, or get popular movies. Returns movie details including title, genre, rating, and overview.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Movie title or genre to search for' },
        limit: { type: 'number', description: 'Maximum number of results to return (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_showtimes',
    description: 'Get available showtimes for a specific movie. Returns show details including time, theatre, price, and available seats.',
    parameters: {
      type: 'object',
      properties: {
        movieId: { type: 'string', description: 'The movie ID' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format (optional)' },
      },
      required: ['movieId'],
    },
  },
  {
    name: 'get_movie_details',
    description: 'Get detailed information about a specific movie including cast, plot, ratings, and available shows.',
    parameters: {
      type: 'object',
      properties: {
        movieId: { type: 'string', description: 'The movie ID' },
      },
      required: ['movieId'],
    },
  },
  {
    name: 'get_movies_by_genre',
    description: 'Get movies filtered by genre. Returns list of movies with their details.',
    parameters: {
      type: 'object',
      properties: {
        genre: { type: 'string', description: 'Movie genre (Action, Comedy, Drama, Horror, Thriller, Animation, Romance, Sci-Fi, Fantasy)' },
        limit: { type: 'number', description: 'Maximum number of results (default 5)' },
      },
      required: ['genre'],
    },
  },
  {
    name: 'check_availability',
    description: 'Check ticket availability and pricing for a specific show.',
    parameters: {
      type: 'object',
      properties: {
        showId: { type: 'string', description: 'The show ID' },
      },
      required: ['showId'],
    },
  },
];

// Function implementations
const functionHandlers = {
  search_movies: async (params) => {
    try {
      const { query, limit = 5 } = params;
      const movies = await Movie.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { genres: { $in: [new RegExp(query, 'i')] } },
        ],
      })
        .limit(limit)
        .select('title genres rating overview poster_path')
        .lean();

      return {
        success: true,
        data: movies.map((m) => ({
          id: m._id,
          title: m.title,
          genres: m.genres,
          rating: m.rating,
          overview: m.overview,
        })),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  get_showtimes: async (params) => {
    try {
      const { movieId, date } = params;

      let query = { movieId };
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.date = { $gte: startDate, $lt: endDate };
      }

      const shows = await Show.find(query)
        .populate('movieId', 'title')
        .select('time theatre screen price occupiedSeats lockedSeats totalSeats date')
        .sort('time')
        .lean();

      return {
        success: true,
        data: shows.map((s) => ({
          id: s._id,
          title: s.movieId?.title,
          time: s.time,
          theatre: s.theatre,
          screen: s.screen,
          price: s.price,
          availableSeats: s.totalSeats - s.occupiedSeats.length - s.lockedSeats.length,
          totalSeats: s.totalSeats,
          date: s.date,
        })),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  get_movie_details: async (params) => {
    try {
      const { movieId } = params;
      const movie = await Movie.findById(movieId).lean();

      if (!movie) {
        return { success: false, error: 'Movie not found' };
      }

      const shows = await Show.find({ movieId }).select('time price date').lean();

      return {
        success: true,
        data: {
          id: movie._id,
          title: movie.title,
          overview: movie.overview,
          genres: movie.genres,
          rating: movie.rating,
          cast: movie.cast,
          releaseDate: movie.release_date,
          availableShows: shows.length,
          priceRange: shows.length > 0 ? [Math.min(...shows.map((s) => s.price)), Math.max(...shows.map((s) => s.price))] : null,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  get_movies_by_genre: async (params) => {
    try {
      const { genre, limit = 5 } = params;
      const movies = await Movie.find({ genres: genre })
        .limit(limit)
        .select('title genres rating poster_path')
        .sort({ rating: -1 })
        .lean();

      return {
        success: true,
        data: movies.map((m) => ({
          id: m._id,
          title: m.title,
          genres: m.genres,
          rating: m.rating,
        })),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  check_availability: async (params) => {
    try {
      const { showId } = params;
      const show = await Show.findById(showId)
        .populate('movieId', 'title')
        .select('time theatre screen price occupiedSeats lockedSeats totalSeats')
        .lean();

      if (!show) {
        return { success: false, error: 'Show not found' };
      }

      const availableSeats = show.totalSeats - show.occupiedSeats.length - show.lockedSeats.length;

      return {
        success: true,
        data: {
          movie: show.movieId?.title,
          theatre: show.theatre,
          screen: show.screen,
          time: show.time,
          price: `₹${show.price}`,
          availableSeats,
          totalSeats: show.totalSeats,
          occupancyPercentage: Math.round(((show.occupiedSeats.length / show.totalSeats) * 100)),
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Main AI Chat endpoint
 * POST /api/ai/chat
 */
export const chatWithAI = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return sendLocalAssistantReply(res, message, 'AI service is not configured. Using the built-in booking helper.');
    }

    // Get OpenAI client (lazy-loaded)
    const openai = getOpenAIClient();

    // Build messages array
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    // Call OpenAI with function calling
    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      functions: AVAILABLE_FUNCTIONS,
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Process function calls if any
    while (response.choices[0].finish_reason === 'function_call') {
      const functionCall = response.choices[0].message.function_call;
      const functionName = functionCall.name;
      const functionParams = JSON.parse(functionCall.arguments);

      console.log(`🤖 AI calling function: ${functionName}`, functionParams);

      // Execute the function
      const functionHandler = functionHandlers[functionName];
      if (!functionHandler) {
        return res.status(400).json({
          success: false,
          message: `Unknown function: ${functionName}`,
        });
      }

      const functionResult = await functionHandler(functionParams);

      // Add function result to messages
      messages.push({ role: 'assistant', content: response.choices[0].message.content, function_call: functionCall });
      messages.push({
        role: 'function',
        name: functionName,
        content: JSON.stringify(functionResult),
      });

      // Get next response from AI
      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        functions: AVAILABLE_FUNCTIONS,
        function_call: 'auto',
        temperature: 0.7,
        max_tokens: 1000,
      });
    }

    const aiMessage = response.choices[0].message.content || 'I apologize, I could not generate a response.';

    return res.status(200).json({
      success: true,
      data: {
        message: aiMessage,
        conversationId: req.userId,
      },
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    const isQuotaError = error.status === 429 || error.code === 'insufficient_quota';
    return sendLocalAssistantReply(
      res,
      req.body?.message || '',
      isQuotaError
        ? 'The AI quota is currently exhausted. Using the built-in booking helper.'
        : 'The AI service is temporarily unavailable. Using the built-in booking helper.'
    );
  }
};
