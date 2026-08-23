"""
ML-based Movie Recommendation Service using Pickle Files
Loads precomputed models and data from pickle files in .vscode/aiml/
"""

import os
import pickle
import logging
import numpy as np
from typing import List, Dict, Optional
from pathlib import Path

# Configure logging
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

# Path to pickle files
AIML_DIR = Path(__file__).parent.parent / '.vscode' / 'aiml'


class MLRecommendationService:
    """Load and use precomputed ML models from pickle files."""

    def __init__(self):
        """Initialize the ML recommendation service."""
        self.movie_list = None
        self.similarity_matrix = None
        self.movie_id_to_index = {}
        self.index_to_movie_id = {}
        
        self._load_models()

    def _load_models(self):
        """Load pickle files from disk."""
        try:
            # Load movie list
            movie_list_path = AIML_DIR / 'movie_list.pkl'
            if movie_list_path.exists():
                with open(movie_list_path, 'rb') as f:
                    self.movie_list = pickle.load(f)
                logger.info(f"Loaded {len(self.movie_list)} movies from movie_list.pkl")
                
                # Create ID mappings
                for idx, movie_info in enumerate(self.movie_list):
                    movie_id = movie_info.get('_id') or movie_info.get('id')
                    if movie_id:
                        self.movie_id_to_index[str(movie_id)] = idx
                        self.index_to_movie_id[idx] = str(movie_id)
                
                logger.info(f"Created {len(self.movie_id_to_index)} movie ID mappings")
            else:
                logger.warning(f"movie_list.pkl not found at {movie_list_path}")
            
            # Load similarity matrix
            similarity_path = AIML_DIR / 'similarity.pkl'
            if similarity_path.exists():
                with open(similarity_path, 'rb') as f:
                    self.similarity_matrix = pickle.load(f)
                logger.info(f"Loaded similarity matrix with shape {self.similarity_matrix.shape}")
            else:
                logger.warning(f"similarity.pkl not found at {similarity_path}")
        
        except Exception as e:
            logger.error(f"Error loading ML models: {e}")
            self.movie_list = []
            self.similarity_matrix = None

    def get_recommendations(self, movie_id: str, limit: int = 5, exclude_ids: Optional[List[str]] = None) -> List[Dict]:
        """
        Get movie recommendations based on a reference movie using precomputed similarity.
        
        Args:
            movie_id: The reference movie ID
            limit: Number of recommendations to return
            exclude_ids: Movie IDs to exclude from results
            
        Returns:
            List of recommended movies with similarity scores
        """
        try:
            if not self.movie_list or self.similarity_matrix is None:
                logger.warning("ML models not loaded, returning empty list")
                return []
            
            exclude_ids = set(exclude_ids or [])
            
            # Get the index of the reference movie
            movie_idx = self.movie_id_to_index.get(str(movie_id))
            if movie_idx is None:
                logger.warning(f"Movie ID {movie_id} not found in movie list")
                return []
            
            # Get similarity scores for this movie
            similarity_scores = self.similarity_matrix[movie_idx]
            
            # Get top recommendations
            top_indices = np.argsort(-similarity_scores)
            
            recommendations = []
            for idx in top_indices:
                if len(recommendations) >= limit:
                    break
                
                # Skip the reference movie itself
                if idx == movie_idx:
                    continue
                
                # Skip excluded movies
                rec_movie_id = self.index_to_movie_id.get(idx)
                if rec_movie_id in exclude_ids:
                    continue
                
                # Get movie data
                movie_data = self.movie_list[idx]
                similarity_score = float(similarity_scores[idx])
                
                recommendations.append({
                    "movie_id": rec_movie_id,
                    "title": movie_data.get('title', 'Unknown'),
                    "score": similarity_score,
                    "genres": movie_data.get('genres', []),
                    "rating": float(movie_data.get('rating', 0)) if movie_data.get('rating') else 0,
                    "poster_path": movie_data.get('poster_path'),
                    "backdrop_path": movie_data.get('backdrop_path'),
                    "release_date": movie_data.get('release_date'),
                })
            
            logger.info(f"Generated {len(recommendations)} recommendations for movie {movie_id}")
            return recommendations
        
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []

    def get_personalized_recommendations(self, watched_movie_ids: List[str], limit: int = 10, exclude_ids: Optional[List[str]] = None) -> List[Dict]:
        """
        Get personalized recommendations based on multiple watched movies.
        
        Args:
            watched_movie_ids: List of movie IDs user has watched/favorited
            limit: Number of recommendations to return
            exclude_ids: Movie IDs to exclude from results
            
        Returns:
            List of recommended movies with average similarity scores
        """
        try:
            if not self.movie_list or self.similarity_matrix is None:
                logger.warning("ML models not loaded, returning empty list")
                return []
            
            exclude_ids = set(exclude_ids or [])
            
            # Get indices of watched movies
            watched_indices = []
            for movie_id in watched_movie_ids:
                idx = self.movie_id_to_index.get(str(movie_id))
                if idx is not None:
                    watched_indices.append(idx)
            
            if not watched_indices:
                logger.warning(f"No watched movies found for {watched_movie_ids}")
                return []
            
            # Calculate average similarity to all watched movies
            avg_similarity = np.zeros(len(self.movie_list))
            for watched_idx in watched_indices:
                avg_similarity += self.similarity_matrix[watched_idx]
            avg_similarity /= len(watched_indices)
            
            # Get top recommendations
            top_indices = np.argsort(-avg_similarity)
            
            recommendations = []
            for idx in top_indices:
                if len(recommendations) >= limit:
                    break
                
                # Skip watched movies
                if idx in watched_indices:
                    continue
                
                # Skip excluded movies
                rec_movie_id = self.index_to_movie_id.get(idx)
                if rec_movie_id in exclude_ids:
                    continue
                
                # Get movie data
                movie_data = self.movie_list[idx]
                similarity_score = float(avg_similarity[idx])
                
                recommendations.append({
                    "movie_id": rec_movie_id,
                    "title": movie_data.get('title', 'Unknown'),
                    "score": similarity_score,
                    "genres": movie_data.get('genres', []),
                    "rating": float(movie_data.get('rating', 0)) if movie_data.get('rating') else 0,
                    "poster_path": movie_data.get('poster_path'),
                    "backdrop_path": movie_data.get('backdrop_path'),
                    "release_date": movie_data.get('release_date'),
                })
            
            logger.info(f"Generated {len(recommendations)} personalized recommendations")
            return recommendations
        
        except Exception as e:
            logger.error(f"Error generating personalized recommendations: {e}")
            return []

    def is_ready(self) -> bool:
        """Check if ML models are properly loaded."""
        return self.movie_list is not None and self.similarity_matrix is not None


# Initialize service
ml_service = MLRecommendationService()
