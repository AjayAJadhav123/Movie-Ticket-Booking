# QuickShow Production Deployment Guide

## Environment Variables for Render (Backend)

Set these environment variables in your Render dashboard:

### Core Configuration
```
NODE_ENV=production
PORT=5000
```

### Database
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quickshow?retryWrites=true&w=majority
```

### Authentication (Clerk)
```
CLERK_SECRET_KEY=sk_live_your_clerk_secret_key
CLERK_WEBHOOK_SECRET=whsec_your_clerk_webhook_secret
CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_publishable_key
CLERK_JWT_KEY=your_clerk_jwt_public_key
```

### Payment Gateways
```
# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Cashfree Production
CASHFREE_APP_ID=your_production_cashfree_app_id
CASHFREE_SECRET_KEY=your_production_cashfree_secret_key
CASHFREE_ENV=PRODUCTION
CASHFREE_WEBHOOK_SECRET=your_cashfree_webhook_secret
```

### APIs & Services
```
TMDB_API_KEY=your_tmdb_api_key
OPENAI_API_KEY=your_openai_api_key
```

### Security
```
JWT_SECRET=your_32_character_jwt_secret_key_minimum_32_chars_required
```

### Email Service
```
SENDER_EMAIL=your_email@gmail.com
SMTP_PASS=your_app_password
RESEND_API_KEY=your_resend_api_key
```

### URLs (Critical for CORS)
```
FRONTEND_URL=https://movie-ticket-booking-tan.vercel.app
BACKEND_URL=https://movie-ticket-booking-09ga.onrender.com
```

### Optional Services
```
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

---

## Environment Variables for Vercel (Frontend)

Set these in your Vercel project settings:

```
VITE_BACKEND_URL=https://movie-ticket-booking-09ga.onrender.com
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_publishable_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
```

---

## CORS Configuration Fixed

The backend now allows requests from:
- ✅ `https://movie-ticket-booking-tan.vercel.app` (Production)
- ✅ Development URLs (localhost:3000, 5173, 5174, 5175)

---

## API Endpoints Fixed

### /api/movie/latest
- ✅ Now properly configured for production
- ✅ Includes TMDB API key validation
- ✅ Proper error handling for TMDB service unavailability

### /api/movie/search
- ✅ Search functionality working
- ✅ Database + TMDB search implemented
- ✅ Proper pagination and error handling

---

## Testing URLs

Once deployed, test these endpoints:

```bash
# Movie APIs
GET https://movie-ticket-booking-09ga.onrender.com/api/movie/latest
GET https://movie-ticket-booking-09ga.onrender.com/api/movie/search?query=avatar
GET https://movie-ticket-booking-09ga.onrender.com/api/movie/popular

# Health Check
GET https://movie-ticket-booking-09ga.onrender.com/health
```

---

## Common Issues & Solutions

### 1. CORS Errors
- **Issue:** `No Access-Control-Allow-Origin header`
- **Solution:** Ensure `FRONTEND_URL` is set correctly in Render environment variables

### 2. TMDB API Errors
- **Issue:** `TMDB API key not configured`
- **Solution:** Set `TMDB_API_KEY` in Render environment variables

### 3. 500 Server Errors
- **Check:** Render logs for specific error messages
- **Common causes:**
  - Missing environment variables
  - Database connection issues
  - TMDB API rate limits

### 4. Authentication Issues
- **Ensure:** All Clerk environment variables are set
- **Check:** Clerk webhook URL is configured correctly

---

## Deployment Order

1. **Deploy Backend to Render**
   - Set all environment variables listed above
   - Verify deployment succeeds
   - Test health endpoint

2. **Deploy Frontend to Vercel**
   - Set frontend environment variables
   - Verify build succeeds
   - Test CORS connectivity

3. **Configure Webhooks**
   - Clerk: `https://movie-ticket-booking-09ga.onrender.com/api/user/webhooks`
   - Cashfree: `https://movie-ticket-booking-09ga.onrender.com/api/booking/cashfree-webhook`
   - Stripe: `https://movie-ticket-booking-09ga.onrender.com/api/booking/stripe-webhook`

4. **Final Testing**
   - User authentication
   - Movie browsing
   - Payment flow
   - Booking creation

---

## Security Notes

- ✅ CORS properly configured for production domain only
- ✅ CSP headers allow necessary external services
- ✅ All secrets in environment variables (not in code)
- ✅ Production payment gateways configured
- ✅ Webhook signature verification enabled