import React from 'react';
import { Box, Text, Button, VStack } from '@chakra-ui/react';

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
        <Box p={8} textAlign="center">
          <VStack spacing={4}>
            <Text fontSize="xl" fontWeight="bold" color="red.500">
              Something went wrong
            </Text>
            <Text color="gray.600">
              An error occurred while loading the application. Please refresh the page.
            </Text>
            <Button 
              colorScheme="blue" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <Box mt={4} p={4} bg="gray.100" borderRadius="md" textAlign="left">
                <Text fontSize="sm" fontWeight="bold">Error Details:</Text>
                <Text fontSize="xs" fontFamily="mono" whiteSpace="pre-wrap">
                  {this.state.error && this.state.error.toString()}
                </Text>
                <Text fontSize="xs" fontFamily="mono" whiteSpace="pre-wrap" mt={2}>
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
