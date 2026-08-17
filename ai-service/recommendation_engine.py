"""
Movie Recommendation Engine using Content-Based Filtering
- Uses user's favorite movies
- Uses user's booking history
- Uses movie genres, ratings, and metadata
- Returns personalized recommendations with scores
"""

import os
import logging
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics.pairwise import cosine_similarity
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

# MongoDB Connection
MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable not set")

client = MongoClient(MONGODB_URI)
db = client['quickshow']
movies_collection = db['movies']
users_collection = db['users']
bookings_collection = db['bookings']
shows_collection = db['shows']


class RecommendationEngine:
    """Content-based movie recommendation engine."""

    def __init__(self):
        self.genre_map = {}
        self.build_genre_map()

    def build_genre_map(self):
        """Build a map of all unique genres to numeric indices."""
        genres = set()
        for movie in movies_collection.find({"genres": {"$exists": True}}, {"genres": 1}):
            if movie.get("genres"):
                genres.update(movie["genres"])
        
        self.genre_map = {genre: idx for idx, genre in enumerate(sorted(genres))}
        logger.info(f"Built genre map with {len(self.genre_map)} genres")

    def get_user_data(self, user_id: str) -> Dict:
        """Fetch user's favorites and booking history."""
        try:
            user = users_collection.find_one({"clerkId": user_id})
            if not user:
                return {"favorites": [], "booked_movies": []}

            favorites = user.get("favorites", [])
            
            # Get booked movies from confirmed bookings
            booked_shows = bookings_collection.find(
                {"userId": user_id, "status": "confirmed"}
            ).limit(50)
            
            booked_movie_ids = set()
            for booking in booked_shows:
                try:
                    show = shows_collection.find_one({"_id": booking.get("showId")})
                    if show and show.get("movieId"):
                        booked_movie_ids.add(str(show["movieId"]))
                except Exception as e:
                    logger.error(f"Error fetching show: {e}")
            
            return {
                "favorites": [str(fav) for fav in favorites],
                "booked_movies": list(booked_movie_ids)
            }
        except Exception as e:
            logger.error(f"Error fetching user data: {e}")
            return {"favorites": [], "booked_movies": []}

    def get_movies_data(self) -> pd.DataFrame:
        """Fetch all movies and create feature matrix."""
        try:
            movies = list(movies_collection.find().limit(1000))
            
            if not movies:
                logger.warning("No movies found in database")
                return pd.DataFrame()
            
            data = []
            for movie in movies:
                movie_id = str(movie["_id"])
                title = movie.get("title", "Unknown")
                genres = movie.get("genres", [])
                rating = float(movie.get("rating", 0)) / 10  # Normalize to 0-1
                
                # Create genre features (one-hot encoding)
                genre_features = [0] * len(self.genre_map)
                for genre in genres:
                    if genre in self.genre_map:
                        genre_features[self.genre_map[genre]] = 1
                
                data.append({
                    "movie_id": movie_id,
                    "title": title,
                    "rating": rating,
                    "genres": genres,
                    "genre_features": genre_features
                })
            
            df = pd.DataFrame(data)
            logger.info(f"Loaded {len(df)} movies for recommendation")
            return df
        except Exception as e:
            logger.error(f"Error fetching movies data: {e}")
            return pd.DataFrame()

    def create_feature_vector(self, movie_data: Dict, genre_map_size: int) -> np.ndarray:
        """Create a feature vector for a movie."""
        features = []
        
        # Genre features (one-hot encoded)
        genre_features = [0] * genre_map_size
        for genre in movie_data.get("genres", []):
            if genre in self.genre_map:
                genre_features[self.genre_map[genre]] = 1
        features.extend(genre_features)
        
        # Rating feature (normalized 0-1)
        rating = float(movie_data.get("rating", 0)) / 10
        features.append(rating)
        
        return np.array(features)

    def get_user_profile_vector(self, user_movies: List[str], all_movies_df: pd.DataFrame) -> np.ndarray:
        """Create a user profile vector from their favorites/bookings."""
        if not user_movies or len(all_movies_df) == 0:
            return np.zeros(len(self.genre_map) + 1)
        
        user_vectors = []
        for movie_id in user_movies:
            movie = movies_collection.find_one({"_id": movie_id})
            if movie:
                vector = self.create_feature_vector(movie, len(self.genre_map))
                user_vectors.append(vector)
        
        if not user_vectors:
            return np.zeros(len(self.genre_map) + 1)
        
        # Average user profile
        return np.mean(user_vectors, axis=0)

    def recommend(self, user_id: str, limit: int = 10, exclude_watched: bool = True) -> List[Dict]:
        """Generate recommendations for a user."""
        try:
            logger.info(f"Generating recommendations for user: {user_id}")
            
            # Get user data
            user_data = self.get_user_data(user_id)
            all_watched = set(user_data["favorites"] + user_data["booked_movies"])
            
            logger.info(f"User has {len(user_data['favorites'])} favorites and {len(user_data['booked_movies'])} bookings")
            
            # Get all movies
            all_movies_df = self.get_movies_data()
            if len(all_movies_df) == 0:
                return self._get_fallback_recommendations(limit, all_watched, exclude_watched)
            
            # If user has very little data, return fallback
            if len(all_watched) < 2:
                logger.info("User has insufficient viewing history, returning fallback recommendations")
                return self._get_fallback_recommendations(limit, all_watched, exclude_watched)
            
            # Create user profile from favorites + bookings
            user_profile = self.get_user_profile_vector(
                user_data["favorites"] + user_data["booked_movies"],
                all_movies_df
            )
            
            # Create feature matrix for all movies
            all_movies_vectors = np.array([
                self.create_feature_vector(
                    movies_collection.find_one({"_id": movie_id}),
                    len(self.genre_map)
                )
                for movie_id in all_movies_df["movie_id"]
            ])
            
            # Calculate similarity scores
            similarities = cosine_similarity([user_profile], all_movies_vectors)[0]
            all_movies_df["similarity_score"] = similarities
            
            # Filter recommendations
            recommendations_df = all_movies_df.copy()
            if exclude_watched:
                recommendations_df = recommendations_df[~recommendations_df["movie_id"].isin(all_watched)]
            
            # Sort by similarity and get top recommendations
            top_recommendations = recommendations_df.nlargest(limit, "similarity_score")
            
            result = []
            for _, row in top_recommendations.iterrows():
                result.append({
                    "movie_id": row["movie_id"],
                    "title": row["title"],
                    "score": float(row["similarity_score"]),
                    "genres": row["genres"],
                    "rating": float(row["rating"]) * 10  # Convert back to 0-10
                })
            
            logger.info(f"Generated {len(result)} recommendations for user {user_id}")
            return result
        
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            all_watched = set(user_data.get("favorites", []) + user_data.get("booked_movies", []))
            return self._get_fallback_recommendations(limit, all_watched, exclude_watched)

    def _get_fallback_recommendations(self, limit: int, exclude_ids: set, exclude_watched: bool = True) -> List[Dict]:
        """Return popular/trending movies as fallback."""
        try:
            logger.info("Returning fallback recommendations (popular movies)")
            
            query = {}
            if exclude_watched:
                exclude_ids_str = [str(id) for id in exclude_ids]
                query["_id"] = {"$nin": [self._parse_object_id(id) for id in exclude_ids_str]}
            
            fallback_movies = list(
                movies_collection.find(query)
                .sort("rating", -1)
                .limit(limit)
            )
            
            result = []
            for movie in fallback_movies:
                result.append({
                    "movie_id": str(movie["_id"]),
                    "title": movie.get("title", "Unknown"),
                    "score": 0.5,  # Default score for fallback
                    "genres": movie.get("genres", []),
                    "rating": float(movie.get("rating", 0))
                })
            
            return result
        except Exception as e:
            logger.error(f"Error getting fallback recommendations: {e}")
            return []

    @staticmethod
    def _parse_object_id(id_str: str):
        """Parse string to MongoDB ObjectId if valid."""
        try:
            from bson import ObjectId
            return ObjectId(id_str)
        except:
            return None


# Initialize engine
recommendation_engine = RecommendationEngine()
