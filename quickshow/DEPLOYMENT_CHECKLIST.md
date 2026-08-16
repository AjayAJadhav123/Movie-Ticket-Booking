# QuickShow - Deployment & Launch Checklist

## ✅ PRE-LAUNCH CHECKLIST

### Step 1: Verify Project Structure (5 min)
- [ ] 50 files created
- [ ] Backend folder has: config/, controllers/, middleware/, models/, routes/, inngest/
- [ ] Frontend folder has: src/ (components/, context/, pages/), public/
- [ ] .gitignore configured
- [ ] README.md exists
- [ ] SETUP.md exists

```bash
# Verify from quickshow directory
tree /L 3  # Windows
ls -R     # Mac/Linux
```

### Step 2: Setup Environment Variables (15 min)

#### Backend (.env)
- [ ] MONGODB_URI configured
- [ ] CLERK_SECRET_KEY added
- [ ] CLERK_WEBHOOK_SECRET added
- [ ] STRIPE_SECRET_KEY added (starts with sk_test_)
- [ ] STRIPE_WEBHOOK_SECRET added
- [ ] TMDB_API_KEY added
- [ ] SENDER_EMAIL (Gmail) added
- [ ] SMTP_PASS (App Password) added
- [ ] FRONTEND_URL set to localhost:5173
- [ ] PORT set to 5000
- [ ] File saved as `.env` (not .env.example)

#### Frontend (.env)
- [ ] VITE_CLERK_PUBLISHABLE_KEY added
- [ ] VITE_BACKEND_URL set to http://localhost:5000
- [ ] VITE_STRIPE_PUBLIC_KEY added (starts with pk_test_)
- [ ] File saved as `.env` (not .env.example)

### Step 3: Install Dependencies (10 min)

```bash
# Backend
cd quickshow/server
npm install
# Check: node_modules/ folder created, package-lock.json generated

# Frontend
cd quickshow/client
npm install
# Check: node_modules/ folder created, package-lock.json generated
```

- [ ] Backend npm install successful
- [ ] Frontend npm install successful
- [ ] No peer dependency warnings (can be ignored)
- [ ] No critical vulnerabilities

### Step 4: Start Backend (5 min)

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

- [ ] Backend starts without errors
- [ ] MongoDB connection successful
- [ ] Server listening on port 5000
- [ ] Health check: curl http://localhost:5000/health

### Step 5: Start Frontend (5 min)

```bash
cd quickshow/client
npm run dev
```

