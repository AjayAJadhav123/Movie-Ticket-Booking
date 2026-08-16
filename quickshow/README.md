# QuickShow - Full Stack Movie Ticket Booking Application

A modern, fully-functional movie ticket booking application built with the MERN stack (MongoDB, Express, React, Node.js) with integrated payment processing, email notifications, and admin dashboard.

## 🎬 Features

### User Features
- **Authentication**: Clerk-based auth with email, Google OAuth, and phone OTP
- **Movie Browsing**: Browse now showing and all movies with search and filters
- **Movie Details**: View cast, trailers, overview, and available shows
- **Seat Booking**: Interactive seat selection with real-time availability
- **10-Minute Hold**: Temporary seat reservations during checkout
- **Payment**: Stripe integration for secure payment processing
- **Booking Management**: View booking history and ticket details
- **Favorites**: Add/remove movies to favorites
- **Notifications**: Real-time toasts and email confirmations

### Admin Features
- **Dashboard**: View key metrics (revenue, bookings, active shows, users)
- **Show Management**: Create, edit, and delete movie shows
- **Movie Management**: Add movies from TMDB database
- **Booking Analytics**: View all bookings with filtering by status
- **Revenue Tracking**: Monitor total revenue from confirmed bookings

### Technical Features
- **Responsive Design**: Fully responsive on mobile, tablet, and desktop
- **Real-time Updates**: Live seat availability and booking status
- **Background Jobs**: Inngest for email notifications and reminders
- **Webhook Handling**: Stripe webhooks for payment confirmation
- **Atomic Operations**: Prevent double-booking with MongoDB transactions
- **Security**: Clerk authentication, admin authorization, secure API design

## 🏗️ Technology Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- React Router for navigation
- Clerk for authentication
- Stripe for payments
- Lucide React for icons
- React Toastify for notifications
- Axios for API communication

### Backend
- Node.js with Express.js
- MongoDB Atlas for database
- Mongoose for ODM
- Clerk for auth middleware
- Stripe for payment processing
- Inngest for background jobs
- Nodemailer for email notifications
- TMDB API for movie data

### Deployment
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas

## 📁 Project Structure

```
quickshow/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Footer.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── MovieCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── SeatGrid.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── TrailerModal.jsx
│   │   ├── context/
│   │   │   └── AppContext.jsx
│   │   ├── pages/
│   │   │   ├── AllMovies.jsx
│   │   │   ├── Favorites.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── MovieDetails.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   ├── SeatLayout.jsx
│   │   │   └── admin/
│   │   │       ├── AddShow.jsx
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── ListShows.jsx
│   │   │       └── ViewBookings.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── config/
│   │   ├── db.js
│   │   └── inngest.js
│   ├── controllers/
│   │   ├── bookingController.js
│   │   ├── movieController.js
│   │   ├── showController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Booking.js
│   │   ├── Movie.js
│   │   ├── Show.js
│   │   └── User.js
│   ├── routes/
│   │   ├── bookingRoutes.js
│   │   ├── movieRoutes.js
│   │   ├── showRoutes.js
│   │   └── userRoutes.js
│   ├── inngest/
│   │   └── functions.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ installed
- MongoDB Atlas account (or local MongoDB)
- Clerk account (for authentication)
- Stripe account (for payments)
- TMDB API key (for movie data)
- Gmail account with app password (for emails)

### Installation

1. **Clone the repository**
   ```bash
   cd quickshow
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Fill in your environment variables in .env
   ```

3. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   cp .env.example .env
   # Fill in your environment variables in .env
   ```

## 🔧 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quickshow?retryWrites=true&w=majority

CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

TMDB_API_KEY=your_tmdb_api_key

SENDER_EMAIL=your_email@gmail.com
SMTP_PASS=your_app_password

RESEND_API_KEY=your_resend_api_key (optional)

FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_BACKEND_URL=http://localhost:5000
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
```

## 📊 API Endpoints

### User Endpoints
- `POST /api/user/webhooks` - Clerk webhook for user sync
- `GET /api/user/me` - Get current user
- `POST /api/user/add-favorite` - Add movie to favorites
- `POST /api/user/remove-favorite` - Remove movie from favorites
- `GET /api/user/favorites` - Get user's favorite movies

### Movie Endpoints
- `GET /api/movie/list` - Get all movies (paginated, filterable)
- `GET /api/movie/:id` - Get movie details
- `GET /api/movie/now-playing` - Get now playing movies from TMDB
- `POST /api/movie/add` - Add movie from TMDB (Admin only)
- `DELETE /api/movie/:id` - Delete movie (Admin only)

### Show Endpoints
- `GET /api/show/list` - Get all shows (paginated)
- `GET /api/show/:id` - Get show details
- `GET /api/show/available-dates` - Get available dates for a movie
- `GET /api/show/by-movie-date` - Get shows by movie and date
- `POST /api/show/add` - Create new show (Admin only)
- `DELETE /api/show/:id` - Delete show (Admin only)

### Booking Endpoints
- `POST /api/booking/create-stripe-session` - Create payment session
- `POST /api/booking/stripe-webhook` - Handle Stripe webhook
- `GET /api/booking/user-bookings` - Get user's bookings
- `GET /api/booking/admin-bookings` - Get all bookings (Admin only)
- `GET /api/booking/admin-stats` - Get dashboard statistics (Admin only)

### Inngest Endpoints
- `POST/GET /api/inngest` - Inngest webhook

## 💳 Database Schema

### User
```javascript
{
  clerkId: String (unique),
  name: String,
  email: String (unique),
  image: String,
  isAdmin: Boolean,
  favorites: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### Movie
```javascript
{
  title: String,
  overview: String,
  poster_path: String,
  backdrop_path: String,
  release_date: Date,
  genres: [String],
  cast: [String],
  tmdbId: Number (unique),
  language: String,
  rating: Number,
  trailer: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Show
```javascript
{
  movieId: ObjectId,
  date: Date,
  time: String,
  price: Number,
  totalSeats: Number,
  occupiedSeats: [String],
  lockedSeats: [{
    seatNumber: String,
    userId: String,
    bookedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Booking
```javascript
{
  userId: String (clerkId),
  showId: ObjectId,
  seats: [String],
  amount: Number,
  status: String (pending|confirmed|cancelled),
  paymentId: String,
  stripeSessionId: String,
  movieTitle: String,
  showDate: Date,
  showTime: String,
  createdAt: Date,
  expiresAt: Date,
  updatedAt: Date
}
```

## 🎯 Key Features Implementation

### Seat Booking Flow
1. User selects movie → date → show → seats
2. Seats are locked for 10 minutes
3. Stripe checkout session is created
4. Pending booking is stored in database
5. User completes Stripe payment
6. Stripe webhook confirms payment
7. Booking status changes to confirmed
8. Seats become permanently occupied
9. Confirmation email is sent
10. If payment fails/timeout, seats are released

### Admin Access
To make a user an admin:
1. Set `isAdmin: true` in Clerk user's public metadata
2. Or manually update in MongoDB: `User.updateOne({ clerkId: userId }, { isAdmin: true })`
3. Admin can then access `/admin/*` routes

### Email System
- Booking confirmation email (triggered after successful payment)
- Show reminder email (scheduled 8 hours before showtime)
- New show notification (sent when admin publishes new show)

## 📱 Responsive Design

The application is fully responsive:
- **Mobile**: Optimized for small screens with touch-friendly buttons
- **Tablet**: Adjusted layouts for medium screens
- **Desktop**: Full-featured experience with optimal spacing

## 🔐 Security Considerations

- All API keys stored in environment variables
- Stripe keys never exposed to frontend
- Clerk secret keys kept on backend only
- Admin routes protected with middleware
- CORS configured for frontend origin only
- Webhook verification using Svix for Clerk
- Stripe webhook signature verification
- MongoDB queries use proper parameterization

## 🚢 Deployment

### Deploy Backend to Render
1. Push code to GitHub
2. Connect GitHub repository to Render
3. Set environment variables in Render dashboard
4. Deploy

### Deploy Frontend to Vercel
1. Push code to GitHub
2. Connect GitHub repository to Vercel
3. Set environment variables (VITE_*)
4. Deploy

### Update Webhook URLs
After deployment, update:
- Clerk webhook URL in Clerk dashboard → `https://your-backend.com/api/user/webhooks`
- Stripe webhook URL in Stripe dashboard → `https://your-backend.com/api/booking/stripe-webhook`
- Inngest webhook URL (if using cloud)

## 🧪 Testing

### Local Testing Checklist
- [ ] Frontend starts: `cd client && npm run dev`
- [ ] Backend starts: `cd server && npm start`
- [ ] Can sign up/sign in with Clerk
- [ ] Movies load from database
- [ ] Can view movie details
- [ ] Can select shows and seats
- [ ] Stripe checkout works (use test cards)
- [ ] Booking confirmation received
- [ ] Can view bookings
- [ ] Can add/remove favorites
- [ ] Admin dashboard shows statistics
- [ ] Can add/manage shows as admin
- [ ] Responsive design works on mobile

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify connection string is correct
- Ensure IP address is whitelisted in MongoDB Atlas
- Check database name is "quickshow"

### Clerk Authentication Issues
- Verify CLERK_SECRET_KEY matches your backend environment
- Ensure webhook secret is correct for user sync
- Check Clerk dashboard for webhook delivery logs

### Stripe Payment Issues
- Use Stripe test cards: `4242 4242 4242 4242`
- Verify webhook is receiving payment events
- Check Stripe dashboard for webhook deliveries
- Ensure STRIPE_WEBHOOK_SECRET matches Stripe endpoint secret

### Email Not Sending
- Verify Gmail app password is correct (not regular password)
- Enable "Less secure app access" if needed
- Check spam folder
- Verify SENDER_EMAIL is configured

## 📚 Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [TMDB API Documentation](https://www.themoviedb.org/settings/api)
- [Inngest Documentation](https://www.inngest.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

QuickShow Development Team

---

**Happy Movie Booking! 🍿🎬**
