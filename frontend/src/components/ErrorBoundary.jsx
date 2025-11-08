import React from 'react';
import { Box, Text, Button, VStack } from './ui';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <Box className="p-8 text-center">
          <VStack spacing={4}>
            <Text size="lg" className="font-bold text-red-500">
              Something went wrong
            </Text>
            <Text className="text-gray-600">
              An error occurred while loading the application. Please refresh the page.
            </Text>
            <Button 
              colorScheme="brand"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <Box className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
                <Text size="sm" className="font-bold">Error Details:</Text>
                <Text size="xs" className="font-mono whitespace-pre-wrap">
                  {this.state.error && this.state.error.toString()}
                </Text>
                <Text size="xs" className="font-mono whitespace-pre-wrap mt-2">
                  {this.state.errorInfo.componentStack}
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