Expected output:
```
VITE v5.0.8  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

- [ ] Frontend starts without errors
- [ ] Dev server running on port 5173
- [ ] No build errors in console
- [ ] Can access http://localhost:5173 in browser

---

## 🧪 FUNCTIONAL TESTING (30 min)

### Authentication Tests
- [ ] Sign Up page loads
- [ ] Can create account with email
- [ ] Clerk user sync works (check MongoDB)
- [ ] Can sign out
- [ ] Can sign in with created account
- [ ] Google OAuth option visible
- [ ] Phone OTP option visible

### Movie Browsing Tests
- [ ] Home page loads with hero section
- [ ] Movies display on home page
- [ ] Can navigate to /movies page
- [ ] Search functionality works
- [ ] Genre filters work
- [ ] Movie cards display correctly
- [ ] Responsive design works on mobile view

### Movie Details Tests
- [ ] Click movie → details page loads
- [ ] Movie info displays (title, overview, cast)
- [ ] Poster image loads
- [ ] Backdrop image shows
- [ ] Rating displays
- [ ] Genres display
- [ ] Cast members listed
- [ ] Watch trailer button works (if available)
- [ ] Trailer modal opens and plays
- [ ] Available shows list displays

### Seat Booking Tests
- [ ] Click show → seat layout page
- [ ] Seat grid displays (100 seats)
- [ ] Screen text visible at top
- [ ] Can click available seats (green)
- [ ] Selected seats turn pink
- [ ] Cannot click occupied seats (gray)
- [ ] Price updates when seats selected
- [ ] Can deselect seats
- [ ] Booking summary sidebar updates
- [ ] Total price calculated correctly

### Stripe Payment Tests
- [ ] Click "Proceed to Payment"
- [ ] Redirected to Stripe checkout
- [ ] Can enter test card: 4242 4242 4242 4242
- [ ] Can enter any future date
- [ ] Can enter any CVC
- [ ] Payment processes
- [ ] Success message appears
- [ ] Redirected back to app
- [ ] Booking appears in "My Bookings"
- [ ] Booking status is "confirmed"

### Bookings Tests
- [ ] Navigate to /my-bookings
- [ ] Booking appears in list
- [ ] Shows movie title
- [ ] Shows date and time
- [ ] Shows selected seats
- [ ] Shows total amount
- [ ] Shows booking status (confirmed)
- [ ] Booking ID visible

### Favorites Tests
- [ ] Click heart icon on movie card
- [ ] Heart fills with red
- [ ] Navigate to /favorites
- [ ] Movie appears in favorites
- [ ] Click heart again to remove
- [ ] Movie removed from favorites
- [ ] Favorites page shows "No favorites" when empty

### Admin Tests
- [ ] Set self as admin (MongoDB or Clerk metadata)
- [ ] Can access /admin/dashboard
- [ ] Dashboard shows statistics
- [ ] "Add New Show" button appears
- [ ] Can navigate to /admin/add-shows
- [ ] Can fill form and create show
- [ ] New show appears in /admin/list-shows
- [ ] Can delete show from list
- [ ] Can navigate to /admin/bookings
- [ ] Can view all bookings
- [ ] Can filter bookings by status

### UI/UX Tests
- [ ] Navigation bar works
- [ ] Mobile menu works
- [ ] All links functional
- [ ] Footer displays
- [ ] Loading spinners appear during requests
- [ ] Toast notifications appear
- [ ] No console errors (F12 DevTools)
- [ ] Responsive on mobile (375px)
- [ ] Responsive on tablet (768px)
- [ ] Responsive on desktop (1024px+)

### Database Tests
- [ ] User created in MongoDB users collection
- [ ] Movie can be added to database
- [ ] Show created with movieId reference
- [ ] Booking created with showId reference
- [ ] Seat locking works (check locked seats in show)
- [ ] Occupied seats persist after payment

### API Tests (Optional - using cURL or Postman)
```bash
# Get all movies
curl http://localhost:5000/api/movie/list

# Get movie by ID
curl http://localhost:5000/api/movie/{movieId}

# Get shows
curl http://localhost:5000/api/show/list

# Health check
curl http://localhost:5000/health
```

- [ ] All endpoints respond with 200 OK
- [ ] Response format is correct
- [ ] Error handling works for invalid requests

---

## 🔐 SECURITY VERIFICATION

- [ ] No secrets in .env.example
- [ ] No API keys in source code
- [ ] .env files in .gitignore
- [ ] CORS headers configured
- [ ] Admin routes protected with middleware
- [ ] Clerk authentication enforced on protected routes
- [ ] Stripe webhook verifies signature
- [ ] Input validation on forms
- [ ] No console.log statements with sensitive data

---

## 📊 PERFORMANCE CHECKS

- [ ] Page loads in < 3 seconds
- [ ] Movie grid loads smoothly
- [ ] Seat selection responsive
- [ ] No UI freezing
- [ ] Images load correctly
- [ ] No memory leaks (DevTools)
- [ ] Responsive without lag on mobile

---

## 📝 DOCUMENTATION VERIFICATION

- [ ] README.md is complete
- [ ] SETUP.md has all steps
- [ ] PROJECT_SUMMARY.md lists all features
- [ ] FILES_CREATED.md matches actual files
- [ ] API endpoints documented
- [ ] Database schema documented
- [ ] Environment variables documented
- [ ] Deployment steps clear

---

## 🚢 READY FOR DEPLOYMENT

### Before Deploying to Vercel (Frontend)

- [ ] Build frontend: `cd client && npm run build`
- [ ] dist/ folder created
- [ ] No build errors
- [ ] All files in dist/
- [ ] index.html exists in dist/

```bash
# Test build
npm run build
npm run preview
# Should see: Vite preview is running at http://localhost:5173/
```

### Before Deploying to Render (Backend)

- [ ] All environment variables added to Render dashboard
- [ ] MongoDB Atlas allows Render IP
- [ ] Start command: `node server.js`
- [ ] Build command: `npm install`
- [ ] Node version: 16+ (use 18 LTS recommended)
- [ ] Environment variables match .env.example

### Production Environment Variables

#### Vercel (Frontend)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx (after going live)
VITE_BACKEND_URL=https://your-render-backend.com
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx (after going live)
```

