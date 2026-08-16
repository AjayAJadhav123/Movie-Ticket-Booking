# QuickShow - Setup & Installation Guide

## 🎯 Complete Setup Instructions

### Step 1: Get API Keys & Credentials

Before starting, gather these credentials:

#### MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/quickshow?retryWrites=true&w=majority`
5. Whitelist your IP address

#### Clerk
1. Go to [Clerk.com](https://clerk.com)
2. Create an account and app
3. Go to API Keys
4. Get:
   - `CLERK_PUBLISHABLE_KEY` (for frontend)
   - `CLERK_SECRET_KEY` (for backend)
5. Go to Webhooks and create a webhook:
   - URL: `http://localhost:5000/api/user/webhooks`
   - Events: user.created, user.updated, user.deleted
   - Get `CLERK_WEBHOOK_SECRET`

#### Stripe
1. Go to [Stripe.com](https://stripe.com)
2. Create an account
3. Go to Developers → API Keys
4. Get:
   - `STRIPE_PUBLIC_KEY` (starts with pk_test_)
   - `STRIPE_SECRET_KEY` (starts with sk_test_)
5. Go to Developers → Webhooks
6. Create webhook for: `http://localhost:5000/api/booking/stripe-webhook`
7. Get `STRIPE_WEBHOOK_SECRET` from the webhook details
8. Test with card: `4242 4242 4242 4242`, any future date, any CVC

#### TMDB API
1. Go to [TMDB.org](https://www.themoviedb.org)
2. Create an account
3. Go to Settings → API
4. Request API key
5. Get `TMDB_API_KEY`

#### Gmail (for emails)
1. Enable 2-Factor Authentication on Gmail
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Select Mail and Windows Computer
4. Get App Password
5. Use as `SMTP_PASS`

#### Inngest (Optional - for background jobs)
1. Go to [Inngest.com](https://www.inngest.com)
2. Create account
3. Get `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`
4. (Can use test mode without signing up)

---

### Step 2: Install Dependencies

#### Backend
```bash
cd quickshow/server
npm install
```

#### Frontend
```bash
cd quickshow/client
npm install
```

---

### Step 3: Configure Environment Variables

#### Backend Configuration

Create `quickshow/server/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/quickshow?retryWrites=true&w=majority

# Clerk
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# TMDB
TMDB_API_KEY=your_tmdb_api_key_here

# Email
SENDER_EMAIL=your_email@gmail.com
SMTP_PASS=your_16_char_app_password

# Inngest
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

#### Frontend Configuration

Create `quickshow/client/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_BACKEND_URL=http://localhost:5000
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### Step 4: Start the Application

#### Terminal 1: Start Backend
```bash
cd quickshow/server
npm start
```

Expected output:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
✅ QuickShow server running on port 5000
🚀 Environment: development
```

#### Terminal 2: Start Frontend
```bash
cd quickshow/client
npm run dev
```

Expected output:
```
  VITE v5.0.8  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Press h to show help
```

---

### Step 5: Test the Application

1. **Open** `http://localhost:5173` in your browser
2. **Sign Up** with Clerk
3. **Verify** MongoDB has created user document
4. **Add Movies** by clicking "Add New Show" in admin dashboard (after making yourself admin)
5. **Create Shows** for movies
6. **Book Tickets** and test Stripe payment

---

### Step 6: Make Yourself Admin

#### Option A: Via MongoDB
```bash
# Connect to MongoDB Atlas or local MongoDB
db.users.updateOne(
  { clerkId: "your_clerk_id_here" },
  { $set: { isAdmin: true } }
)
```

#### Option B: Via Clerk Dashboard
1. Go to Clerk Dashboard
2. Find your user
3. In publicMetadata, add: `{ "isAdmin": true }`

---

### Step 7: Add Sample Movies

1. Go to `/admin/add-shows`
2. Get a movie ID from TMDB API (e.g., Dune = 438631)
3. Add movies to database
4. Create shows for each movie with dates/times

---

## 🧪 Testing Checklist

### Functionality Tests
- [ ] Sign up/Sign in works
- [ ] Movies load on home page
- [ ] Can browse all movies
- [ ] Search and filters work
- [ ] Movie details page works
- [ ] Can view available shows for a movie
- [ ] Can select seats (visual feedback works)
- [ ] Occupied seats cannot be selected
- [ ] Stripe checkout initiates
- [ ] Test payment succeeds with `4242 4242 4242 4242`
- [ ] Booking appears in "My Bookings"
- [ ] Can add/remove favorites
- [ ] Admin dashboard shows statistics
- [ ] Can add new shows as admin
- [ ] Can delete shows as admin
- [ ] Can view all bookings as admin

### API Tests

Use Postman or cURL:

#### Get All Movies
```bash
curl http://localhost:5000/api/movie/list
```

#### Get Shows for a Movie
```bash
curl "http://localhost:5000/api/show/list?movieId=YOUR_MOVIE_ID"
```

#### Create Booking Session
```bash
curl -X POST http://localhost:5000/api/booking/create-stripe-session \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "showId": "YOUR_SHOW_ID",
    "seats": ["1", "2", "3"]
  }'
```

---

## 🚀 Deployment

### Deploy to Vercel (Frontend)

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import `client` folder
4. Set environment variables:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=xxxxx
   VITE_BACKEND_URL=https://your-backend.com
   VITE_STRIPE_PUBLIC_KEY=xxxxx
   ```
5. Deploy

### Deploy to Render (Backend)

1. Push code to GitHub
2. Go to [Render](https://render.com)
3. Create new Web Service
4. Connect GitHub repository (server folder)
5. Set environment variables (all .env variables)
6. Set build command: `npm install`
7. Set start command: `node server.js`
8. Deploy

### Update Webhook URLs

After deployment:

#### In Clerk Dashboard
- Go to Webhooks
- Update endpoint URL to: `https://your-render-backend.com/api/user/webhooks`

#### In Stripe Dashboard
- Go to Developers → Webhooks
- Edit endpoint URL to: `https://your-render-backend.com/api/booking/stripe-webhook`

#### In Frontend
- Update `VITE_BACKEND_URL` in Vercel to production backend URL

---

## 🐛 Troubleshooting

### Frontend Won't Load
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### MongoDB Connection Error
```
❌ MongoDB Connection Error: connect ECONNREFUSED

Solution:
1. Check connection string is correct
2. Verify IP whitelist in MongoDB Atlas
3. Check firewall settings
4. Ensure database name is "quickshow"
```

### Stripe Payment Fails
```
Error: Invalid API Key provided

Solution:
1. Verify STRIPE_SECRET_KEY starts with "sk_test_"
2. Check key matches your Stripe account
3. Ensure webhook secret is set correctly
4. Try with test card: 4242 4242 4242 4242
```

### Clerk Authentication Issue
```
Error: Unauthorized

Solution:
1. Verify CLERK_SECRET_KEY is correct
2. Check CLERK_WEBHOOK_SECRET matches Clerk dashboard
3. Ensure webhook is enabled in Clerk
4. Clear browser cache/cookies
```

### Emails Not Sending
```
Error: Authentication failed

Solution:
1. Use Gmail App Password (not regular password)
2. Enable "Less secure app access" if not using 2FA
3. Verify email format is correct
4. Check SENDER_EMAIL matches Gmail address
```

---

## 📊 Database Setup

### Collections Created Automatically

When the application runs, these collections are created:

```
quickshow/
├── users
├── movies
├── shows
└── bookings
```

### Manual Data Setup (Optional)

#### Add Test Movie
```javascript
db.movies.insertOne({
  title: "Dune",
  overview: "Paul Atreides...",
  poster_path: "/path/to/poster.jpg",
  backdrop_path: "/path/to/backdrop.jpg",
  release_date: new Date("2021-10-22"),
  genres: ["Action", "Adventure"],
  cast: ["Timothée Chalamet", "Zendaya"],
  tmdbId: 438631,
  language: "en",
  rating: 8.0,
  trailer: "https://www.youtube.com/watch?v=n9xhJrCcL8E"
})
```

#### Add Test Show
```javascript
db.shows.insertOne({
  movieId: ObjectId("..."),
  date: new Date("2026-08-20T14:00:00Z"),
  time: "14:00",
  price: 12.99,
  totalSeats: 100,
  occupiedSeats: [],
  lockedSeats: []
})
```

---

## 🔐 Security Best Practices

1. **Never commit .env files**
   - Keep .gitignore with .env, .env.local, etc.

2. **Use environment variables for all secrets**
   - No hardcoded API keys in code

3. **Rotate credentials regularly**
   - Especially Stripe and Clerk keys

4. **HTTPS in production**
   - Always use HTTPS, never HTTP

5. **Keep dependencies updated**
   ```bash
   npm outdated
   npm update
   ```

6. **Use strong passwords**
   - MongoDB, Clerk, Stripe passwords should be strong

---

## 📞 Support

For issues:
1. Check error logs in terminal
2. Check browser console (F12)
3. Review README.md
4. Check API docs for specific services
5. Review code comments

---

**Setup complete! Happy coding! 🎬🍿**
