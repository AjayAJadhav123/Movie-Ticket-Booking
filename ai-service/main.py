"""
FastAPI server for movie recommendations.
Exposes REST endpoints for the QuickShow backend.
"""

import os
import logging
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from recommendation_engine import recommendation_engine
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="QuickShow Recommendation Engine",
    description="AI-powered movie recommendation service",
    version="1.0.0"
)

# CORS configuration
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:5000').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Request/Response models
class RecommendationRequest(BaseModel):
    user_id: str
    limit: int = 10
    exclude_watched: bool = True

class MovieRecommendation(BaseModel):
    movie_id: str
    title: str
    score: float
    genres: List[str]
    rating: float

class RecommendationResponse(BaseModel):
    success: bool
    data: List[MovieRecommendation]
    message: str


# Routes
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "QuickShow Recommendation Engine"
    }


@app.get("/api/recommendations/{user_id}", response_model=RecommendationResponse, tags=["Recommendations"])
async def get_recommendations(
    user_id: str,
    limit: int = Query(10, ge=1, le=50),
    exclude_watched: bool = Query(True)
) -> RecommendationResponse:
    """
    Get personalized movie recommendations for a user.
    
    - **user_id**: Clerk user ID
    - **limit**: Number of recommendations (1-50)
    - **exclude_watched**: Exclude movies user has already watched/booked
    """
    try:
        if not user_id or not user_id.strip():
            raise HTTPException(status_code=400, detail="user_id is required")
        
        recommendations = recommendation_engine.recommend(
            user_id=user_id,
            limit=limit,
            exclude_watched=exclude_watched
        )
        
        return RecommendationResponse(
            success=True,
            data=[MovieRecommendation(**rec) for rec in recommendations],
            message="Recommendations generated successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in recommendations endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating recommendations: {str(e)}"
        )


@app.post("/api/recommendations", response_model=RecommendationResponse, tags=["Recommendations"])
async def post_recommendations(request: RecommendationRequest) -> RecommendationResponse:
    """
    Get personalized movie recommendations for a user (POST variant).
    """
    try:
        if not request.user_id or not request.user_id.strip():
            raise HTTPException(status_code=400, detail="user_id is required")
        
        recommendations = recommendation_engine.recommend(
            user_id=request.user_id,
            limit=request.limit,
            exclude_watched=request.exclude_watched
        )
        
        return RecommendationResponse(
            success=True,
            data=[MovieRecommendation(**rec) for rec in recommendations],
            message="Recommendations generated successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in POST recommendations endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating recommendations: {str(e)}"
        )


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API documentation."""
    return {
        "name": "QuickShow Recommendation Engine",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "get_recommendations": "/api/recommendations/{user_id}",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv('PORT', 8000))
    host = os.getenv('HOST', '0.0.0.0')
    
    logger.info(f"Starting recommendation service on {host}:{port}")
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv('ENV', 'development') == 'development'
    )
