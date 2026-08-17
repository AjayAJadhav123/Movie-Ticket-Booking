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
from ml_recommendation_service import ml_service
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
        "service": "QuickShow Recommendation Engine",
        "ml_models_loaded": ml_service.is_ready(),
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


@app.get("/api/recommendations/movie/{movie_id}", response_model=RecommendationResponse, tags=["ML Recommendations"])
async def get_movie_recommendations(
    movie_id: str,
    limit: int = Query(5, ge=1, le=20),
    exclude_ids: Optional[str] = Query(None)
) -> RecommendationResponse:
    """
    Get movies similar to a specific movie using ML models.
    
    - **movie_id**: Movie ID to find similar movies for
    - **limit**: Number of recommendations (1-20)
    - **exclude_ids**: Comma-separated movie IDs to exclude
    """
    try:
        if not movie_id or not movie_id.strip():
            raise HTTPException(status_code=400, detail="movie_id is required")
        
        if not ml_service.is_ready():
            logger.warning("ML models not loaded, using fallback recommendations")
            return RecommendationResponse(
                success=False,
                data=[],
                message="ML models not available, please try again later"
            )
        
        exclude_list = exclude_ids.split(',') if exclude_ids else []
        recommendations = ml_service.get_recommendations(
            movie_id=movie_id,
            limit=limit,
            exclude_ids=exclude_list
        )
        
        return RecommendationResponse(
            success=True,
            data=[MovieRecommendation(**rec) for rec in recommendations],
            message="Similar movies found"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in movie recommendations endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating recommendations: {str(e)}"
        )


@app.post("/api/recommendations/personalized", response_model=RecommendationResponse, tags=["ML Recommendations"])
async def get_personalized_recommendations(
    watched_ids: List[str],
    limit: int = Query(10, ge=1, le=50),
    exclude_ids: Optional[str] = Query(None)
) -> RecommendationResponse:
    """
    Get personalized recommendations based on multiple watched movies using ML.
    
    - **watched_ids**: List of movie IDs user has watched/favorited
    - **limit**: Number of recommendations (1-50)
    - **exclude_ids**: Comma-separated movie IDs to exclude
    """
    try:
        if not watched_ids or len(watched_ids) == 0:
            raise HTTPException(status_code=400, detail="watched_ids is required")
        
        if not ml_service.is_ready():
            logger.warning("ML models not loaded")
            return RecommendationResponse(
                success=False,
                data=[],
                message="ML models not available"
            )
        
        exclude_list = exclude_ids.split(',') if exclude_ids else []
        recommendations = ml_service.get_personalized_recommendations(
            watched_movie_ids=watched_ids,
            limit=limit,
            exclude_ids=exclude_list
        )
        
        return RecommendationResponse(
            success=True,
            data=[MovieRecommendation(**rec) for rec in recommendations],
            message="Personalized recommendations generated"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in personalized recommendations endpoint: {e}")
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
        "ml_models": {
            "loaded": ml_service.is_ready(),
            "movie_list_count": len(ml_service.movie_list) if ml_service.movie_list else 0,
        },
        "endpoints": {
            "health": "/health",
            "get_recommendations": "/api/recommendations/{user_id}",
            "get_movie_recommendations": "/api/recommendations/movie/{movie_id}",
            "get_personalized_recommendations": "/api/recommendations/personalized",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv('PORT', 8000))
    host = os.getenv('HOST', '0.0.0.0')
    
    logger.info(f"Starting recommendation service on {host}:{port}")
    logger.info(f"ML models ready: {ml_service.is_ready()}")
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv('ENV', 'development') == 'development'
    )

