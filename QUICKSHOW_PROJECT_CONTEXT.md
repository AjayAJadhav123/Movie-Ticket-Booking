# QUICKSHOW - Movie Ticket Booking Platform
## Complete Technical Project Context

### 1. PROJECT OVERVIEW

**Project Name**: QuickShow  
**Type**: Full-Stack Movie Ticket Booking Web Application  
**Architecture**: MERN Stack (MongoDB, Express, React, Node.js)  

**Purpose**: A professional movie ticket booking platform that allows users to browse movies, select seats, and complete payments. Includes admin dashboard for show management.

**Main Features**:
- User authentication via Clerk (email, Google OAuth, phone OTP)
- Browse movies from TMDB API with search and genre filtering
- View movie details, cast, trailers, and available showtimes
- Interactive seat selection with real-time availability
- Payment integration (Stripe, Cashfree UPI)
- Booking management and ticket generation with QR codes
- Favorites list management
- Admin dashboard for show/movie management
- Background jobs for email notifications via Inngest

**Target Users**:
- Movie-goers: Search, book, and purchase movie tickets online
- Admins: Manage movies, create showtimes, track revenue and bookings

**Main User Journey**:
```
User → Browse Movies → Search/Filter → Movie Details → Book Tickets → 
Select Date → Select Show → Select Seats → Payment → Booking Confirmation
```

**Architecture Overview**:
- **Frontend**: React 18 + Vite on Vercel (SPA with React Router)
- **Backend**: Node.js Express API on Render
- **Database**: MongoDB Atlas for data persistence
- **Auth**: Clerk for user authentication and webhooks
- **Payments**: Stripe + Cashfree for transactions
- **Movie Data**: TMDB API integration for movie information
- **Background Jobs**: Inngest for async email notifications

---

### 2. PROJECT DIRECTORY STRUCTURE

```
quickshow/
├── client/                          # React Frontend
│   ├── public/
│   │   ├── quickshow-icon.svg      # App icon
│   │   └── quickshow-logo.svg      # App logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Navigation + search bar
│   │   │   ├── Footer.jsx          # Footer component
│   │   │   ├── MovieCard.jsx       # Movie display card
│   │   │   ├── SeatGrid.jsx        # Seat selection component
│   │   │   ├── TrailerModal.jsx    # Trailer video modal
│   │   │   ├── AuthLayout.jsx      # Auth page layout
│   │   │   ├── Loading.jsx         # Loading spinner
│   │   │   └── Spinner.jsx         # Small spinner component
│   │   ├── context/
│   │   │   └── AppContext.jsx      # Global state (movies, bookings, auth)
│   │   ├── hooks/
│   │   │   └── useMovieImage.js    # Image loading with fallbacks
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Homepage with hero + trending movies
│   │   │   ├── AllMovies.jsx       # Movies listing with search/filter
│   │   │   ├── MovieDetails.jsx    # Movie info + available shows
│   │   │   ├── BookingTicket.jsx   # Booking confirmation ticket
│   │   │   ├── SeatLayout.jsx      # Seat selection + booking summary
│   │   │   ├── SignInPage.jsx      # Clerk sign-in
│   │   │   ├── SignUpPage.jsx      # Clerk sign-up
│   │   │   ├── MyBookings.jsx      # User's booking history
│   │   │   ├── Favorites.jsx       # Favorited movies
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx    # Admin statistics
│   │   │       ├── AdminMovies.jsx       # Manage movies
│   │   │       ├── AddShow.jsx           # Create new shows
│   │   │       ├── ListShows.jsx         # Manage shows
│   │   │       └── ViewBookings.jsx      # View all bookings
│   │   ├── utils/
│   │   │   └── imageUtils.js       # Image URL generation + fallbacks
│   │   ├── App.jsx                 # Main app router
│   │   ├── main.jsx                # React entry point
│   │   └── index.css               # Global styles + Tailwind
│   ├── .env                        # Frontend environment variables
│   ├── .env.example                # Example env template
│   ├── package.json                # Dependencies
│   ├── vite.config.js              # Vite configuration
│   ├── tailwind.config.js          # Tailwind CSS config
│   ├── vercel.json                 # Vercel SPA routing
│   └── index.html                  # HTML entry point
│
├── server/                         # Node.js Backend
│   ├── config/
│   │   ├── db.js                   # MongoDB connection
│   │   └── inngest.js              # Inngest initialization
│   ├── controllers/
│   │   ├── movieController.js      # Movie operations (TMDB + DB)
│   │   ├── showController.js       # Show/showtime operations
│   │   ├── bookingController.js    # Booking + payment operations
│   │   └── userController.js       # User + favorites operations
│   ├── models/
│   │   ├── Movie.js                # Mongoose Movie schema
│   │   ├── Show.js                 # Mongoose Show schema
│   │   ├── Booking.js              # Mongoose Booking schema
│   │   └── User.js                 # Mongoose User schema
│   ├── routes/
│   │   ├── movieRoutes.js          # /api/movie endpoints
│   │   ├── showRoutes.js           # /api/show endpoints
│   │   ├── bookingRoutes.js        # /api/booking endpoints
│   │   └── userRoutes.js           # /api/user endpoints
│   ├── middleware/
│   │   └── auth.js                 # Authentication middleware
│   ├── services/
│   │   └── emailService.js         # Email notification service
│   ├── inngest/
│   │   └── functions.js            # Background job functions
│   ├── scripts/
│   │   ├── importTMDBMovies.js     # Seed DB with TMDB movies
│   │   └── createShowsForAllMovies.js  # Seed DB with shows
│   ├── .env                        # Backend environment variables
│   ├── .env.example                # Example env template
│   ├── server.js                   # Express app entry point
│   └── package.json                # Dependencies

└── README.md                       # Project documentation
```

---

### 3. TECHNOLOGY STACK

**Frontend**:
- React 18.2.0 - UI framework
- Vite 5.0.8 - Build tool and dev server
- Tailwind CSS 3.3.6 - Utility-first CSS framework
- React Router DOM 6.20.0 - Client-side routing
- Clerk React 5.0.0 - Authentication UI
- Stripe React 2.4.0 - Payment UI
- Axios 1.6.0 - HTTP client
- Lucide React 0.331.0 - Icon library
- React Toastify 9.1.3 - Toast notifications
- QRCode 1.5.4 - QR code generation

**Backend**:
- Node.js - JavaScript runtime
- Express.js 4.18.2 - Web framework
- MongoDB Atlas - Cloud database
- Mongoose 8.0.0 - MongoDB ODM
- Clerk Express 1.1.0 - Authentication middleware
- Stripe 14.0.0 - Payment processing
- Cashfree SDK 6.0.4 - UPI payment processing
- Axios 1.6.0 - HTTP client
- JWT-decode 4.0.0 - Token parsing
- Inngest 3.8.0 - Background job platform
- Nodemailer 6.9.7 - Email sending
- CORS 2.8.5 - Cross-origin resource sharing
- Dotenv 16.3.1 - Environment variable loading
- Nodemon 3.0.2 - Development auto-reload

