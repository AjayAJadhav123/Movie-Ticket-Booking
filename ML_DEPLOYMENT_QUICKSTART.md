# ML Service Deployment - Quick Start Guide

## 🚀 Fastest Way to Deploy (5 Minutes)

### Step 1: Push to GitHub
```bash
cd "c:\Users\aj386\Desktop\Movie Ticket Booking"
git add quickshow/ai-service/
git commit -m "Add ML recommendation service"
git push origin main
```

### Step 2: Deploy to Render.com (FREE)

1. **Go to**: https://render.com
2. **Sign up** with GitHub
3. **Click**: "New +" → "Web Service"
4. **Select**: Your GitHub repository
5. **Configure**:
   - **Name**: `quickshow-ai-service`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: Leave blank (or `quickshow/ai-service` if monorepo)

6. **Environment Variables** (Add these):
   ```
   MONGODB_URI=mongodb+srv://aj386092_db_user:YOUR_PASSWORD@cluster.mongodb.net/quickshow
   CORS_ORIGINS=https://movie-ticket-booking-09ga.onrender.com,https://movie-ticket-booking-tan.vercel.app
   LOG_LEVEL=INFO
   ENV=production
   ```

7. **Click**: "Create Web Service"

### Step 3: Get Your ML Service URL
After deployment completes (2-5 minutes), you'll get a URL like:
```
https://quickshow-ai-service.onrender.com
```

### Step 4: Update Backend Configuration

**In Render Dashboard** (for your backend service):
- Go to your backend service settings
- Add/Update environment variable:
  ```
  AI_SERVICE_URL=https://quickshow-ai-service.onrender.com
  ```

**Local Development** (in `quickshow/server/.env`):
```env
AI_SERVICE_URL=https://quickshow-ai-service.onrender.com
```

### Step 5: Test Your Deployment

**Health Check**:
```
https://quickshow-ai-service.onrender.com/health
```

**API Documentation**:
```
https://quickshow-ai-service.onrender.com/docs
```

**Test Recommendations**:
```
https://quickshow-ai-service.onrender.com/api/recommendations/user_test_123?limit=5
```

---

## 📝 Complete Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create Render account
- [ ] Deploy ML service
- [ ] Set environment variables (MONGODB_URI, CORS_ORIGINS)
- [ ] Verify deployment (check /health endpoint)
- [ ] Update backend AI_SERVICE_URL
- [ ] Test recommendations from frontend
- [ ] Set up monitoring (optional)

---

## 🔧 Environment Variables Reference

### Required
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quickshow
CORS_ORIGINS=https://your-backend.onrender.com,https://your-frontend.vercel.app
```

### Optional
```env
LOG_LEVEL=INFO
ENV=production
PORT=8000  # Render sets this automatically
HOST=0.0.0.0  # Render sets this automatically
```

---

## 📊 Testing Endpoints

### Local Testing (Before Deployment)
```bash
# Start service locally
cd quickshow/ai-service
python main.py

# Test in browser
http://localhost:8000/health
http://localhost:8000/docs
```

### Production Testing (After Deployment)
```bash
# Health check
curl https://quickshow-ai-service.onrender.com/health

# Get recommendations
curl "https://quickshow-ai-service.onrender.com/api/recommendations/user_123?limit=5"

# Similar movies
curl "https://quickshow-ai-service.onrender.com/api/recommendations/movie/550?limit=5"
```

---

## 🎯 Quick Troubleshooting

### Issue: Build Failed
**Check**: `requirements.txt` is in the correct directory
**Fix**: Verify all files are committed and pushed

### Issue: Service Won't Start
**Check**: Environment variables are set correctly
**Fix**: Go to Render dashboard → Environment → Verify MONGODB_URI

### Issue: 503 Errors
**Check**: Free tier services sleep after 15 mins of inactivity
**Fix**: 
- First request after sleep takes ~30 seconds
- Upgrade to paid plan ($7/month) for always-on
- Or use UptimeRobot to ping every 10 mins

### Issue: CORS Errors
**Check**: CORS_ORIGINS includes your backend URL
**Fix**: Update environment variable with correct URLs

### Issue: MongoDB Connection Failed
**Check**: MongoDB connection string is correct
**Fix**: Copy connection string from MongoDB Atlas dashboard

---

## 💡 Pro Tips

1. **Free Tier Limitations**:
   - Service sleeps after 15 minutes of inactivity
   - Cold start takes ~30 seconds
   - 750 hours/month free (enough for 24/7 operation)

2. **Avoid Cold Starts**:
   - Use cron job to ping `/health` every 10 minutes
   - Or use UptimeRobot (free) to monitor service

3. **Monitor Your Service**:
   - Render Dashboard → Logs (real-time)
   - Set up UptimeRobot for uptime monitoring
   - Check metrics in Render dashboard

4. **Scaling**:
   - Free tier: 512MB RAM, 0.1 CPU
   - Starter ($7/mo): 512MB RAM, 0.5 CPU, no sleep
   - Standard ($25/mo): 2GB RAM, 1 CPU

---

## 📦 Files Created for Deployment

All files are ready in `quickshow/ai-service/`:
- ✅ `render.yaml` - Render configuration
- ✅ `Procfile` - Process configuration  
- ✅ `runtime.txt` - Python version
- ✅ `requirements.txt` - Dependencies
- ✅ `.gitignore` - Git ignore rules
- ✅ `DEPLOYMENT.md` - Full deployment guide
- ✅ `README.md` - Service documentation
- ✅ `deploy.sh` - Linux/Mac deployment script
- ✅ `deploy.bat` - Windows deployment script

---

## 🔗 Useful Links

- **Render**: https://render.com
- **Render Docs**: https://render.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **UptimeRobot**: https://uptimerobot.com (free monitoring)

---

## 🎬 Next Steps After Deployment

1. ✅ ML service deployed and accessible
2. ✅ Backend updated with AI_SERVICE_URL
3. ⬜ Test recommendations in production frontend
4. ⬜ Monitor service logs for errors
5. ⬜ Set up uptime monitoring (optional)
6. ⬜ Consider upgrading to paid plan if needed

---

## 💰 Cost Breakdown

### Free Tier (Perfect for Testing)
- **Cost**: $0/month
- **Limitations**: Sleeps after 15 mins
- **Best for**: Development, low-traffic apps

### Starter Plan (Recommended for Production)
- **Cost**: $7/month
- **Benefits**: No sleep, faster performance
- **Best for**: Production apps, better UX

### Alternative: Railway.app
- **Free**: $5 credit/month
- **Paid**: ~$5-10/month usage-based
- **Benefit**: More generous free tier

---

## 📞 Support

If you encounter issues:
1. Check Render logs in dashboard
2. Review DEPLOYMENT.md for detailed troubleshooting
3. Test endpoints with `/docs` page
4. Verify environment variables are set correctly

**Everything is ready to deploy! Just follow the steps above.** 🚀