#### Render (Backend)
```
PORT=5000
MONGODB_URI=mongodb+srv://...
CLERK_SECRET_KEY=sk_live_xxxxx (after going live)
CLERK_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx (after going live)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
INNGEST_EVENT_KEY=xxxxx
INNGEST_SIGNING_KEY=xxxxx
TMDB_API_KEY=xxxxx
SENDER_EMAIL=xxxxx@gmail.com
SMTP_PASS=xxxxx
FRONTEND_URL=https://your-vercel-domain.com
```

### Update Webhook URLs (After Deployment)

#### In Clerk Dashboard
1. Go to Webhooks
2. Update endpoint: `https://your-render-backend/api/user/webhooks`
3. Test webhook

#### In Stripe Dashboard
1. Go to Developers → Webhooks
2. Update endpoint: `https://your-render-backend/api/booking/stripe-webhook`
3. Verify signature works

#### Test Production Webhooks
```bash
# Test Clerk webhook
curl -X POST https://your-backend/api/user/webhooks \
  -H "Content-Type: application/json" \
  -d '{"type":"user.created","data":{"id":"test"}}'

# Test Stripe webhook with test event from dashboard
```

---

## ✨ LAUNCH CHECKLIST

### Day Before Launch
- [ ] Final testing complete
- [ ] All features working
- [ ] No bugs or errors
- [ ] Database backup created
- [ ] Environment variables verified
- [ ] Documentation reviewed
- [ ] Team trained on admin dashboard

### Launch Day
- [ ] Deploy to Vercel
- [ ] Deploy to Render
- [ ] Monitor error logs
- [ ] Test from live URLs
- [ ] Verify payments work with test cards
- [ ] Check email notifications send
- [ ] Monitor database connections
- [ ] Monitor API response times

### Post-Launch
- [ ] Monitor for errors (next 24 hours)
- [ ] Check user signups working
- [ ] Verify bookings processing
- [ ] Monitor server performance
- [ ] Setup monitoring alerts
- [ ] Create backup schedule
- [ ] Document any issues
- [ ] Plan updates/improvements

---

## 📊 SUCCESS METRICS

You'll know everything is working when:

✅ Users can sign up and sign in
✅ Movies load and display correctly
✅ Seat selection works smoothly
✅ Stripe payments process successfully
✅ Bookings save to database
✅ Confirmation emails are sent
✅ Admin dashboard shows real data
✅ No console errors in browser
✅ No server errors in terminal
✅ Response times are < 500ms
✅ Mobile experience is smooth
✅ Pagination works for large data sets

---

## 🐛 TROUBLESHOOTING DURING LAUNCH

### If Something Breaks
1. Check error logs in terminal
2. Check browser console (F12)
3. Check MongoDB Atlas for connectivity
4. Verify environment variables
5. Check Clerk/Stripe dashboards
6. Review recent code changes
7. Restart server and frontend
8. Clear browser cache

### Common Issues & Solutions

**"Cannot GET /"**
- Solution: Frontend not deployed or wrong URL

**"MongoDB connection failed"**
- Solution: Check MONGODB_URI, verify IP whitelist

**"Invalid API Key"**
- Solution: Check STRIPE_SECRET_KEY matches account

**"Unauthorized"**
- Solution: Verify CLERK_SECRET_KEY and webhook secret

**"Payment failed"**
- Solution: Check Stripe test mode enabled, webhook working

---

## 🎉 LAUNCH COMPLETE!

Once all checks pass:

1. ✅ QuickShow is live!
2. ✅ Users can start booking tickets
3. ✅ Admins can manage shows
4. ✅ Payments are processing
5. ✅ Notifications are sending
6. ✅ Data is being tracked

---

## 📞 ONGOING MAINTENANCE

### Weekly
- [ ] Monitor error logs
- [ ] Check database size
- [ ] Verify backups ran

### Monthly
- [ ] Update dependencies: `npm audit`
- [ ] Review user analytics
- [ ] Check for security vulnerabilities
- [ ] Test payment processing
- [ ] Verify email delivery

### Quarterly
- [ ] Scale database if needed
- [ ] Update to latest Node/npm versions
- [ ] Security audit
- [ ] Performance optimization

---

**Your QuickShow application is ready to launch! 🚀🎬**