**Database**:
- MongoDB Atlas (Cloud Hosted)
- Collections: movies, shows, bookings, users
- Mongoose for schema validation and querying

**Authentication**:
- Clerk - Manages user auth, webhooks for user sync
- JWT tokens for API authentication

**Movie Data**:
- TMDB API - Movie information, trailers, cast, genres
- Endpoint: api.themoviedb.org/3

**Payment Processing**:
- Stripe - Card and UPI payments
- Cashfree - UPI QR code payments (primary)

**Deployment Platforms**:
- Vercel - Frontend hosting with automatic CI/CD
- Render - Backend hosting with automatic CI/CD
- GitHub - Version control and deployment triggers

---

### 4. FRONTEND ARCHITECTURE

**React Entry Point**: `client/src/main.jsx`
- Loads React DOM
- Mounts App to #root element
- Imports global Tailwind styles

**App Component**: `client/src/App.jsx`
- Wraps entire app with AppProvider (context)
- Wraps with ClerkProvider for authentication
- Sets up React Router with BrowserRouter
- Defines all application routes

**Route Structure**:
- Public routes (no auth required): /, /movies, /movie/:id, /sign-in, /sign-up
- Protected routes (auth required): /bookings, /favorites, /seat-layout/:id, /booking/:id
- Admin routes (admin only): /admin/*, /admin/add-shows, /admin/dashboard

**Layout Components**:
- Navbar.jsx - Header with logo, navigation, search, user menu
- Footer.jsx - Application footer
- AuthLayout.jsx - Centered layout for auth pages

**Movie Components**:
- MovieCard.jsx - Displays single movie with poster, title, rating, genre, favorites toggle
- SeatGrid.jsx - Interactive seat selection grid (A-J rows, 1-10 columns)
- TrailerModal.jsx - Modal displaying YouTube trailer

**State Management** (AppContext.jsx):
- Global state for: movies, shows, bookings, favorites, selectedSeats, loading, errors
- API client with Clerk token interceptor for authenticated requests
- Methods: fetchMovies(), fetchMovieById(), fetchShows(), createBooking(), addFavorite(), etc.
- Uses useContext and useCallback for optimization

**Styling**:
- Tailwind CSS utility classes
- Custom CSS in index.css for animations and overrides
- Professional white/light theme with indigo primary color
- Responsive breakpoints: sm, md, lg, xl

**Image Handling** (imageUtils.js + useMovieImage.js):
- TMDB image URLs: poster_path (w500), backdrop_path (w1280)
- Fallback chain: poster → backdrop → professional SVG placeholder
- Error handling: onError callbacks with automatic fallback

---

### 5. FRONTEND ROUTES

| Route | Component | Purpose | Auth | Parameters |
|-------|-----------|---------|------|------------|
| / | Home | Homepage with hero + featured movies | No | - |
| /movies | AllMovies | Browse all movies with search/filter | No | search (query) |
| /movie/:id | MovieDetails | Movie details + available shows | No | id: TMDB ID or MongoDB ID |
| /sign-in | SignInPage | Clerk sign-in form | No | - |
| /sign-up | SignUpPage | Clerk sign-up form | No | - |
| /seat-layout/:showId | SeatLayout | Seat selection + booking | Yes | showId: MongoDB Show ID |
| /booking/:bookingId | BookingTicket | Booking confirmation ticket | Yes | bookingId: MongoDB Booking ID |
| /my-bookings | MyBookings | User's booking history | Yes | - |
| /favorites | Favorites | User's favorite movies | Yes | - |
| /admin/dashboard | AdminDashboard | Admin metrics/actions | Admin | - |
| /admin/movies | AdminMovies | Manage movies | Admin | - |
| /admin/add-shows | AddShow | Create new shows | Admin | - |
| /admin/list-shows | ListShows | List/manage shows | Admin | - |
| /admin/bookings | ViewBookings | View all bookings | Admin | - |

---

### 6. BACKEND ARCHITECTURE

**Server Entry Point**: `server/server.js`
- Loads .env variables
- Connects to MongoDB
- Initializes email service
- Sets up Express middleware (CORS, Clerk, JSON parsing)
- Mounts route handlers
- Initializes Inngest for background jobs
- Health check endpoint at /health

**Express Setup**:
- CORS configured for Vercel frontend domain + localhost
- Clerk middleware for token verification
- JSON body parser with rawBody capture for webhooks
- Routes: /api/user, /api/movie, /api/show, /api/booking

**Database Models**:

1. **User** (user.js)
   - clerkId (unique, string) - From Clerk auth
   - name, email, image - Profile info
   - isAdmin (boolean) - Admin flag
   - favorites (array of ObjectIds) - Movie references
   - Synced via Clerk webhooks (user.created/updated/deleted)

2. **Movie** (movie.js)
   - title, overview, poster_path, backdrop_path - Basic info
   - release_date, genres (array), cast (array) - Details
   - language, rating (vote_average) - Metadata
   - tmdbId (unique, number) - TMDB reference
   - trailer (URL) - YouTube trailer link
   - Indexed: title, tmdbId

3. **Show** (show.js)
   - movieId (ref: Movie) - Which movie
   - date (Date), time (string: HH:MM) - When
   - theatre (string), screen (string) - Where
   - price (number), totalSeats (number) - Cost
   - occupiedSeats (array of strings) - Booked seats
   - lockedSeats (array with userId, bookedAt) - 10-min hold seats
   - Unique index: movieId + date + time (no duplicate showtimes)

4. **Booking** (booking.js)
   - userId (string - Clerk ID) - Who booked
   - showId (ref: Show) - Which show
   - seats (array of strings) - Selected seats
   - amount (number) - Total price
   - status (enum: pending/confirmed/cancelled/failed) - Booking state
   - paymentMethod (enum: stripe/cashfree/razorpay)
   - paymentId, stripeSessionId, cashfreeOrderId - Payment refs
   - movieTitle, showDate, showTime - Cached for display
   - createdAt, expiresAt (TTL) - Timestamp + 10-min expiration

**Controllers**:

1. **movieController.js**
   - getMovieList() - DB movies with pagination + filters (genre, language, search)
   - getMovieById() - Queries DB first, falls back to TMDB API
   - getTrendingMovies() - TMDB trending/day with retry logic
   - getNowPlayingMovies() - TMDB now_playing endpoint
   - getUpcomingMovies() - TMDB upcoming endpoint
   - getPopularMovies() - TMDB popular endpoint
   - getLatestMovies() - Multi-page TMDB fetch, deduplicated, newest first
   - searchMovies() - Searches both DB + TMDB, deduplicates by tmdbId
   - searchTMDBMovies() - Direct TMDB search for admin UI
   - addMovieFromTMDB() - Creates Movie doc from TMDB data (admin)
   - deleteMovie() - Removes movie from DB (admin)
   - Helper: ensureMovieInDatabase() - Syncs TMDB movie to DB if needed

2. **showController.js**
   - getShowList() - Paginated shows with movieId/date filters
   - getShowById() - Returns show with calculated available seats
   - getAvailableDates() - Distinct dates for a movie (auto-syncs TMDB)
   - getShowsByMovieAndDate() - Shows for specific movie/date (auto-syncs TMDB)
   - createShow() - Creates show (validates movie, prevents duplicates)
   - removeShow() - Deletes show (admin)
   - Helper: ensureMovieInDatabase() - TMDB → MongoDB sync

3. **bookingController.js**
   - createStripeSession() - Stripe payment session creation
   - verifyPaymentSession() - Verifies Stripe payment status
   - handleStripeWebhook() - Webhook for Stripe events
   - createCashfreeOrder() - Cashfree payment order
   - verifyCashfreePayment() - Verifies Cashfree payment
   - handleCashfreeWebhook() - Webhook for Cashfree events
   - getUserBookings() - User's bookings (auth required)
   - getBookingById() - Single booking (with ownership check)
   - getAdminBookings() - All bookings with filters (admin)
   - getAdminStats() - Dashboard metrics: revenue, bookings, shows, users

4. **userController.js**
   - handleClerkWebhook() - Syncs Clerk user events (created/updated/deleted)
   - getUser() - Returns current user profile
   - addFavorite() - Adds movie to user.favorites
   - removeFavorite() - Removes from favorites
   - getFavorites() - Returns populated favorites with movie data

**Routes** (`routes/`):
- `/api/movie` - list, latest, trending, now-playing, upcoming, popular, search, search-tmdb, :id, add, delete
- `/api/show` - list, available-dates, by-movie-date, :id, add, delete
- `/api/booking` - create-stripe-session, verify-payment, stripe-webhook, create-cashfree-order, verify-cashfree, cashfree-webhook, user-bookings, admin-bookings, admin-stats, :bookingId
- `/api/user` - webhooks (Clerk), me, add-favorite, remove-favorite, favorites

**Authentication Middleware** (auth.js):
- requireAuthMiddleware - Extracts userId from Bearer JWT (Clerk token)
- requireAdminMiddleware - Verifies isAdmin flag via Clerk API
- Invalid key detection - Distinguishes Clerk keys from Stripe keys

**Database Connection** (config/db.js):
- MongoDB Atlas URI from .env
- Mongoose connection with error handling
- Graceful fallback if URI missing

---

### 7. COMPLETE API ENDPOINT DOCUMENTATION

#### MOVIE ENDPOINTS

| Method | Endpoint | Purpose | Auth | Parameters |
|--------|----------|---------|------|-----------|
| GET | /api/movie/list | DB movies paginated | No | page, genre, language, search |
| GET | /api/movie/latest | Latest TMDB movies | No | - |
| GET | /api/movie/trending | Trending TMDB movies | No | - |
| GET | /api/movie/now-playing | Now playing TMDB | No | - |
| GET | /api/movie/upcoming | Upcoming TMDB movies | No | - |
| GET | /api/movie/popular | Popular TMDB movies | No | - |
| GET | /api/movie/search | Search DB + TMDB | No | query |
| GET | /api/movie/search-tmdb | Search TMDB only | No | query |
| GET | /api/movie/:id | Single movie (DB/TMDB) | No | id: TMDB or MongoDB ID |
| POST | /api/movie/add | Create movie from TMDB | Admin | tmdbId |
| DELETE | /api/movie/:id | Delete movie | Admin | id: MongoDB ID |

#### SHOW ENDPOINTS

| Method | Endpoint | Purpose | Auth | Parameters |
|--------|----------|---------|------|-----------|
| GET | /api/show/list | Paginated shows | No | page, movieId, date |
| GET | /api/show/:id | Single show details | No | id: Show MongoDB ID |
| GET | /api/show/available-dates | Dates for movie | No | movieId (TMDB/DB ID) |
| GET | /api/show/by-movie-date | Shows for date | No | movieId, date |
| POST | /api/show/add | Create show | Admin | movieId/tmdbId, date, time, price, theatre, screen |
| DELETE | /api/show/:id | Delete show | Admin | id: Show ID |

#### BOOKING ENDPOINTS

| Method | Endpoint | Purpose | Auth | Parameters/Body |
|--------|----------|---------|------|---------|
| POST | /api/booking/create-stripe-session | Stripe checkout | User | showId, seats |
| GET | /api/booking/verify-payment-session | Verify Stripe | User | sessionId, bookingId |
| POST | /api/booking/stripe-webhook | Stripe webhook | None | Stripe event JSON |
| POST | /api/booking/create-cashfree-order | Cashfree UPI | User | showId, seats |
| POST | /api/booking/verify-cashfree-payment | Verify Cashfree | User | orderId, paymentId, bookingId |
| POST | /api/booking/cashfree-webhook | Cashfree webhook | None | Cashfree event JSON |
| GET | /api/booking/user-bookings | My bookings | User | - |
| GET | /api/booking/:bookingId | Single booking | User | bookingId (with ownership check) |
| GET | /api/booking/admin-bookings | All bookings | Admin | page, status, movieId |
| GET | /api/booking/admin-stats | Dashboard stats | Admin | - |

#### USER ENDPOINTS

| Method | Endpoint | Purpose | Auth | Parameters/Body |
|--------|----------|---------|------|---------|
| POST | /api/user/webhooks | Clerk sync | Webhook | Clerk user event |
| GET | /api/user/me | Current user | User | - |
| POST | /api/user/add-favorite | Add to favorites | User | movieId |
| POST | /api/user/remove-favorite | Remove favorite | User | movieId |
| GET | /api/user/favorites | Get favorites | User | - |

---

### 8. DATABASE MODELS IN DETAIL

**Movie Document Example**:
```javascript
{
  _id: ObjectId("65a1b2c3d4e5f6g7h8i9j0k1"),
  title: "The Matrix",
  overview: "A computer hacker learns from mysterious rebels...",
  poster_path: "/viqnG39RbtBG9qDh9NbFX9kCslw.jpg",
  backdrop_path: "/vrg2wSh7Ky0B...jpg",
  release_date: "1999-03-31",
  genres: ["Science Fiction", "Action"],
  cast: ["Keanu Reeves", "Laurence Fishburne"],
  language: "en",
  rating: 8.7,
  trailer: "https://www.youtube.com/watch?v=...",
  tmdbId: 603,
  createdAt: ISODate(),
  updatedAt: ISODate()
}
```

**Show Document Example**:
```javascript
{
  _id: ObjectId("65a1c2d3e4f5g6h7i8j9k0l1"),
  movieId: ObjectId("65a1b2c3d4e5f6g7h8i9j0k1"),
  date: ISODate("2026-08-25"),
  time: "14:30",
  theatre: "PVR Cinemas",
  screen: "Screen 3",
  price: 250,
  totalSeats: 100,
  occupiedSeats: ["A1", "A2", "B5"],
  lockedSeats: [
    { seatNumber: "C1", userId: "clerk_user_id", bookedAt: ISODate() }
  ],
  createdAt: ISODate(),
  updatedAt: ISODate()
}
```

**Booking Document Example**:
```javascript
{
  _id: ObjectId("65a1d3e4f5g6h7i8j9k0l1m2"),
  userId: "user_clerk_id_12345",
  showId: ObjectId("65a1c2d3e4f5g6h7i8j9k0l1"),
  seats: ["A3", "A4", "B3"],
  amount: 750.00,
  status: "confirmed",
  paymentMethod: "cashfree",
  paymentId: "cashfree_payment_id_123",
  cashfreeOrderId: "order_qwerty123",
  movieTitle: "The Matrix",
  showDate: ISODate("2026-08-25"),
  showTime: "14:30",
  createdAt: ISODate(),
  expiresAt: ISODate() // TTL: 10 minutes
}
```

---

### 9. MOVIE SYSTEM - TMDB INTEGRATION

**TMDB Movie Synchronization Flow**:
1. Admin searches for "The Matrix" on Add Show page
2. Frontend calls `/api/movie/search?query=The Matrix`
3. Backend searches TMDB: `GET https://api.themoviedb.org/3/search/movie?query=...`
4. TMDB returns results with id=603, title, poster_path, etc.
5. Admin selects movie → Frontend creates Show document
6. Backend receives POST /api/show/add with tmdbId=603
7. Backend calls `ensureMovieInDatabase(603)`:
   - Checks if tmdbId exists in DB
   - If not, fetches full movie data from TMDB (credits, videos, etc.)
   - Creates Movie document in MongoDB
   - Returns MongoDB _id (ObjectId)
8. Backend creates Show document with movieId → ObjectId reference
9. Now the TMDB movie is bookable

**Movie ID Handling**:
- TMDB ID: Numeric (e.g., 603)
- MongoDB _id: ObjectId (e.g., 65a1b2c3...)
- When displaying: Use `movie._id || movie.id` fallback
- TMDB endpoints: POST /api/show/add accepts both movieId (DB) and tmdbId (TMDB)

**TMDB Endpoints Used**:
- GET /3/movie/now_playing - Current theaters
- GET /3/movie/upcoming - Upcoming releases
- GET /3/movie/popular - Popular movies
- GET /3/trending/movie/day - Trending daily
- GET /3/search/movie - Search by title
- GET /3/movie/:id - Get movie details
- GET /3/movie/:id/credits - Get cast and crew
- GET /3/movie/:id/videos - Get trailers

**Poster/Image Handling**:
- Posters: `https://image.tmdb.org/t/p/w500${poster_path}`
- Backdrops: `https://image.tmdb.org/t/p/w1280${backdrop_path}`
- Fallback: Professional SVG placeholder if missing
- Error handling: onError callbacks trigger fallback chain

---

### 10. SEARCH SYSTEM

**Search Implementation**:
- Endpoint: GET /api/movie/search?query=spider
- Frontend debounce: 300ms (useRef timer)
- Searches both database + TMDB simultaneously
- Deduplicates by tmdbId to avoid duplicates
- Returns normalized movie objects with both _id and id properties

**Search States**:
1. **Initial**: Show latest movies from TMDB
2. **Typing**: No API call until debounce completes
3. **Searching**: Show spinner, setSearchLoading(true)
4. **Results Found**: Display MovieCard components
5. **No Results**: "No movies found. Try a different search."
6. **Error**: "Unable to search movies. Please try again."
7. **Clear**: Reset to initial state, restore latest movies

**Genre Filtering + Search**:
- Both search and genre filter can be combined
- Example: Search "spider" + Genre "Action" = Spider-Man movies + other action films
- Filters applied client-side in AllMovies.jsx

**Navbar Search**:
- Form on desktop, prompt() on mobile
- Navigates to /movies?search=query
- AllMovies reads query param and performs search

---

### 11. BOOKING FLOW - COMPLETE END-TO-END

```
User Flow:
1. Browse Homepage
   ↓ Click movie (TMDB or DB)
2. Movie Details Page (/movie/:id)
   - Fetches movie data
   - Fetches available dates
   - Displays shows grouped by date
   ↓ Selects show
3. Seat Layout Page (/seat-layout/:showId)
   - Displays seat grid (A-J rows, 1-10 columns)
   - Shows theatre, screen, time, price
   - Real-time occupiedSeats shown as unavailable
   - Real-time lockedSeats shown as unavailable
   ↓ Selects seats (A1, A2, B5)
4. Booking Summary (sidebar on same page)
   - Movie name
   - Theatre + Screen
   - Date + Time
   - Selected seats list
   - Total amount calculation
   ↓ Clicks "Book Now"
5. Payment Gateway
   - Frontend: POST /api/booking/create-cashfree-order
   - Backend: Validates seats not occupied, creates Booking doc
   - Backend: Locks seats for 10 minutes with userId
   - Frontend: Opens Cashfree UPI SDK
   ↓ User scans QR / completes payment
6. Payment Confirmation
   - Cashfree webhook → POST /api/booking/cashfree-webhook
   - Backend: payment_status = SUCCESS
   - Backend: Moves seats from lockedSeats to occupiedSeats
   - Backend: booking.status = confirmed
   - Frontend: Inngest event → email confirmation sent
   ↓ Payment verified
7. Booking Confirmation Ticket (/booking/:bookingId)
   - Movie poster, title
   - Theatre name, Screen
   - Date, Time
   - Selected seats
   - Total amount paid
   - QR code for verification
   - Print/Download options

ID Passing Between Steps:
- Movie browse: Use _id or id (fallback: _id || id)
- Show selection: Pass show._id to /seat-layout/:showId
- Seat selection: Post show._id + seats[] to /api/booking/create-cashfree-order
- Get booking: Navigate to /booking/:bookingId (returned from API)
```

**Payment Calculation**:
- Price per seat: ₹250 (from Show document)
- Subtotal: 250 × 3 = ₹750
- Tax (10%): 750 × 0.1 = ₹75
- Total: 750 + 75 = ₹825

**Seat Locking Mechanism**:
- When booking starts: Add seats to show.lockedSeats with userId + timestamp
- TTL index: Booking document expires after 10 minutes
- Webhook at expiration: Remove seats from lockedSeats, release them
- On payment success: Move from lockedSeats to occupiedSeats (permanent)

---

### 12. SHOWTIME MANAGEMENT SYSTEM

**Show Creation (Admin)**:
1. Admin navigates to /admin/add-shows
2. Searches for movie (searches TMDB)
3. Selects movie, fills in:
   - Date (date picker)
   - Time (time input, HH:MM format)
   - Theatre (text input, e.g., "PVR Cinemas")
   - Screen (text input, e.g., "Screen 1")
   - Price (number input, e.g., 250)
   - Total Seats (number, default 100)
4. Admin clicks "Add Show"
5. Backend receives POST /api/show/add:
   - If tmdbId: Calls ensureMovieInDatabase(tmdbId) → syncs movie, gets MongoDB _id
   - Validates: movie exists, theatre/screen filled, date/time/price present
   - Checks: No duplicate show for same movie/date/time
   - Creates Show document
   - Initializes occupiedSeats = [] (empty)
6. Show now appears on movie details page

**Making TMDB Movie Bookable**:
- TMDB movie (e.g., 603) is NOT bookable by default
- Admin must create a Show document with tmdbId=603
- Backend syncs movie to MongoDB on first show creation
- Subsequent shows reference the MongoDB Movie document

**Show Display on Movie Details**:
- Frontend calls GET /api/show/available-dates?movieId=603
- Backend: ensureMovieInDatabase(603) syncs if needed, queries shows
- Returns array of unique dates with shows
- User selects date → frontend calls GET /api/show/by-movie-date?movieId=603&date=2026-08-25
- Backend returns all shows for that movie/date
- Shows displayed with time, price, available seats count

**Date Filtering**:
- Only dates that have at least one show appear
- No fake/empty dates shown
- Dates sorted chronologically (earliest first)

---

### 13. SEAT SELECTION SYSTEM

**Seat Layout**:
- Rows: A through J (10 rows)
- Columns: 1 through 10 (10 seats per row)
- Total: 100 seats per show (configurable via totalSeats)
- Format: "A1", "A2", ..., "J10"

**Seat States**:
1. **Available** (white, clickable) - Not in occupiedSeats or lockedSeats
2. **Occupied** (gray, disabled) - In show.occupiedSeats (permanently booked)
3. **Locked** (yellow, disabled) - In show.lockedSeats (temporary hold, 10-min)
4. **Selected** (indigo, clickable) - In selectedSeats[] (user's current selection)

**Seat Selection Flow**:
1. User clicks seat A1 → Added to selectedSeats[]
2. User clicks A2 → Added to selectedSeats[]
3. User clicks A1 again → Removed from selectedSeats[] (deselect)
4. Frontend shows selected seats in booking summary
5. On "Book Now": POST selectedSeats[] to /api/booking/create-cashfree-order
6. Backend validates each seat not in occupiedSeats or lockedSeats
7. If seat is occupied: Return 409 error "Seat already booked"
8. If all seats available: Lock them, create booking, open payment

**Real-Time Availability**:
- SeatGrid.jsx receives show object with occupiedSeats, lockedSeats
- Renders grid based on show data
- No polling - data fetched once when entering seat layout page

**Seat Reservation Duration**:
- After booking created: 10-minute TTL
- Stored in show.lockedSeats with userId and bookedAt timestamp
- If payment expires/fails: Inngest job removes seat from lockedSeats
- Seat becomes available again

---

### 14. PAYMENT SYSTEM

**Cashfree UPI Integration** (Primary):
1. Admin sets up Cashfree business account
2. .env: CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV (SANDBOX/PRODUCTION)
3. User clicks "Book Now" on seat layout
4. Frontend POSTs /api/booking/create-cashfree-order with {showId, seats}
5. Backend:
   - Validates seats
   - Calculates: subtotal = price × seats.length, tax = subtotal × 0.1, total = subtotal + tax
   - Creates Booking doc (status: pending)
   - Locks seats for 10 min
   - Calls Cashfree SDK: createOrder() with amount, orderId, return_url
   - Returns paymentSessionId to frontend
6. Frontend:
   - Loads Cashfree SDK script
   - Calls window.Cashfree.checkout({paymentSessionId})
   - Opens UPI QR modal
7. User:
   - Scans QR code with phone
   - Completes payment in bank app
8. Cashfree webhook (POST /api/booking/cashfree-webhook):
   - Verifies payment_status = SUCCESS
   - Updates booking.status = confirmed
   - Moves seats to occupiedSeats
   - Fires Inngest event for email notification
9. Frontend:
   - Polls GET /api/booking/verify-cashfree-payment
   - Sees booking.status = confirmed
   - Navigates to /booking/:bookingId (ticket page)

**Stripe Integration** (Alternative, commented):
- Similar flow but uses Stripe Checkout Sessions
- Frontend loads Stripe.js
- Opens checkout.stripe.com in new window
- Stripe webhook confirms payment

**Payment Amount Calculation**:
```
subtotal = ticketPrice × numberOfSeats
tax = Math.round(subtotal × 0.1 * 100) / 100  // 10% tax
total = subtotal + tax

Example: 3 seats × ₹250 = ₹750 subtotal
Tax (10%) = ₹75
Total = ₹825
```

**Order Creation Response**:
```javascript
{
  success: true,
  data: {
    orderId: "order_qwerty123",
    bookingId: "65a1d3e4f5g6h7i8j9k0l1m2",
    amount: 825,
    currency: "INR",
    paymentSessionId: "cf_payment_session_id_xyz"
  }
}
```

**Webhook Verification**:
- Cashfree sends POST to /api/booking/cashfree-webhook
- Backend verifies signature (handled by Cashfree SDK)
- Updates booking status based on payment_status
- Inngest event sent for async email

---

### 15. AUTHENTICATION & AUTHORIZATION

**Clerk Integration**:
- Frontend: ClerkProvider wraps App with publishable key
- User auth: Sign in/up via Clerk modal
- Token: JWT generated by Clerk, stored in localStorage
- Verification: Backend decodes JWT, extracts userId from 'sub' claim

**Protected Routes** (Frontend):
- Requires isSignedIn check via useUser() hook
- Redirects to /sign-in if not authenticated
- Admin routes also check isAdmin metadata

**API Authentication** (Backend):
- Frontend adds Authorization header: `Bearer ${token}`
- AppContext.jsx axios interceptor attaches token
- requireAuthMiddleware: Verifies token, extracts userId
- Stores userId on req.userId for use in controllers

**Admin Authorization**:
- Clerk user.publicMetadata.isAdmin = true (set via Clerk Dashboard)
- requireAdminMiddleware: Checks isAdmin via Clerk SDK
- Admin routes return 403 if not admin

**User Webhook** (user.created/updated/deleted):
- Clerk POSTs to /api/user/webhooks when user changes
- Backend creates/updates User document in MongoDB
- Syncs: clerkId, name, email, image, isAdmin status

**Ownership Verification**:
- getBookingById(): Verifies booking.userId === req.userId
- Returns 403 if user doesn't own booking
- Prevents users from viewing other users' bookings/sensitive data

---

### 16. ADMIN SYSTEM

**Admin Routes** (Protected by requireAdminMiddleware):
- /admin/dashboard - Dashboard with metrics
- /admin/movies - Manage database movies
- /admin/add-shows - Create new shows
- /admin/list-shows - List and delete shows
- /admin/bookings - View all bookings

**Admin Features**:

1. **Dashboard** (AdminDashboard.jsx):
   - Total Revenue: Sum of all confirmed bookings
   - Total Bookings: Count of all bookings
   - Active Shows: Count of shows with date >= today
   - Registered Users: Count of User documents

2. **Add Shows** (AddShow.jsx):
   - Search TMDB movies
   - Select database movies
   - Pick date, time, theatre, screen, price, seats
   - Create show document
   - Validation: All fields required, no duplicate shows

3. **List Shows** (ListShows.jsx):
   - Display all shows
   - Delete shows (soft delete recommended)
   - Filter by movie, date, theatre

4. **View Bookings** (ViewBookings.jsx):
   - List all bookings with pagination
   - Filter by status (pending, confirmed, cancelled, failed)
   - Show: User, Movie, Seats, Amount, Date, Status

5. **Admin API Endpoints**:
   - POST /api/show/add - Create show
   - DELETE /api/show/:id - Delete show
   - GET /api/booking/admin-bookings - All bookings
   - GET /api/booking/admin-stats - Dashboard metrics
   - POST /api/movie/add - Add movie from TMDB (optional)

---

### 17. ENVIRONMENT VARIABLES

**Backend (.env)** - All values [REDACTED] for security:
```
PORT=5000
NODE_ENV=production
MONGODB_URI=[REDACTED]
CLERK_PUBLISHABLE_KEY=[REDACTED]
CLERK_SECRET_KEY=[REDACTED]
CLERK_WEBHOOK_SECRET=[REDACTED]
TMDB_API_KEY=[REDACTED]
STRIPE_SECRET_KEY=[REDACTED]
STRIPE_WEBHOOK_SECRET=[REDACTED]
CASHFREE_APP_ID=[REDACTED]
CASHFREE_SECRET_KEY=[REDACTED]
CASHFREE_ENV=SANDBOX or PRODUCTION
INNGEST_EVENT_KEY=[REDACTED]
INNGEST_SIGNING_KEY=[REDACTED]
SENDER_EMAIL=[REDACTED]
SMTP_PASS=[REDACTED]
FRONTEND_URL=https://vercel-deployment-url.com
BACKEND_URL=https://render-backend-url.com
```

**Frontend (.env)**:
```
VITE_BACKEND_URL=https://render-backend-url.com
VITE_CLERK_PUBLISHABLE_KEY=[REDACTED]
VITE_STRIPE_PUBLIC_KEY=[REDACTED]
```

**Variable Usage**:

| Variable | Used By | Purpose |
|----------|---------|---------|
| MONGODB_URI | Backend | Database connection |
| CLERK_SECRET_KEY | Backend | Verify JWT tokens |
| CLERK_WEBHOOK_SECRET | Backend | Verify Clerk webhooks |
| TMDB_API_KEY | Backend | Fetch movie data |
| STRIPE_SECRET_KEY | Backend | Create payment sessions |
| CASHFREE_APP_ID | Backend | Initialize Cashfree SDK |
| CASHFREE_ENV | Backend | SANDBOX or PRODUCTION mode |
| VITE_BACKEND_URL | Frontend | API base URL |
| VITE_CLERK_PUBLISHABLE_KEY | Frontend | Initialize ClerkProvider |
| FRONTEND_URL | Backend | Stripe/Cashfree redirect URL |


---

### 18. API COMMUNICATION

**Frontend HTTP Client** (AppContext.jsx):
```javascript
const api = axios.create({
  baseURL: process.env.VITE_BACKEND_URL || 'http://localhost:5000'
});

// Interceptor adds Clerk token to every request
api.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Request Flow**:
1. Component calls API method (e.g., api.get('/api/movie/search?query=spider'))
2. Interceptor attaches Authorization header with Clerk JWT
3. Request sent to Render backend
4. Backend middleware verifies token
5. Controller processes request
6. Response returned with data

**Common Response Format**:
```javascript
{
  success: true,
  data: { /* payload */ },
  message: "Operation successful"
}

