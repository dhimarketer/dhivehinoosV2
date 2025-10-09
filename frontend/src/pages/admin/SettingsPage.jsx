import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Select,
  Switch,
  Textarea,
  Input,
  Alert,
  AlertIcon,
  Spinner,
  useToast,
  Divider,
} from '@chakra-ui/react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { settingsAPI } from '../../services/api';

const SettingsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [settings, setSettings] = useState({
    default_article_status: 'draft',
    site_name: 'Dhivehinoos.net',
    site_description: 'Authentic Maldivian Dhivehi Twitter thoughts and cultural insights for the Maldivian diaspora worldwide. Connect with your roots through curated Dhivehi content.',
    allow_comments: true,
    require_comment_approval: true,
    google_analytics_id: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Use admin settings endpoint for reading all settings
      const response = await settingsAPI.get();
      setSettings(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
      toast({
        title: 'Error loading settings',
        description: 'Could not load current settings',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Simple authentication check
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      if (!isAuthenticated) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to save settings',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate('/admin/login');
        return;
      }
      
      console.log('Saving settings:', settings);
      const response = await settingsAPI.update(settings);
      console.log('Settings save response:', response.data);
      
      toast({
        title: 'Settings saved',
        description: 'Your settings have been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh settings to confirm they were saved
      await fetchSettings();
    } catch (err) {
      console.error('Error saving settings:', err);
      toast({
        title: 'Error saving settings',
        description: err.response?.data?.error || 'Failed to save settings',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  if (loading) {
    return (
      <Container maxW="container.md" py={8}>
        <Box textAlign="center">
          <Spinner size="xl" />
          <Text mt={4}>Loading settings...</Text>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>Settings - Admin Dashboard - Dhivehinoos.net</title>
      </Helmet>

      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Heading size="xl">Site Settings</Heading>
            <HStack spacing={4}>
              <Button onClick={() => navigate('/admin/dashboard')}>
                Back to Dashboard
              </Button>
              <Button colorScheme="red" onClick={handleLogout}>
                Logout
              </Button>
            </HStack>
          </Box>

          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {/* Article Settings */}
          <Card>
            <CardHeader>
              <Heading size="md">Article Settings</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <FormControl>
                  <FormLabel>Default Article Status</FormLabel>
                  <Select
                    value={settings.default_article_status}
                    onChange={(e) => handleChange('default_article_status', e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </Select>
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    New articles created via API will be set to this status by default.
                    Currently set to: <strong>{settings.default_article_status}</strong>
                  </Text>
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          {/* Site Information */}
          <Card>
            <CardHeader>
              <Heading size="md">Site Information</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <FormControl>
                  <FormLabel>Site Name</FormLabel>
                  <Input
                    value={settings.site_name}
                    onChange={(e) => handleChange('site_name', e.target.value)}
                    placeholder="Site name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Site Description</FormLabel>
                  <Textarea
                    value={settings.site_description}
                    onChange={(e) => handleChange('site_description', e.target.value)}
                    placeholder="Site description"
                    rows={3}
                  />
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    This description will be used for SEO and about pages.
                  </Text>
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          {/* Comment Settings */}
          <Card>
            <CardHeader>
              <Heading size="md">Comment Settings</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Allow Comments</FormLabel>
                  <Switch
                    isChecked={settings.allow_comments}
                    onChange={(e) => handleChange('allow_comments', e.target.checked)}
                    colorScheme="blue"
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Require Comment Approval</FormLabel>
                  <Switch
                    isChecked={settings.require_comment_approval}
                    onChange={(e) => handleChange('require_comment_approval', e.target.checked)}
                    colorScheme="blue"
                    isDisabled={!settings.allow_comments}
                  />
                </FormControl>

                <Text fontSize="sm" color="gray.600">
                  When comment approval is required, comments will need admin approval before being visible to users.
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Analytics Settings */}
          <Card>
            <CardHeader>
              <Heading size="md">Analytics Settings</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <FormControl>
                  <FormLabel>Google Analytics ID</FormLabel>
                  <Input
                    value={settings.google_analytics_id || ''}
                    onChange={(e) => handleChange('google_analytics_id', e.target.value)}
                    placeholder="G-MLXXKKVFXQ"
                  />
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    Enter your Google Analytics 4 tracking ID (e.g., G-MLXXKKVFXQ). 
                    This should be your Measurement ID from Google Analytics 4.
                    Leave empty to disable analytics tracking.
                  </Text>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Format: G- followed by 8-10 alphanumeric characters
                  </Text>
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          {/* Save Button */}
          <Box>
            <Divider mb={6} />
            <HStack spacing={4} justify="center">
              <Button
                colorScheme="blue"
                size="lg"
                onClick={handleSave}
                isLoading={saving}
                loadingText="Saving..."
              >
                Save Settings
              </Button>
              <Button
                size="lg"
                onClick={fetchSettings}
                isDisabled={saving}
              >
                Reset Changes
              </Button>
            </HStack>
          </Box>
        </VStack>
      </Container>
    </>
  );
};

export default SettingsPage;
