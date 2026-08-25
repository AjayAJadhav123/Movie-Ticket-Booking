# QuickShow AI Recommendation Service - Deployment Guide

## Prerequisites
- Python 3.11+
- MongoDB Atlas connection string
- Git repository (GitHub recommended)

---

## Option 1: Deploy to Render.com (Recommended - Free Tier)

### Step 1: Prepare Your Repository
```bash
cd quickshow/ai-service
git add .
git commit -m "Prepare ML service for deployment"
git push origin main
```

### Step 2: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Connect your GitHub repository

### Step 3: Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your repository
3. Select the `ai-service` directory (or create separate repo)

### Step 4: Configure Service
- **Name**: `quickshow-ai-service`
- **Runtime**: Python 3
- **Region**: Oregon (or closest to your users)
- **Branch**: `main`
- **Root Directory**: `quickshow/ai-service` (if monorepo)
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 5: Set Environment Variables
In Render dashboard, add these environment variables:

```
MONGODB_URI=mongodb+srv://aj386092_db_user:YOUR_PASSWORD@cluster.mongodb.net/quickshow
CORS_ORIGINS=https://movie-ticket-booking-09ga.onrender.com,https://movie-ticket-booking-tan.vercel.app
LOG_LEVEL=INFO
ENV=production
```

### Step 6: Deploy
- Click "Create Web Service"
- Wait for build to complete (2-5 minutes)
- Check logs for successful deployment
- Your service will be available at: `https://quickshow-ai-service.onrender.com`

### Step 7: Update Backend .env
Add the AI service URL to your backend `.env`:
```
AI_SERVICE_URL=https://quickshow-ai-service.onrender.com
```

Also update in Render environment variables for backend service.

---

## Option 2: Deploy to Railway.app

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository

### Step 3: Configure Service
- Railway will auto-detect Python
- Set root directory: `quickshow/ai-service`
- Add environment variables (same as Render)

### Step 4: Deploy
- Railway will automatically deploy
- Get deployment URL from dashboard
- Update backend AI_SERVICE_URL

---

## Option 3: Deploy to Python Anywhere (Budget Option)

### Step 1: Create Account
1. Go to https://www.pythonanywhere.com
2. Create free account

### Step 2: Upload Files
1. Go to "Files" tab
2. Upload all files from `ai-service` folder
3. Upload requirements.txt

### Step 3: Create Virtual Environment
```bash
mkvirtualenv --python=/usr/bin/python3.11 quickshow-ml
pip install -r requirements.txt
```

### Step 4: Configure Web App
1. Go to "Web" tab
2. Add new web app
3. Choose Manual configuration
4. Python 3.11
5. Set WSGI file to load FastAPI app

### Step 5: Set Environment Variables
In WSGI configuration file, add:
```python
os.environ['MONGODB_URI'] = 'your_mongodb_uri'
os.environ['CORS_ORIGINS'] = 'your_origins'
```

---

## Option 4: Deploy to Heroku

### Step 1: Install Heroku CLI
```bash
# Windows (using chocolatey)
choco install heroku-cli

# Or download from https://devcenter.heroku.com/articles/heroku-cli
```

### Step 2: Login and Create App
```bash
cd quickshow/ai-service
heroku login
heroku create quickshow-ai-service
```

### Step 3: Set Environment Variables
```bash
heroku config:set MONGODB_URI="mongodb+srv://..."
heroku config:set CORS_ORIGINS="https://your-frontend.com"
heroku config:set LOG_LEVEL=INFO
```

### Step 4: Deploy
```bash
git add .
git commit -m "Deploy ML service"
git push heroku main
```

### Step 5: Verify
```bash
heroku logs --tail
heroku open /health
```

---

## Testing Your Deployment

### 1. Health Check
```bash
curl https://your-ml-service.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "QuickShow Recommendation Engine",
  "ml_models_loaded": true
}
```

### 2. Test Recommendations Endpoint
```bash
curl "https://your-ml-service.com/api/recommendations/user_test_123?limit=5"
```

### 3. Test API Documentation
Visit: `https://your-ml-service.com/docs`

---

## Updating Backend Configuration

Once deployed, update your main backend:

### 1. Update Server .env (Local)
```env
AI_SERVICE_URL=https://quickshow-ai-service.onrender.com
```

### 2. Update Render Environment Variables (Production)
In your backend Render service, add/update:
```
AI_SERVICE_URL=https://quickshow-ai-service.onrender.com
```

### 3. Verify Backend Connection
Check backend logs to ensure it can connect to ML service.

---

## Monitoring & Maintenance

### Render.com
- Check logs: Render Dashboard → Your Service → Logs
- Monitor uptime: Dashboard shows service status
- Free tier: Auto-sleeps after 15 mins inactivity

### Railway.app
- Logs available in dashboard
- Metrics tab shows resource usage
- $5 free credit per month

### Health Checks
Set up monitoring with:
- **UptimeRobot** (free): https://uptimerobot.com
- **Better Uptime**: https://betteruptime.com
- Ping `/health` endpoint every 5-10 minutes

---

## Troubleshooting

### Issue: Service Not Starting
**Check**: `requirements.txt` has all dependencies
**Fix**: Add missing packages to requirements.txt

### Issue: Models Not Loading
**Check**: MongoDB connection string is correct
**Fix**: Verify MONGODB_URI environment variable

### Issue: CORS Errors
**Check**: CORS_ORIGINS includes your backend URL
**Fix**: Add backend URL to CORS_ORIGINS env var

### Issue: 503 Errors from Backend
**Check**: AI_SERVICE_URL is correct in backend
**Fix**: Update backend environment variables

### Issue: Free Tier Sleeping
**Solution**: Use cron job to ping service every 10 mins
```bash
# Add to cron or use UptimeRobot
curl https://your-ml-service.com/health
```

---

## Cost Estimates

### Free Tiers
- **Render**: Free (sleeps after 15 min inactivity)
- **Railway**: $5 credit/month (then ~$5-10/month)
- **PythonAnywhere**: Free (limited resources)
- **Heroku**: No longer has free tier

### Paid Options
- **Render**: $7/month (Starter plan, no sleep)
- **Railway**: Pay-as-you-go (~$5-15/month)
- **Heroku**: $7/month (Eco Dynos)

---

## Performance Optimization

### 1. Enable Caching
Add Redis caching for frequent recommendations

### 2. Optimize Models
Use pickle/joblib to pre-load ML models

### 3. Database Connection Pooling
Configure MongoDB connection pool in production

### 4. Use CDN
For static assets if any

---

## Security Checklist

- ✅ Environment variables (no secrets in code)
- ✅ CORS properly configured
- ✅ HTTPS enabled (automatic on most platforms)
- ✅ API rate limiting (add if needed)
- ✅ Input validation (already implemented)
- ✅ MongoDB connection string secured

---

## Next Steps

1. ✅ Deploy ML service to Render/Railway
2. ✅ Update backend AI_SERVICE_URL
3. ✅ Test all recommendation endpoints
4. ✅ Set up monitoring/alerts
5. ✅ Test recommendation features in production

---

## Support & Documentation

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Render Docs**: https://render.com/docs
- **Railway Docs**: https://docs.railway.app
- **MongoDB Atlas**: https://docs.atlas.mongodb.com

For issues, check logs and verify environment variables first.
