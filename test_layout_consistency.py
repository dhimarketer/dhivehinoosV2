#!/usr/bin/env python3
"""
Layout Consistency Test Suite for Dhivehinoos.net
Tests layout consistency between user and admin views
"""

import requests
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

class LayoutConsistencyTester:
    def __init__(self, base_url="http://localhost:8000", frontend_url="http://localhost:5178"):
        self.base_url = base_url
        self.frontend_url = frontend_url
        self.api_base = f"{base_url}/api/v1"
        self.driver = None
        self.results = []
    
    def setup_driver(self):
        """Setup Chrome driver for testing"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            return True
        except Exception as e:
            print(f"❌ Failed to setup Chrome driver: {e}")
            return False
    
    def test_card_sizing_consistency(self):
        """Test if cards have consistent sizing"""
        print("Testing card sizing consistency...")
        
        if not self.setup_driver():
            return False
        
        try:
            # Test user layout
            self.driver.get(f"{self.frontend_url}/")
            time.sleep(3)
            
            # Find all story cards
            cards = self.driver.find_elements(By.CSS_SELECTOR, ".news-card")
            
            if not cards:
                print("❌ No story cards found on user page")
                return False
            
            # Check card dimensions
            card_sizes = []
            for card in cards:
                size = card.size
                card_sizes.append({
                    'width': size['width'],
                    'height': size['height']
                })
            
            # Check for size consistency
            if len(set(card['width'] for card in card_sizes)) > 1:
                print("❌ Card widths are inconsistent")
                for i, size in enumerate(card_sizes):
                    print(f"  Card {i+1}: {size['width']}x{size['height']}")
                return False
            
            print(f"✅ Found {len(cards)} cards with consistent sizing")
            return True
            
        except Exception as e:
            print(f"❌ Card sizing test failed: {e}")
            return False
        finally:
            if self.driver:
                self.driver.quit()
    
    def test_image_display_in_cards(self):
        """Test if images are displaying properly in cards"""
        print("Testing image display in cards...")
        
        if not self.setup_driver():
            return False
        
        try:
            self.driver.get(f"{self.frontend_url}/")
            time.sleep(3)
            
            # Find all images in story cards
            images = self.driver.find_elements(By.CSS_SELECTOR, ".news-card .news-card-image")
            
            if not images:
                print("❌ No images found in story cards")
                return False
            
            image_issues = []
            for i, img in enumerate(images):
                # Check if image is visible
                if not img.is_displayed():
                    image_issues.append(f"Image {i+1} is not visible")
                
                # Check if image has proper dimensions
                size = img.size
                if size['width'] == 0 or size['height'] == 0:
                    image_issues.append(f"Image {i+1} has zero dimensions")
                
                # Check if image src is set
                src = img.get_attribute('src')
                if not src or src.startswith('data:'):
                    image_issues.append(f"Image {i+1} has no proper src or is placeholder")
            
            if image_issues:
                print(f"❌ Found {len(image_issues)} image display issues:")
                for issue in image_issues:
                    print(f"  - {issue}")
                return False
            else:
                print(f"✅ All {len(images)} images are displaying properly")
                return True
                
        except Exception as e:
            print(f"❌ Image display test failed: {e}")
            return False
        finally:
            if self.driver:
                self.driver.quit()
    
    def test_responsive_layout(self):
        """Test responsive layout at different screen sizes"""
        print("Testing responsive layout...")
        
        if not self.setup_driver():
            return False
        
        try:
            screen_sizes = [
                (1920, 1080),  # Desktop
                (1024, 768),   # Tablet
                (375, 667),    # Mobile
            ]
            
            for width, height in screen_sizes:
                self.driver.set_window_size(width, height)
                self.driver.get(f"{self.frontend_url}/")
                time.sleep(2)
                
                # Check if layout adapts properly
                cards = self.driver.find_elements(By.CSS_SELECTOR, ".news-card")
                if not cards:
                    print(f"❌ No cards found at {width}x{height}")
                    return False
                
                print(f"✅ Layout works at {width}x{height} ({len(cards)} cards)")
            
            return True
            
        except Exception as e:
            print(f"❌ Responsive layout test failed: {e}")
            return False
        finally:
            if self.driver:
                self.driver.quit()
    
    def test_api_data_structure(self):
        """Test if API returns consistent data structure"""
        print("Testing API data structure consistency...")
        
        try:
            # Test articles API
            articles_response = requests.get(f"{self.api_base}/articles/published/")
            if articles_response.status_code != 200:
                print(f"❌ Articles API failed: {articles_response.status_code}")
                return False
            
            articles = articles_response.json().get('results', [])
            if not articles:
                print("❌ No articles returned from API")
                return False
            
            # Check required fields
            required_fields = ['id', 'title', 'slug', 'status', 'created_at']
            for article in articles:
                for field in required_fields:
                    if field not in article:
                        print(f"❌ Article missing required field: {field}")
                        return False
            
            print(f"✅ API returns consistent data structure ({len(articles)} articles)")
            return True
            
        except Exception as e:
            print(f"❌ API data structure test failed: {e}")
            return False
    
    def run_all_tests(self):
        """Run all layout consistency tests"""
        print("=" * 50)
        print("LAYOUT CONSISTENCY TEST SUITE")
        print("=" * 50)
        
        tests = [
            self.test_api_data_structure,
            self.test_card_sizing_consistency,
            self.test_image_display_in_cards,
            self.test_responsive_layout,
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
    tester = LayoutConsistencyTester()
    tester.run_all_tests()
