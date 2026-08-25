# QuickShow ML Service - Deployment Complete ✅

## 📁 Files Created

All necessary deployment files have been created in `quickshow/ai-service/`:

### Core Files (Already Exist)
- ✅ `main.py` - FastAPI application
- ✅ `recommendation_engine.py` - Recommendation logic
- ✅ `ml_recommendation_service.py` - ML model service
- ✅ `requirements.txt` - Python dependencies
- ✅ `.env.example` - Environment template

### New Deployment Files (Just Created)
- ✅ `render.yaml` - Render.com deployment configuration
- ✅ `Procfile` - Process file for Heroku/Railway
- ✅ `runtime.txt` - Python version specification
- ✅ `.gitignore` - Git ignore rules for Python
- ✅ `README.md` - Service documentation
- ✅ `DEPLOYMENT.md` - Comprehensive deployment guide
- ✅ `deploy.sh` - Linux/Mac deployment script
- ✅ `deploy.bat` - Windows deployment script
- ✅ `test_service.py` - Test script to verify service

### Quick Reference
- ✅ `ML_DEPLOYMENT_QUICKSTART.md` - 5-minute deployment guide (root folder)
- ✅ `AI_SERVICE_DEPLOYMENT_SUMMARY.md` - This file

---

## 🚀 How to Deploy (Choose One)

### Option 1: Render.com (Recommended - FREE)
**Time**: 5 minutes | **Cost**: Free (with sleep) or $7/month (always-on)

1. Push code to GitHub
2. Go to https://render.com
3. Sign up with GitHub
4. Create "New Web Service"
5. Select repository
6. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Add environment variables (MONGODB_URI, CORS_ORIGINS)
8. Deploy!

**Result**: `https://quickshow-ai-service.onrender.com`

---

### Option 2: Railway.app
**Time**: 5 minutes | **Cost**: $5 free credit, then ~$5-10/month

1. Push code to GitHub
2. Go to https://railway.app
3. Sign up with GitHub
4. Create "New Project" → "Deploy from GitHub"
5. Railway auto-detects Python
6. Add environment variables
7. Deploy!

**Result**: `https://quickshow-ai-service.railway.app`

---

### Option 3: Local Testing First
**Time**: 2 minutes

```bash
# Windows
cd quickshow\ai-service
deploy.bat

# Linux/Mac
cd quickshow/ai-service
chmod +x deploy.sh
./deploy.sh
```

**Access**: http://localhost:8000

---

## 📝 Environment Variables Needed

When deploying, set these environment variables:

```env
# Required
MONGODB_URI=mongodb+srv://aj386092_db_user:YOUR_PASSWORD@cluster.mongodb.net/quickshow

# Required - Your backend and frontend URLs
CORS_ORIGINS=https://movie-ticket-booking-09ga.onrender.com,https://movie-ticket-booking-tan.vercel.app

# Optional
LOG_LEVEL=INFO
ENV=production
```

**⚠️ Important**: Replace `YOUR_PASSWORD` with your actual MongoDB password!

---

## 🔗 After Deployment - Update Backend

### Step 1: Get Your ML Service URL
After deployment, you'll get a URL like:
- Render: `https://quickshow-ai-service.onrender.com`
- Railway: `https://quickshow-ai-service.railway.app`

### Step 2: Update Backend Environment

**Production (Render Dashboard)**:
1. Go to your backend service on Render
2. Environment → Add Variable
3. Key: `AI_SERVICE_URL`
4. Value: `https://quickshow-ai-service.onrender.com`
5. Save Changes

**Local Development**:
Update `quickshow/server/.env`:
```env
AI_SERVICE_URL=https://quickshow-ai-service.onrender.com
```

---

## 🧪 Testing Your Deployment

### Test 1: Health Check
```bash
curl https://quickshow-ai-service.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "QuickShow Recommendation Engine",
  "ml_models_loaded": true
}
```

### Test 2: API Documentation
Visit: `https://quickshow-ai-service.onrender.com/docs`

You should see the interactive Swagger UI.

### Test 3: Get Recommendations
```bash
curl "https://quickshow-ai-service.onrender.com/api/recommendations/user_123?limit=5"
```

### Test 4: Run Test Script (Local)
```bash
cd quickshow/ai-service
python test_service.py https://quickshow-ai-service.onrender.com
```

---

## 📊 Service Endpoints