// Error response:
{
  success: false,
  message: "Error description",
  error: "error_code"
}
```

**CORS Configuration** (server.js):
- Origin: Frontend Vercel URL + localhost
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization
- Credentials: true (for cookies if needed)

**Error Handling**:
- Frontend: try/catch in components, show toast for errors
- Backend: Express error middleware catches all errors, logs, returns 500
- Network errors: axios interceptors can retry with exponential backoff

---

### 19. DEPLOYMENT

**Deployment Stack**:
- **Frontend**: Vercel (auto-deploy on GitHub push)
- **Backend**: Render (auto-deploy on GitHub push)
- **Database**: MongoDB Atlas (no deployment needed)
- **Version Control**: GitHub (primary branch: main)

**Vercel Deployment**:
- Connected to GitHub repository
- Automatic builds on push to main
- Environment variables: VITE_BACKEND_URL, VITE_CLERK_PUBLISHABLE_KEY
- Build command: npm run build
- Output directory: dist
- Deploy preview for pull requests

**Render Deployment**:
- Connected to GitHub repository
- Automatic builds on push to main
- Environment variables: All .env values
- Build command: npm install
- Start command: node server.js
- Free tier restarts on inactivity (upgrade if needed)
- Logs viewable in Render dashboard

**Deployment Checklist**:
- [ ] All environment variables set in deployment platform
- [ ] Backend CORS includes frontend URL
- [ ] Frontend .env has correct backend URL
- [ ] TMDB API key is server-side only
- [ ] Payment webhook secrets configured
- [ ] Clerk webhooks configured
- [ ] Database connection string tested
- [ ] Build succeeds locally with npm run build
- [ ] No console errors in production
- [ ] Production URLs tested end-to-end

---

### 20. VERCEL CONFIGURATION

**vercel.json** (SPA Routing):
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://render-backend-url.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Purpose**: Routes unknown paths to /index.html so React Router can handle them instead of Vercel serving 404.

**Why Needed**: Without this config, directly accessing /movie/123 or /bookings returns 404 because Vercel looks for a static file, not the index.html.

**Deployment Settings**:
- Framework: Vite
- Build command: npm run build
- Output directory: dist
- Install command: npm ci (or npm install)
- Environment variables: Set in Vercel Dashboard

---

### 21. RENDER CONFIGURATION

**Render Dashboard Setup**:
1. Create Web Service from GitHub
2. Link to quickshow repository
3. Select server folder
4. Build command: npm install
5. Start command: node server.js
6. Environment: Node 18+
7. Add environment variables from .env

**Render Specific Settings**:
- Plan: Free tier (starter)
- Auto-deploy: Enable on GitHub push
- Region: Nearest to users
- Health check: /health endpoint (responds with 200)

**Monitoring**:
- Logs: Real-time in Render dashboard
- Error logs: Check for CORS, auth, payment errors
- Uptime: Monitor via health endpoint

---

### 22. CURRENT BUGS / ISSUES

**Known Issues** (as of Task 13):
1. ✅ **Fixed**: Movie search not working (now debounced with API backend)
2. ✅ **Fixed**: /movie/undefined route errors (MovieCard fallback)
3. ✅ **Fixed**: TMDB-to-DB movie sync working
4. ✅ **Fixed**: Show management system implemented
5. ✅ **Fixed**: Vercel 404 for SPA routes (vercel.json)

**Potential Issues to Monitor**:
- Seat locking not releasing after 10min (check Inngest jobs)
- Duplicate shows if admin creates multiple at once (check unique index)
- Payment webhook not received (check Cashfree/Stripe logs, firewall)
- TMDB rate limit (429 error - implement caching)
- Large image downloads slow on mobile (consider lazy loading)

---

### 23. DUMMY / HARDCODED DATA

**What is Real**:
- ✅ Movies from TMDB API (live data)
- ✅ Shows created by admin in MongoDB (real data)
- ✅ Seats from Show schema (real inventory)
- ✅ Bookings from user payments (real transactions)
- ✅ Users synced from Clerk (real auth)

**What Should NOT Be Hardcoded**:
- ❌ Fake showtimes (all shows must be admin-created)
- ❌ Demo payment info (tests use Stripe/Cashfree test mode)
- ❌ Fake movies (always use TMDB or database)
- ❌ Test user data in production (use real Clerk auth)

**For Testing**:
- Create shows manually via /admin/add-shows
- Use Cashfree SANDBOX mode for test payments
- Stripe test card: 4242 4242 4242 4242
- Use real Clerk accounts (free tier allows testing)

---

### 24. SECURITY REVIEW

**Authentication & Authorization**:
✅ Clerk manages user auth securely
✅ Passwords hashed by Clerk (never stored in app)
✅ JWT tokens verified on every API request
✅ Admin routes protected by requireAdminMiddleware
✅ User ownership verified for bookings

**Secret Management**:
✅ All API keys in .env (not in code)
✅ TMDB key server-side only (not exposed to frontend)
✅ Stripe/Cashfree keys server-side only
✅ .gitignore prevents .env from being committed
✅ Environment variables in deployment platforms

**CORS & Network**:
✅ CORS configured to allow only Vercel frontend
✅ API errors don't leak sensitive info
✅ Webhook secrets verified (Stripe, Cashfree, Clerk)

**Payment Security**:
✅ Payment amounts validated server-side (not from frontend)
✅ Seat availability validated on every booking
✅ Duplicate bookings prevented with TTL
✅ Webhook signatures verified

**Database Security**:
✅ MongoDB username/password in connection string
✅ IP whitelist (if configured in Atlas)
✅ Collections indexed for performance and uniqueness

**Potential Improvements**:
- Rate limiting on API endpoints (prevent brute force)
- Request size limits (prevent DoS)
- Input validation & sanitization on all endpoints
- HTTPS enforced (both platforms support)
- Audit logging for admin actions
- Two-factor authentication for admin users

---

### 25. PERFORMANCE REVIEW

**Frontend Performance**:
✅ Vite fast build time (<5 seconds)
✅ React Router lazy loading (code splitting by route)
✅ Image lazy loading with fallbacks
✅ Debounced search (300ms) prevents API overload
✅ Gzipped size: ~460KB (good)

**Areas to Optimize**:
- Image optimization: Use next-gen formats (WebP)
- Component memoization: useMemo for expensive computations
- Virtual scrolling: For long movie lists
- Service worker: Offline caching of assets
- CDN: Image delivery via Cloudinary or similar

**Backend Performance**:
✅ Indexes on frequently queried fields (title, tmdbId, movieId)
✅ Pagination for list endpoints
✅ TMDB data cached in MongoDB (avoid repeated API calls)
✅ Async email via Inngest (doesn't block API response)

**Database Performance**:
✅ MongoDB Atlas auto-scaling
✅ Indexes on: title, tmdbId, movieId, date
✅ TTL index on Booking for auto-expiration

**Bottlenecks to Monitor**:
- TMDB API latency (implement response caching)
- MongoDB query performance (add more indexes if needed)
- Image loading on home page (lazy load hero images)
- Webhook processing (use async queues)

---

### 26. UI/UX REVIEW

**Current Design**:
✅ Professional white/light theme
✅ Indigo primary color, purple accent, red accents
✅ Responsive across desktop, tablet, mobile
✅ Tailwind CSS for consistency
✅ Clear typography hierarchy
✅ Accessible color contrasts

**Components & UX**:
✅ Navbar: Logo, navigation, search, user menu
✅ MovieCard: Poster, title, rating, genre, favorites, book button
✅ SeatGrid: Interactive seat selection with visual feedback
✅ Booking summary: Clear breakdown of costs
✅ Payment: Cashfree UPI QR code modal
✅ Ticket: Confirmation with QR code, printable

**Known UX Improvements**:
- Add loading skeletons (instead of spinners)
- Implement error boundaries (graceful error display)
- Add undo/redo for seat selection
- Show seat availability in movie details
- Add promotional banners/offers
- Add wishlist/reminder for upcoming movies
- Show theater map (which seats are best)
- Add reviews/ratings from IMDb or Rotten Tomatoes

---

### 27. CURRENT USER FLOW

**User (Guest)**:
1. Lands on homepage → Sees trending/popular TMDB movies
2. Browses movies or uses search bar
3. Clicks on movie → Movie details page
4. Views movie info, cast, trailer
5. Sees available dates with shows
6. To proceed further: Must sign in (Clerk)

**User (Authenticated)**:
1. Selects date & show → Navigates to seat layout
2. Selects seats interactively
3. Views booking summary (movie, theatre, seats, total)
4. Clicks "Book Now" → Payment window (Cashfree UPI)
5. Scans QR with phone → Completes payment
6. Redirected to booking confirmation ticket
7. Can print/download ticket with QR code
8. Accesses /my-bookings to view booking history
9. Can add movies to /favorites for later
10. Can update profile via Clerk menu

**Admin User**:
1. Logs in with admin account
2. Accesses /admin/dashboard → Views metrics
3. Can navigate to:
   - /admin/add-shows → Create shows from TMDB movies
   - /admin/list-shows → Manage existing shows
   - /admin/bookings → View all bookings across all users
4. Creates shows for TMDB movies to make them bookable

---

### 28. CURRENT PROJECT STATUS

**Completed Features**:
✅ User authentication (Clerk)
✅ Movie browsing from TMDB
✅ Movie search (with debounce)
✅ Genre filtering
✅ Favorites system
✅ Movie details page with trailer
✅ Available shows display by date
✅ Seat selection (A-J rows, 1-10 columns)
✅ Booking summary with price calculation
✅ Payment integration (Cashfree UPI primary)
✅ Booking confirmation ticket with QR code
✅ Admin dashboard with metrics
✅ Admin show creation system
✅ Admin booking view
✅ Professional white/light UI theme
✅ Responsive design (desktop, tablet, mobile)
✅ TMDB-to-MongoDB movie sync
✅ Real-time seat availability

**Partially Implemented**:
- Stripe payment (alternative, not primary)
- Email notifications (via Inngest, needs testing)
- Admin movie management (basic add/delete)

**Not Yet Implemented**:
- Reviews/ratings system
- Promotional codes/discounts
- Refund system
- SMS notifications
- Multi-language support
- Dark mode toggle
- Advanced admin analytics
- Integration with cinema chains

**Build Status**: ✅ Passes (454-462KB gzipped)
**Production**: ✅ Deployed (Vercel + Render)
**Testing**: Partial (manual testing, no automated tests)

---

### 29. RECOMMENDED IMPROVEMENTS

**High Priority**:
1. Add automated tests (Jest for frontend, Mocha for backend)
2. Implement refund functionality (payment partial refund)
3. Add rate limiting (prevent API abuse)
4. Implement promotional codes system
5. Add cancellation with refund window (24hrs before show)

**Medium Priority**:
1. Implement email notifications properly (test Inngest)
2. Add SMS notifications via Twilio
3. Implement wishlist/reminders for upcoming movies
4. Add theater reviews and photos
5. Implement social sharing (share booking on WhatsApp)
6. Add dark mode toggle

**Low Priority**:
1. Multi-language support (i18n)
2. Advanced admin analytics (charts, trends)
3. Integration with cinema chain APIs
4. Mobile app (React Native)
5. Integration with IMDb/RottenTomatoes for reviews

**Technical Debt**:
1. Add JSDoc comments to all functions
2. Extract magic numbers to constants
3. Create shared utilities for date/price formatting
4. Add error boundary components
5. Implement proper logging (Winston or Pino)
6. Add integration tests for API endpoints

---

### 30. PROJECT ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                               │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    React Frontend (Vercel)                │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │ Home Page    │  │ Movie List   │  │ Seat Layout  │   │  │
│  │  │ (Hero)       │  │ (Search)     │  │ (Grid)       │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │      AppContext (Global State)                    │  │  │
│  │  │  - movies, shows, bookings, favorites, auth      │  │  │
│  │  │  - Axios interceptor (adds JWT token)            │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  ClerkProvider (Authentication)                   │  │  │
│  │  │  - User login/signup, JWT generation             │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/HTTPS
        ┌─────────────────────────────────────────────┐
        │   Express Backend (Render)                  │
        │                                             │
        │  ┌──────────────────────────────────────┐  │
        │  │ Routes:                              │  │
        │  │ - /api/movie (list, search, ...)    │  │
        │  │ - /api/show (create, list, ...)     │  │
        │  │ - /api/booking (payment, create)    │  │
        │  │ - /api/user (favorites, webhooks)   │  │
        │  └──────────────────────────────────────┘  │
        │                                             │
        │  ┌──────────────────────────────────────┐  │
        │  │ Controllers:                         │  │
        │  │ - movieController                    │  │
        │  │ - showController                     │  │
        │  │ - bookingController                  │  │
        │  │ - userController                     │  │
        │  └──────────────────────────────────────┘  │
        │                                             │
        │  ┌──────────────────────────────────────┐  │
        │  │ Middleware:                          │  │
        │  │ - Auth (Clerk JWT verification)      │  │
        │  │ - CORS, Body Parser                  │  │
        │  └──────────────────────────────────────┘  │
        └─────────────────────────────────────────────┘
              ↓ HTTPS                ↓ HTTPS
      ┌──────────────────┐    ┌──────────────────┐
      │  MongoDB Atlas   │    │   TMDB API       │
      │  (Database)      │    │   (Movie Data)   │
      │                  │    │                  │
      │ Collections:     │    │ Endpoints:       │
      │ - movies         │    │ - search         │
      │ - shows          │    │ - trending       │
      │ - bookings       │    │ - now_playing    │
      │ - users          │    │ - movie details  │
      └──────────────────┘    └──────────────────┘
              ↓                       ↓
      ┌──────────────────┐    ┌──────────────────┐
      │ Clerk Webhooks   │    │ Payment APIs:    │
      │ (user sync)      │    │ - Cashfree       │
      │                  │    │ - Stripe         │
      └──────────────────┘    └──────────────────┘
              ↓
      ┌──────────────────┐
      │ Inngest          │
      │ (Background Jobs)│
      │ - Email send     │
      │ - Cleanup jobs   │
      └──────────────────┘
```

