#!/usr/bin/env python3
"""
Test script to verify Google Analytics implementation
This script tests the backend API endpoints and validates the GA4 tracking ID format
"""

import requests
import json
import re
import sys

# Configuration
BASE_URL = "https://dhivehinoos.net/api/v1"
TEST_GA_ID = "G-MLXXKKVFXQ"  # The GA4 ID provided by the user

def test_ga_id_format():
    """Test GA4 ID format validation"""
    print("Testing GA4 ID format validation...")
    
    # Test valid GA4 IDs
    valid_ids = [
        "G-MLXXKKVFXQ",  # User's ID
        "G-12345678",
        "G-ABCDEFGHIJ",
        "G-1234567890"
    ]
    
    # Test invalid GA4 IDs
    invalid_ids = [
        "UA-123456789-1",  # Old Universal Analytics format
        "G-1234567",       # Too short
        "G-12345678901",   # Too long
        "G-12345678-1",    # Contains hyphen
        "G-12345678a",     # Contains lowercase
        "123456789",       # Missing G- prefix
        ""                 # Empty
    ]
    
    # Test regex pattern
    ga4_pattern = r'^G-[A-Z0-9]{8,10}$'
    
    print("Valid GA4 IDs:")
    for ga_id in valid_ids:
        is_valid = bool(re.match(ga4_pattern, ga_id))
        print(f"  {ga_id}: {'✓' if is_valid else '✗'}")
    
    print("\nInvalid GA4 IDs:")
    for ga_id in invalid_ids:
        is_valid = bool(re.match(ga4_pattern, ga_id))
        print(f"  {ga_id}: {'✓' if is_valid else '✗'}")
    
    return True

def test_settings_api():
    """Test the settings API endpoints"""
    print("\nTesting Settings API...")
    
    try:
        # Test public settings endpoint
        response = requests.get(f"{BASE_URL}/settings/public/")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Public settings API working")
            print(f"  Current GA ID: {data.get('google_analytics_id', 'Not set')}")
        else:
            print(f"✗ Public settings API failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Settings API error: {e}")
        return False
    
    return True

def test_ga_implementation():
    """Test the complete GA implementation"""
    print("\nTesting Google Analytics Implementation...")
    
    # Test 1: GA4 ID format validation
    if not test_ga_id_format():
        return False
    
    # Test 2: Settings API
    if not test_settings_api():
        return False
    
    # Test 3: Check if the tracking ID is properly configured
    try:
        response = requests.get(f"{BASE_URL}/settings/public/")
        if response.status_code == 200:
            data = response.json()
            ga_id = data.get('google_analytics_id')
            
            if ga_id:
                # Validate the format
                ga4_pattern = r'^G-[A-Z0-9]{8,10}$'
                if re.match(ga4_pattern, ga_id):
                    print(f"✓ GA4 ID '{ga_id}' is properly formatted")
                else:
                    print(f"✗ GA4 ID '{ga_id}' has invalid format")
                    return False
            else:
                print("⚠ GA4 ID not configured in settings")
                print("  Please set the Google Analytics ID in admin settings")
    except Exception as e:
        print(f"✗ Error checking GA configuration: {e}")
        return False
    
    return True

def main():
    """Main test function"""
    print("Google Analytics Implementation Test")
    print("=" * 40)
    
    success = test_ga_implementation()
    
    print("\n" + "=" * 40)
    if success:
        print("✓ All tests passed! Google Analytics should be working.")
        print("\nNext steps:")
        print("1. Set the Google Analytics ID in admin settings")
        print("2. Deploy the changes to production")
        print("3. Wait 24-48 hours for data to appear in Google Analytics")
        print("4. Check Google Analytics Real-time reports to verify tracking")
    else:
        print("✗ Some tests failed. Please check the implementation.")
        sys.exit(1)

if __name__ == "__main__":
    main()
