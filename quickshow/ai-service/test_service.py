"""
Test script for QuickShow ML Recommendation Service
Run this before deployment to verify everything works
"""

import requests
import sys
import json

# Configuration
BASE_URL = "http://localhost:8000"  # Change to your deployed URL for production testing

def print_status(test_name, success, message=""):
    """Print test status with color"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} - {test_name}")
    if message:
        print(f"    {message}")
    print()

def test_health():
    """Test health endpoint"""
    print("Testing /health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        success = response.status_code == 200 and response.json().get("status") == "healthy"
        print_status("Health Check", success, f"Status: {response.status_code}")
        return success
    except Exception as e:
        print_status("Health Check", False, f"Error: {str(e)}")
        return False

def test_root():
    """Test root endpoint"""
    print("Testing / (root) endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        success = response.status_code == 200
        data = response.json()
        print_status("Root Endpoint", success, 
                    f"Service: {data.get('name', 'Unknown')}, Version: {data.get('version', 'Unknown')}")
        return success
    except Exception as e:
        print_status("Root Endpoint", False, f"Error: {str(e)}")
        return False

def test_recommendations():
    """Test recommendations endpoint"""
    print("Testing /api/recommendations/{user_id} endpoint...")
    try:
        response = requests.get(
            f"{BASE_URL}/api/recommendations/test_user_123",
            params={"limit": 5, "exclude_watched": True},
            timeout=10
        )
        success = response.status_code == 200
        data = response.json()
        count = len(data.get("data", []))
        print_status("User Recommendations", success, 
                    f"Returned {count} recommendations")
        
        if success and count > 0:
            print(f"    Sample recommendation: {data['data'][0].get('title', 'N/A')}")
            print()
        return success
    except Exception as e:
        print_status("User Recommendations", False, f"Error: {str(e)}")
        return False

def test_movie_recommendations():
    """Test movie-based recommendations endpoint"""
    print("Testing /api/recommendations/movie/{movie_id} endpoint...")
    try:
        response = requests.get(
            f"{BASE_URL}/api/recommendations/movie/550",  # Fight Club
            params={"limit": 5},
            timeout=10
        )
        success = response.status_code == 200
        data = response.json()
        count = len(data.get("data", []))
        print_status("Movie Recommendations", success, 
                    f"Returned {count} similar movies")
        return success
    except Exception as e:
        print_status("Movie Recommendations", False, f"Error: {str(e)}")
        return False

def test_personalized_recommendations():
    """Test personalized recommendations endpoint"""
    print("Testing /api/recommendations/personalized endpoint...")
    try:
        payload = {
            "watched_ids": ["550", "238", "240"],  # Fight Club, Godfather, Godfather 2
            "limit": 5
        }
        response = requests.post(
            f"{BASE_URL}/api/recommendations/personalized",
            json=payload,
            timeout=10
        )
        success = response.status_code == 200
        data = response.json()
        count = len(data.get("data", []))
        print_status("Personalized Recommendations", success, 
                    f"Returned {count} personalized recommendations")
        return success
    except Exception as e:
        print_status("Personalized Recommendations", False, f"Error: {str(e)}")
        return False

def test_docs():
    """Test API documentation"""
    print("Testing /docs endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        success = response.status_code == 200 and "swagger" in response.text.lower()
        print_status("API Documentation", success)
        return success
    except Exception as e:
        print_status("API Documentation", False, f"Error: {str(e)}")
        return False

def run_all_tests():
    """Run all tests and print summary"""
    print("=" * 60)
    print("QuickShow ML Service - Test Suite")
    print("=" * 60)
    print(f"Testing service at: {BASE_URL}")
    print()
    
    results = {
        "Health Check": test_health(),
        "Root Endpoint": test_root(),
        "User Recommendations": test_recommendations(),
        "Movie Recommendations": test_movie_recommendations(),
        "Personalized Recommendations": test_personalized_recommendations(),
        "API Documentation": test_docs(),
    }
    
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅" if result else "❌"
        print(f"{status} {test_name}")
    
    print()
    print(f"Results: {passed}/{total} tests passed")
    print()
    
    if passed == total:
        print("🎉 All tests passed! Service is ready for deployment.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        return 1

if __name__ == "__main__":
    # Allow custom base URL from command line
    if len(sys.argv) > 1:
        BASE_URL = sys.argv[1]
        print(f"Using custom base URL: {BASE_URL}")
        print()
    
    exit_code = run_all_tests()
    sys.exit(exit_code)
