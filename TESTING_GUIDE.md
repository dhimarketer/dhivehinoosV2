# Testing Guide for Dhivehinoos V2

This document outlines the comprehensive testing strategy implemented for the Dhivehinoos V2 application to catch issues before production deployment.

## 🧪 Test Overview

Our testing strategy includes:
- **Backend Django Tests**: Model, API, and integration tests
- **Frontend React Tests**: Component and user interaction tests  
- **CI/CD Pipeline**: Automated testing on every push/PR
- **Security Scanning**: Vulnerability detection
- **Docker Build Tests**: Container build verification

## 📁 Test Structure

```
dhivehinoosV2/
├── backend/
│   ├── ads/tests.py              # Ad management tests
│   ├── settings_app/tests.py    # Settings functionality tests
│   ├── articles/tests.py        # Article management tests
│   ├── comments/tests.py        # Comment system tests
│   └── contact/tests.py         # Contact form tests
├── frontend/
│   ├── src/test/
│   │   ├── setup.js             # Test configuration
│   │   ├── SettingsPage.test.jsx
│   │   └── AdPlacementMap.test.jsx
│   ├── vitest.config.js         # Test runner config
│   └── package.json             # Test dependencies
├── .github/workflows/
│   └── tests.yml                # CI/CD pipeline
└── run-tests.sh                 # Local test runner
```

## 🔧 Backend Tests

### Settings App Tests (`settings_app/tests.py`)

**Purpose**: Test the site settings functionality that was recently fixed.

**Test Categories**:
- **Model Tests**: Singleton behavior, default creation
- **Serializer Tests**: Validation, empty/null handling
- **API Tests**: CRUD operations, error handling
- **Integration Tests**: End-to-end workflow testing

**Key Test Cases**:
```python
# Settings persistence (fixes the bug we encountered)
def test_settings_persistence(self):
    """Test that settings persist across multiple requests"""
    # This test specifically addresses the bug we just fixed

# Empty field handling
def test_serializer_empty_google_analytics_id(self):
    """Test serializer with empty Google Analytics ID (should be valid)"""

# Validation testing
def test_update_settings_invalid_data(self):
    """Test settings update with invalid data"""
```

### Ads App Tests (`ads/tests.py`)

**Purpose**: Test ad management functionality including the 400 error fix.

**Test Categories**:
- **Model Tests**: Ad creation, placement logic
- **Serializer Tests**: Empty field handling, validation
- **API Tests**: CRUD operations, filtering
- **Integration Tests**: Multi-placement scenarios

**Key Test Cases**:
```python
# Empty placement handling (fixes the 400 error)
def test_ad_serializer_empty_placement_id(self):
    """Test that serializer handles empty placement_id correctly"""

# Date field handling
def test_ad_serializer_empty_date_fields(self):
    """Test that serializer handles empty date fields correctly"""

# Ad lifecycle testing
def test_is_currently_active_property(self):
    """Test the is_currently_active property"""
```

## 🎨 Frontend Tests

### Settings Page Tests (`SettingsPage.test.jsx`)

**Purpose**: Test the admin settings interface.

**Test Coverage**:
- Component rendering
- Form validation
- API integration
- Error handling
- Authentication checks

### Ad Placement Map Tests (`AdPlacementMap.test.jsx`)

**Purpose**: Test the drag-and-drop ad placement functionality.

**Test Coverage**:
- Component rendering
- Drag and drop interactions
- Ad placement logic
- Visual feedback
- Error states

## 🚀 Running Tests

### Local Testing

**Backend Tests**:
```bash
cd backend
source venv/bin/activate
python manage.py test                    # All tests
python manage.py test settings_app      # Settings only
python manage.py test ads               # Ads only
python manage.py test --verbosity=2     # Detailed output
```

**Frontend Tests**:
```bash
cd frontend
npm install                              # Install dependencies
npm test                                 # Run tests
npm test -- --run                       # Run once (no watch)
npm test -- --coverage                  # With coverage
npm run lint                            # Code quality check
```

**All Tests**:
```bash
./run-tests.sh                          # Comprehensive test runner
```

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/tests.yml`) automatically runs:

1. **Backend Tests**: Django tests with PostgreSQL
2. **Frontend Tests**: React component tests + linting
3. **Integration Tests**: End-to-end testing
4. **Security Scan**: Vulnerability detection
5. **Docker Build**: Container build verification

## 🐛 Issues Caught by Tests

### Settings Persistence Bug
**Issue**: Settings were not persisting across requests
**Test**: `test_settings_persistence()` in `SiteSettingsAPITest`
**Fix**: Proper singleton pattern implementation

### Ad Creation 400 Error
**Issue**: Empty placement_id causing validation errors
**Test**: `test_ad_serializer_empty_placement_id()` in `AdDataIntegrityTest`
**Fix**: Enhanced serializer with `to_internal_value()` method

### Date Field Validation
**Issue**: Empty date strings causing validation failures
**Test**: `test_ad_serializer_empty_date_fields()` in `AdDataIntegrityTest`
**Fix**: Explicit field definitions with `allow_null=True`

## 📊 Test Coverage

**Backend**: 43 tests covering:
- Model validation and business logic
- API endpoints and serialization
- Error handling and edge cases
- Integration scenarios

**Frontend**: Component tests covering:
- User interface rendering
- User interactions
- API integration
- Error states

## 🔒 Security Testing

The CI/CD pipeline includes:
- **Bandit**: Python security linting
- **Safety**: Dependency vulnerability scanning
- **Docker Security**: Container build verification

## 📈 Continuous Improvement

**Test Maintenance**:
- Add tests for new features
- Update tests when fixing bugs
- Regular review of test coverage
- Performance testing for critical paths

**Monitoring**:
- Test execution time tracking
- Coverage percentage monitoring
- Flaky test identification
- Security vulnerability alerts

## 🎯 Best Practices

1. **Write Tests First**: TDD approach for new features
2. **Test Edge Cases**: Empty values, invalid data, error conditions
3. **Mock External Dependencies**: API calls, file system, etc.
4. **Clear Test Names**: Descriptive test method names
5. **Isolated Tests**: Each test should be independent
6. **Fast Execution**: Keep tests fast and efficient
7. **Regular Updates**: Update tests with code changes

## 🚨 Pre-Production Checklist

Before deploying to production, ensure:

- [ ] All backend tests pass (`python manage.py test`)
- [ ] All frontend tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Security scan passes (no high/critical vulnerabilities)
- [ ] Docker builds successfully
- [ ] Integration tests pass
- [ ] Performance tests meet requirements
- [ ] Manual testing completed for critical paths

## 📞 Support

If tests fail:
1. Check the error message and stack trace
2. Review recent code changes
3. Run tests locally to reproduce
4. Check CI/CD logs for environment issues
5. Update tests if requirements changed

---

**Remember**: Tests are your safety net. They catch bugs before users do, ensuring a reliable and stable application.
