#!/usr/bin/env python3
"""
Test script to verify the proposed_url functionality in the news receiving API
"""

import requests
import json

# Test data with proposed_url
test_data = {
    "title": "Test Article with Proposed URL",
    "content": "<p>This is a test article with a custom proposed URL.</p>",
    "proposed_url": "/custom/test-article-url",
    "image_url": "https://via.placeholder.com/800x400/0066cc/ffffff?text=Test+Image"
}

# API endpoint
api_url = "http://localhost:8000/api/v1/articles/ingest/"

# Headers
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "test-key"  # This will be ignored in debug mode
}

def test_proposed_url():
    print("Testing proposed_url functionality...")
    print(f"Sending data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(api_url, json=test_data, headers=headers)
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.json()}")
        
        if response.status_code == 201:
            article_id = response.json().get('id')
            print(f"✅ Article created successfully with ID: {article_id}")
            
            # Test retrieving the article to verify proposed_url is saved
            get_url = f"http://localhost:8000/api/v1/articles/admin/{article_id}/"
            get_response = requests.get(get_url, headers=headers)
            
            if get_response.status_code == 200:
                article_data = get_response.json()
                print(f"✅ Article retrieved successfully")
                print(f"Proposed URL: {article_data.get('proposed_url')}")
                print(f"Article URL: {article_data.get('article_url')}")
                print(f"Slug: {article_data.get('slug')}")
            else:
                print(f"❌ Failed to retrieve article: {get_response.status_code}")
        else:
            print(f"❌ Failed to create article: {response.status_code}")
            print(f"Error details: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - make sure the Django server is running")
        print("Run: export USE_MEMORY_CACHE=true && export TESTING=true && python manage.py runserver 0.0.0.0:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_proposed_url()