---

### 31. IMPORTANT FILE REFERENCE

**Critical Files to Understand**:

| File | Purpose | Key Concepts |
|------|---------|--------------|
| App.jsx | Frontend routing | React Router setup |
| AppContext.jsx | Global state | API client, auth, movies |
| server.js | Backend entry | Middleware, routes setup |
| movieController.js | Movie logic | TMDB sync, search |
| showController.js | Show logic | TMDB-to-DB sync |
| bookingController.js | Payment logic | Cashfree, Stripe |
| userController.js | User logic | Clerk webhooks |
| Show.js | Show schema | movieId ref, occupiedSeats |
| Booking.js | Booking schema | userId, showId, status |
| MovieDetails.jsx | Show selection | Fetches shows by date |
| SeatLayout.jsx | Seat booking | SeatGrid, summary |
| AllMovies.jsx | Search/filter | Debounced search |
| AddShow.jsx | Admin show creation | Movie search form |
| .env files | Secrets | All API keys, DB URI |
| vercel.json | SPA routing | Route rewriting |

---

### 32. FINAL CHATGPT HANDOFF

**Summary for ChatGPT Review**:

This is a full-stack MERN movie ticket booking platform built with:
- **Frontend**: React 18 + Vite deployed on Vercel
- **Backend**: Node.js Express deployed on Render
- **Database**: MongoDB Atlas with Mongoose ODM
- **Auth**: Clerk (email, Google, phone OTP)
- **Movies**: TMDB API integration with MongoDB sync
- **Payments**: Cashfree UPI (primary) + Stripe (secondary)
- **Background Jobs**: Inngest for async notifications

