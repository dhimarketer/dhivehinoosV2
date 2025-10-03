#!/usr/bin/env python3
"""
Image Display Test Suite for Dhivehinoos.net
Tests image loading, fallbacks, and display issues
"""

import requests
import json
import time
from urllib.parse import urljoin

class ImageDisplayTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api/v1"
        self.results = []
    
    def test_image_urls(self):
        """Test if image URLs are accessible"""
        print("Testing image URL accessibility...")
        
        # Get articles with images
        articles_response = requests.get(f"{self.api_base}/articles/published/")
        if articles_response.status_code != 200:
            print(f"❌ Failed to fetch articles: {articles_response.status_code}")
            return False
        
        articles = articles_response.json().get('results', [])
        image_issues = []
        
        for article in articles:
            if article.get('image_url'):
                try:
                    img_response = requests.head(article['image_url'], timeout=5)
                    if img_response.status_code != 200:
                        image_issues.append({
                            'article_id': article['id'],
                            'title': article['title'],
                            'image_url': article['image_url'],
                            'status_code': img_response.status_code,
                            'issue': 'Image URL not accessible'
                        })
                except requests.RequestException as e:
                    image_issues.append({
                        'article_id': article['id'],
                        'title': article['title'],
                        'image_url': article['image_url'],
                        'error': str(e),
                        'issue': 'Image URL request failed'
                    })
        
        if image_issues:
            print(f"❌ Found {len(image_issues)} image URL issues:")
            for issue in image_issues:
                print(f"  - Article '{issue['title']}': {issue['issue']}")
            return False
        else:
            print("✅ All image URLs are accessible")
            return True
    
    def test_image_file_urls(self):
        """Test if image file URLs are accessible"""
        print("Testing image file URL accessibility...")
        
        articles_response = requests.get(f"{self.api_base}/articles/published/")
        articles = articles_response.json().get('results', [])
        file_issues = []
        
        for article in articles:
            if article.get('image_file'):
                try:
                    img_response = requests.head(article['image_file'], timeout=5)
                    if img_response.status_code != 200:
                        file_issues.append({
                            'article_id': article['id'],
                            'title': article['title'],
                            'image_file': article['image_file'],
                            'status_code': img_response.status_code,
                            'issue': 'Image file not accessible'
                        })
                except requests.RequestException as e:
                    file_issues.append({
                        'article_id': article['id'],
                        'title': article['title'],
                        'image_file': article['image_file'],
                        'error': str(e),
                        'issue': 'Image file request failed'
                    })
        
        if file_issues:
            print(f"❌ Found {len(file_issues)} image file issues:")
            for issue in file_issues:
                print(f"  - Article '{issue['title']}': {issue['issue']}")
            return False
        else:
            print("✅ All image files are accessible")
            return True
    
    def test_image_data_consistency(self):
        """Test if image data is consistent between image_url and image_file"""
        print("Testing image data consistency...")
        
        articles_response = requests.get(f"{self.api_base}/articles/published/")
        articles = articles_response.json().get('results', [])
        consistency_issues = []
        
        for article in articles:
            image_url = article.get('image_url')
            image_file = article.get('image_file')
            
            # Check if both are present but different
            if image_url and image_file and image_url != image_file:
                consistency_issues.append({
                    'article_id': article['id'],
                    'title': article['title'],
                    'image_url': image_url,
                    'image_file': image_file,
                    'issue': 'image_url and image_file are different'
                })
            
            # Check if neither is present
            if not image_url and not image_file:
                consistency_issues.append({
                    'article_id': article['id'],
                    'title': article['title'],
                    'issue': 'No image data available'
                })
        
        if consistency_issues:
            print(f"❌ Found {len(consistency_issues)} consistency issues:")
            for issue in consistency_issues:
                print(f"  - Article '{issue['title']}': {issue['issue']}")
            return False
        else:
            print("✅ Image data is consistent")
            return True
    
    def run_all_tests(self):
        """Run all image display tests"""
        print("=" * 50)
        print("IMAGE DISPLAY TEST SUITE")
        print("=" * 50)
        
        tests = [
            self.test_image_urls,
            self.test_image_file_urls,
            self.test_image_data_consistency
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
                print()
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {e}")
                print()
        
        print("=" * 50)
        print(f"RESULTS: {passed}/{total} tests passed")
        print("=" * 50)
        
        return passed == total

if __name__ == "__main__":
    tester = ImageDisplayTester()
    tester.run_all_tests()
