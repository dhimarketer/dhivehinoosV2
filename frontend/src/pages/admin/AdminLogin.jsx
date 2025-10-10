import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  Input,
  Button,
  Alert,
  AlertIcon,
  FormControl,
  FormLabel,
  FormErrorMessage,
} from '@chakra-ui/react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        const from = location.state?.from || '/admin/dashboard';
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <Helmet>
        <title>Admin Login - Dhivehinoos.net</title>
      </Helmet>

      <Container maxW="container.sm" py={8}>
        <Card>
          <CardBody>
            <VStack spacing={8} align="stretch">
              <Box textAlign="center">
                <Heading size="xl" mb={4}>
                  Admin Login
                </Heading>
                <Text color="gray.600">
                  Sign in to access the admin dashboard
                </Text>
              </Box>

              {error && (
                <Alert status="error">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <VStack spacing={6}>
                  <FormControl isRequired>
                    <FormLabel>Username</FormLabel>
                    <Input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter username"
                      required
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      required
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    isLoading={isSubmitting}
                    loadingText="Signing in..."
                  >
                    Sign In
                  </Button>
                </VStack>
              </form>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </>
  );
};

export default AdminLogin;