**Key Architecture Points**:
1. TMDB movies dynamically synced to MongoDB when admin creates shows
2. Show system prevents booking without showtime creation
3. Real-time seat availability with 10-minute payment locks
4. Verified payment system with webhooks
5. Admin dashboard for show/booking management
6. Professional white/light theme with responsive design

**Files to Review First**:
1. `quickshow/server/server.js` - Backend setup
2. `quickshow/server/controllers/movieController.js` - TMDB integration
3. `quickshow/server/controllers/showController.js` - Show management
4. `quickshow/client/src/App.jsx` - Frontend routing
5. `quickshow/client/src/context/AppContext.jsx` - State management
6. `quickshow/client/src/pages/AllMovies.jsx` - Search implementation
7. `quickshow/client/src/pages/SeatLayout.jsx` - Booking flow

**Current Status**:
- ✅ Build: 454-462KB gzipped
- ✅ Production: Deployed (Vercel + Render)
- ✅ Features: Complete core functionality
- ✅ UI: Professional white/light theme
- ✅ Security: API keys server-side only
- ✅ Payments: Working Cashfree UPI integration
- ✅ Search: Debounced TMDB + DB search
- ✅ Showtime Management: Admin show creation functional

**Any Questions**: All sections documented above provide comprehensive technical understanding for review and future development.

---

*Last Updated: August 2026*
*Documentation Version: 1.0 (Complete)*
