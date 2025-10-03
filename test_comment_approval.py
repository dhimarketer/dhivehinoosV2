#!/usr/bin/env python3
"""
Comment Approval Test Suite for Dhivehinoos.net
Tests comment creation, approval workflow, and display
"""

import requests
import json
import time
from datetime import datetime

class CommentApprovalTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api/v1"
        self.results = []
    
    def test_comment_creation(self):
        """Test comment creation functionality"""
        print("Testing comment creation...")
        
        try:
            # Get a published article to comment on
            articles_response = requests.get(f"{self.api_base}/articles/published/")
            if articles_response.status_code != 200:
                print(f"❌ Failed to fetch articles: {articles_response.status_code}")
                return False
            
            articles = articles_response.json().get('results', [])
            if not articles:
                print("❌ No published articles found")
                return False
            
            article = articles[0]
            
            # Create a test comment
            comment_data = {
                'article_slug': article['slug'],
                'author_name': 'Test User',
                'author_email': 'test@example.com',
                'content': f'Test comment created at {datetime.now().isoformat()}'
            }
            
            comment_response = requests.post(
                f"{self.api_base}/comments/create/",
                json=comment_data
            )
            
            if comment_response.status_code not in [200, 201]:
                print(f"❌ Comment creation failed: {comment_response.status_code}")
                print(f"Response: {comment_response.text}")
                return False
            
            print("✅ Comment creation successful")
            return True
            
        except Exception as e:
            print(f"❌ Comment creation test failed: {e}")
            return False
    
    def test_comment_retrieval(self):
        """Test comment retrieval functionality"""
        print("Testing comment retrieval...")
        
        try:
            # Get comments for admin
            comments_response = requests.get(f"{self.api_base}/comments/admin/")
            if comments_response.status_code != 200:
                print(f"❌ Failed to fetch comments: {comments_response.status_code}")
                return False
            
            comments = comments_response.json().get('results', [])
            print(f"✅ Retrieved {len(comments)} comments")
            
            # Check comment structure
            if comments:
                comment = comments[0]
                required_fields = ['id', 'author_name', 'content', 'is_approved', 'created_at']
                for field in required_fields:
                    if field not in comment:
                        print(f"❌ Comment missing required field: {field}")
                        return False
            
            return True
            
        except Exception as e:
            print(f"❌ Comment retrieval test failed: {e}")
            return False
    
    def test_comment_approval_workflow(self):
        """Test comment approval workflow"""
        print("Testing comment approval workflow...")
        
        try:
            # Get unapproved comments
            comments_response = requests.get(f"{self.api_base}/comments/admin/")
            if comments_response.status_code != 200:
                print(f"❌ Failed to fetch comments: {comments_response.status_code}")
                return False
            
            comments = comments_response.json().get('results', [])
            unapproved_comments = [c for c in comments if not c.get('is_approved', False)]
            
            if not unapproved_comments:
                print("ℹ️ No unapproved comments found to test approval workflow")
                return True
            
            comment = unapproved_comments[0]
            comment_id = comment['id']
            
            # Test approval
            approval_response = requests.patch(
                f"{self.api_base}/comments/admin/{comment_id}/",
                json={'is_approved': True}
            )
            
            if approval_response.status_code not in [200, 204]:
                print(f"❌ Comment approval failed: {approval_response.status_code}")
                print(f"Response: {approval_response.text}")
                return False
            
            # Verify approval
            updated_comment_response = requests.get(f"{self.api_base}/comments/admin/{comment_id}/")
            if updated_comment_response.status_code != 200:
                print(f"❌ Failed to verify comment approval: {updated_comment_response.status_code}")
                return False
            
            updated_comment = updated_comment_response.json()
            if not updated_comment.get('is_approved', False):
                print("❌ Comment approval not reflected in database")
                return False
            
            print("✅ Comment approval workflow successful")
            return True
            
        except Exception as e:
            print(f"❌ Comment approval workflow test failed: {e}")
            return False
    
    def test_comment_rejection(self):
        """Test comment rejection functionality"""
        print("Testing comment rejection...")
        
        try:
            # Get comments
            comments_response = requests.get(f"{self.api_base}/comments/admin/")
            if comments_response.status_code != 200:
                print(f"❌ Failed to fetch comments: {comments_response.status_code}")
                return False
            
            comments = comments_response.json().get('results', [])
            if not comments:
                print("ℹ️ No comments found to test rejection")
                return True
            
            comment = comments[0]
            comment_id = comment['id']
            
            # Test rejection (delete)
            rejection_response = requests.delete(f"{self.api_base}/comments/admin/{comment_id}/")
            
            if rejection_response.status_code not in [200, 204]:
                print(f"❌ Comment rejection failed: {rejection_response.status_code}")
                print(f"Response: {rejection_response.text}")
                return False
            
            print("✅ Comment rejection successful")
            return True
            
        except Exception as e:
            print(f"❌ Comment rejection test failed: {e}")
            return False
    
    def test_comment_display_on_frontend(self):
        """Test comment display on frontend"""
        print("Testing comment display on frontend...")
        
        try:
            # Get a published article with comments
            articles_response = requests.get(f"{self.api_base}/articles/published/")
            if articles_response.status_code != 200:
                print(f"❌ Failed to fetch articles: {articles_response.status_code}")
                return False
            
            articles = articles_response.json().get('results', [])
            if not articles:
                print("❌ No published articles found")
                return False
            
            # Find an article with comments
            article_with_comments = None
            for article in articles:
                comments_response = requests.get(f"{self.api_base}/comments/article/{article['slug']}/")
                if comments_response.status_code == 200:
                    comments = comments_response.json().get('results', [])
                    if comments:
                        article_with_comments = article
                        break
            
            if not article_with_comments:
                print("ℹ️ No articles with comments found")
                return True
            
            # Test comment retrieval for article
            comments_response = requests.get(f"{self.api_base}/comments/article/{article_with_comments['slug']}/")
            if comments_response.status_code != 200:
                print(f"❌ Failed to fetch comments for article: {comments_response.status_code}")
                return False
            
            comments = comments_response.json().get('results', [])
            print(f"✅ Retrieved {len(comments)} comments for article '{article_with_comments['title']}'")
            
            return True
            
        except Exception as e:
            print(f"❌ Comment display test failed: {e}")
            return False
    
    def run_all_tests(self):
        """Run all comment approval tests"""
        print("=" * 50)
        print("COMMENT APPROVAL TEST SUITE")
        print("=" * 50)
        
        tests = [
            self.test_comment_creation,
            self.test_comment_retrieval,
            self.test_comment_approval_workflow,
            self.test_comment_rejection,
            self.test_comment_display_on_frontend,
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
    tester = CommentApprovalTester()
    tester.run_all_tests()
