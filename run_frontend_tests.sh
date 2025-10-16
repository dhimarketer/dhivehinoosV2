#!/bin/bash

# Pre-production Frontend Test Runner
# This script runs comprehensive frontend tests for the Dhivehinoos.net project

echo "🚀 Starting Pre-production Frontend Tests for Dhivehinoos.net"
echo "=============================================================="

# Change to frontend directory
cd /home/mine/Documents/codingProjects/dhivehinoosV2/frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run linting first
echo "🔍 Running ESLint..."
npm run lint

# Run tests with coverage
echo "🧪 Running Test Suite..."
npm run test:coverage

# Check test results
if [ $? -eq 0 ]; then
    echo "✅ All tests passed successfully!"
    echo "📊 Test coverage report generated in coverage/"
else
    echo "❌ Some tests failed. Check the output above for details."
    exit 1
fi

echo "🎉 Pre-production testing completed!"
echo "=============================================================="