Once deployed, your ML service provides:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/docs` | GET | API documentation |
| `/api/recommendations/{user_id}` | GET | User recommendations |
| `/api/recommendations/movie/{movie_id}` | GET | Similar movies |
| `/api/recommendations/personalized` | POST | Personalized recommendations |

---

## ✅ Deployment Checklist

Use this checklist to ensure successful deployment:

### Pre-Deployment
- [ ] All files are in `quickshow/ai-service/` folder
- [ ] `requirements.txt` has all dependencies
- [ ] `.env.example` is updated (don't commit .env!)
- [ ] Code is committed to Git
- [ ] Code is pushed to GitHub

### Deployment
- [ ] Created account on Render/Railway
- [ ] Created new web service
- [ ] Configured build and start commands
- [ ] Added MONGODB_URI environment variable
- [ ] Added CORS_ORIGINS environment variable
- [ ] Started deployment
- [ ] Deployment completed successfully

### Post-Deployment
- [ ] Tested `/health` endpoint
- [ ] Tested `/docs` page
- [ ] Tested recommendations endpoint
- [ ] Updated backend `AI_SERVICE_URL`
- [ ] Redeployed backend with new AI_SERVICE_URL
- [ ] Tested recommendations from frontend

### Optional
- [ ] Set up monitoring (UptimeRobot)
- [ ] Set up cron job to prevent cold starts
- [ ] Reviewed logs for errors
- [ ] Considered upgrading to paid plan

---

## 💡 Pro Tips

1. **Free Tier Sleep**: Render free tier sleeps after 15 mins. First request takes ~30 seconds to wake up.

2. **Prevent Sleep**: Use UptimeRobot (free) to ping your `/health` endpoint every 10 minutes.

3. **Monitor Logs**: 
   - Render: Dashboard → Your Service → Logs
   - Railway: Dashboard → Deployments → Logs

4. **Performance**: 
   - Free tier is fine for low-medium traffic
   - Upgrade to $7/month for always-on + better performance

5. **Scaling**: Service auto-scales on most platforms. No config needed.

---

## 🔧 Troubleshooting

### Problem: Service won't start
**Solution**: Check logs for errors. Usually missing environment variables.

### Problem: MongoDB connection failed
**Solution**: Verify MONGODB_URI is correct. Check MongoDB Atlas whitelist (allow 0.0.0.0/0).

### Problem: CORS errors in frontend
**Solution**: Add your frontend URL to CORS_ORIGINS environment variable.

### Problem: 503 errors from backend
**Solution**: Verify AI_SERVICE_URL is set correctly in backend environment.

### Problem: Recommendations not working
**Solution**: Check ML service logs. Verify MongoDB has movie data.

---

## 📚 Documentation

- **Quick Start**: `ML_DEPLOYMENT_QUICKSTART.md` (root folder)
- **Full Deployment Guide**: `quickshow/ai-service/DEPLOYMENT.md`
- **Service README**: `quickshow/ai-service/README.md`
- **API Docs**: Visit `/docs` on your deployed service

---

## 💰 Pricing Summary

### Free Options
- **Render**: Free tier with sleep (750 hours/month)
- **Railway**: $5 free credit per month
- **Total Cost**: $0 for testing/low traffic

### Recommended for Production
- **Render Starter**: $7/month (no sleep, better performance)
- **Railway Usage**: ~$5-10/month (pay for what you use)

### Cost for Full Stack
- Frontend (Vercel): Free
- Backend (Render): $7/month or Free
- ML Service (Render): $7/month or Free
- Database (MongoDB Atlas): Free (512MB)
- **Total**: $0-14/month

---

## 🎯 Next Steps

1. ✅ Deploy ML service (5 mins)
2. ✅ Test endpoints (2 mins)
3. ✅ Update backend AI_SERVICE_URL (1 min)
4. ✅ Test from frontend (2 mins)
5. ⬜ Set up monitoring (optional, 5 mins)
6. ⬜ Review logs for any issues

---

## 📞 Support Resources

- **Render Support**: https://render.com/docs
- **Railway Support**: https://docs.railway.app
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **MongoDB Atlas**: https://docs.atlas.mongodb.com

---

## 🎉 You're Ready!

Everything is set up and ready to deploy. Follow the **Quick Start** guide in `ML_DEPLOYMENT_QUICKSTART.md` and you'll have your ML service running in 5 minutes!

**Recommended Next Action**: Follow Option 1 (Render.com) from the Quick Start guide.

Good luck! 🚀
