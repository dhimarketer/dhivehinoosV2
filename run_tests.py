#!/usr/bin/env python3
"""
Master Test Runner for Dhivehinoos.net
Runs all test suites and generates comprehensive report
"""

import subprocess
import sys
import time
import json
from datetime import datetime

class MasterTestRunner:
    def __init__(self):
        self.test_suites = [
            {
                'name': 'Image Display Tests',
                'file': 'test_image_display.py',
                'description': 'Tests image loading, fallbacks, and display issues'
            },
            {
                'name': 'Layout Consistency Tests',
                'file': 'test_layout_consistency.py',
                'description': 'Tests layout consistency between user and admin views'
            },
            {
                'name': 'Comment Approval Tests',
                'file': 'test_comment_approval.py',
                'description': 'Tests comment creation, approval workflow, and display'
            }
        ]
        self.results = []
    
    def check_services(self):
        """Check if required services are running"""
        print("Checking required services...")
        
        # Check backend
        try:
            import requests
            response = requests.get("http://localhost:8000/api/v1/articles/published/", timeout=5)
            if response.status_code == 200:
                print("✅ Backend service is running")
            else:
                print(f"❌ Backend service returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Backend service is not accessible: {e}")
            return False
        
        # Check frontend
        try:
            response = requests.get("http://localhost:5178/", timeout=5)
            if response.status_code == 200:
                print("✅ Frontend service is running")
            else:
                print(f"❌ Frontend service returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Frontend service is not accessible: {e}")
            return False
        
        return True
    
    def run_test_suite(self, suite):
        """Run a single test suite"""
        print(f"\n{'='*60}")
        print(f"Running {suite['name']}")
        print(f"Description: {suite['description']}")
        print(f"{'='*60}")
        
        try:
            result = subprocess.run(
                [sys.executable, suite['file']],
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            return {
                'name': suite['name'],
                'file': suite['file'],
                'success': result.returncode == 0,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'returncode': result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                'name': suite['name'],
                'file': suite['file'],
                'success': False,
                'stdout': '',
                'stderr': 'Test suite timed out after 5 minutes',
                'returncode': -1
            }
        except Exception as e:
            return {
                'name': suite['name'],
                'file': suite['file'],
                'success': False,
                'stdout': '',
                'stderr': str(e),
                'returncode': -1
            }
    
    def generate_report(self):
        """Generate comprehensive test report"""
        print(f"\n{'='*60}")
        print("COMPREHENSIVE TEST REPORT")
        print(f"{'='*60}")
        
        total_suites = len(self.results)
        passed_suites = sum(1 for result in self.results if result['success'])
        
        print(f"Test Execution Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Total Test Suites: {total_suites}")
        print(f"Passed: {passed_suites}")
        print(f"Failed: {total_suites - passed_suites}")
        print(f"Success Rate: {(passed_suites/total_suites)*100:.1f}%")
        
        print(f"\n{'='*60}")
        print("DETAILED RESULTS")
        print(f"{'='*60}")
        
        for result in self.results:
            status = "✅ PASSED" if result['success'] else "❌ FAILED"
            print(f"\n{status} {result['name']}")
            print(f"File: {result['file']}")
            
            if result['stdout']:
                print("Output:")
                print(result['stdout'])
            
            if result['stderr']:
                print("Errors:")
                print(result['stderr'])
        
        # Generate recommendations
        print(f"\n{'='*60}")
        print("RECOMMENDATIONS")
        print(f"{'='*60}")
        
        failed_suites = [r for r in self.results if not r['success']]
        
        if not failed_suites:
            print("🎉 All test suites passed! Your application is working correctly.")
        else:
            print("Issues found that need attention:")
            
            for result in failed_suites:
                print(f"\n❌ {result['name']}:")
                if 'image' in result['name'].lower():
                    print("  - Check image URLs and file paths")
                    print("  - Verify image upload functionality")
                    print("  - Test image fallback mechanisms")
                elif 'layout' in result['name'].lower():
                    print("  - Check CSS styling consistency")
                    print("  - Verify responsive design")
                    print("  - Test card sizing and alignment")
                elif 'comment' in result['name'].lower():
                    print("  - Check comment creation API")
                    print("  - Verify approval workflow")
                    print("  - Test comment display on frontend")
        
        # Save report to file
        report_data = {
            'timestamp': datetime.now().isoformat(),
            'total_suites': total_suites,
            'passed_suites': passed_suites,
            'success_rate': (passed_suites/total_suites)*100,
            'results': self.results
        }
        
        with open('test_report.json', 'w') as f:
            json.dump(report_data, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: test_report.json")
    
    def run_all_tests(self):
        """Run all test suites"""
        print("Dhivehinoos.net Comprehensive Test Suite")
        print("=" * 60)
        
        # Check if services are running
        if not self.check_services():
            print("\n❌ Required services are not running. Please start:")
            print("  Backend: cd backend && python3 manage.py runserver 0.0.0.0:8000")
            print("  Frontend: cd frontend && npm run dev")
            return False
        
        print(f"\nStarting test execution at {datetime.now().strftime('%H:%M:%S')}")
        
        # Run each test suite
        for suite in self.test_suites:
            result = self.run_test_suite(suite)
            self.results.append(result)
        
        # Generate report
        self.generate_report()
        
        return all(result['success'] for result in self.results)

if __name__ == "__main__":
    runner = MasterTestRunner()
    success = runner.run_all_tests()
    sys.exit(0 if success else 1)
