# QuickShow AI Recommendation Service

AI-powered movie recommendation engine built with FastAPI and scikit-learn.

## Features

- 🎬 Personalized movie recommendations based on user history
- 🤖 ML-powered content-based filtering
- 🔥 Real-time recommendation generation
- 📊 RESTful API with automatic documentation
- 🚀 Fast and scalable with FastAPI

## Tech Stack

- **Framework**: FastAPI
- **ML Library**: scikit-learn, pandas, numpy
- **Database**: MongoDB Atlas
- **Server**: Uvicorn (ASGI)
- **Language**: Python 3.11+

## Local Development

### Prerequisites
- Python 3.11 or higher
- MongoDB Atlas connection string
- pip (Python package manager)

### Quick Start

#### Windows
```bash
# Run the deployment script
deploy.bat
```

#### Linux/Mac
```bash
# Make script executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh
```

#### Manual Setup
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Create .env file
cp .env.example .env

# 3. Update .env with your MongoDB URI
# Edit .env and add your MongoDB connection string

# 4. Start the service
python main.py
```

### Access the Service

- **API Base URL**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Alternative Docs**: http://localhost:8000/redoc

## API Endpoints

### Health Check
```bash
GET /health
```

### Get Recommendations for User
```bash
GET /api/recommendations/{user_id}?limit=10&exclude_watched=true
```

### Get Similar Movies
```bash
GET /api/recommendations/movie/{movie_id}?limit=5
```

### Get Personalized Recommendations
```bash
POST /api/recommendations/personalized
Content-Type: application/json

{
  "watched_ids": ["movie_id_1", "movie_id_2"],
  "limit": 10
}
```

## Environment Variables

Create a `.env` file with the following:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quickshow

# CORS Configuration
CORS_ORIGINS=http://localhost:5000,https://your-backend-domain.com

# Logging
LOG_LEVEL=INFO

# Environment
ENV=development
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for:
- Render.com (Recommended - Free Tier)
- Railway.app
- Heroku
- PythonAnywhere

### Quick Deploy to Render

1. Push code to GitHub
2. Create account on render.com
3. Create new Web Service
4. Connect GitHub repository
5. Set environment variables
6. Deploy!

**Files included for deployment**:
- `render.yaml` - Render configuration
- `Procfile` - Process configuration
- `runtime.txt` - Python version
- `requirements.txt` - Dependencies

## Testing

### Test Health Endpoint
```bash
curl http://localhost:8000/health
```

### Test Recommendations
```bash
curl "http://localhost:8000/api/recommendations/user_123?limit=5"
```

### Run with Different Port
```bash
PORT=9000 python main.py
```

## Project Structure

```
ai-service/
├── main.py                      # FastAPI application & routes
├── recommendation_engine.py     # Recommendation logic
├── ml_recommendation_service.py # ML model service
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment template
├── render.yaml                  # Render deployment config
├── Procfile                     # Process file for deployment
├── runtime.txt                  # Python version specification
├── deploy.sh                    # Linux/Mac deployment script
├── deploy.bat                   # Windows deployment script
├── DEPLOYMENT.md                # Detailed deployment guide
└── README.md                    # This file
```

## Troubleshooting

### Issue: ModuleNotFoundError
**Solution**: Install requirements
```bash
pip install -r requirements.txt
```

### Issue: MongoDB Connection Failed
**Solution**: Check MONGODB_URI in .env file

### Issue: Port Already in Use
**Solution**: Change port
```bash
PORT=9000 python main.py
```

### Issue: CORS Errors
**Solution**: Add your backend URL to CORS_ORIGINS in .env

## Integration with QuickShow Backend

Update your backend `.env`:
```env
# Local development
AI_SERVICE_URL=http://localhost:8000

# Production
AI_SERVICE_URL=https://your-ml-service.onrender.com
```

The backend will automatically use the ML service for recommendations.

## Performance

- **Startup**: < 5 seconds
- **Response Time**: < 200ms per request
- **Concurrent Users**: 100+ (with proper hosting)
- **Memory**: ~150MB base + models

## License

Part of the QuickShow Movie Ticket Booking Platform

## Support

For issues and questions:
1. Check logs: `python main.py`
2. Review [DEPLOYMENT.md](DEPLOYMENT.md)
3. Test endpoints at `/docs`

---

Built with ❤️ using FastAPI
