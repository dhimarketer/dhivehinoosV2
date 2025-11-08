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
  Spinner,
  Divider,
} from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { settingsAPI } from '../../services/api';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    default_article_status: 'draft',
    site_name: 'Dhivehinoos.net',
    site_description: 'Authentic Maldivian Dhivehi Twitter thoughts and cultural insights for the Maldivian diaspora worldwide. Connect with your roots through curated Dhivehi content.',
    contact_email: 'emaildym@proton.me',
    allow_comments: true,
    require_comment_approval: true,
    story_cards_rows: 3,
    story_cards_columns: 3,
    active_theme: 'modern',
    theme_config: {},
    google_analytics_id: '',
    comment_webhook_enabled: false,
    comment_webhook_url: '',
    comment_webhook_secret: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
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
      
      let errorMessage = 'Could not load current settings';
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection.';
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      setError(errorMessage);
      
      toast({
        title: 'Error loading settings',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
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
      
      let errorMessage = 'Failed to save settings';
      let errorTitle = 'Error saving settings';
      
      // Handle specific error cases
      if (err.response?.status === 403) {
        errorTitle = 'Authentication Required';
        errorMessage = 'Please log in again to save settings. Your session may have expired.';
      } else if (err.response?.status === 401) {
        errorTitle = 'Not Authenticated';
        errorMessage = 'You must be logged in to save settings.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        status: 'error',
        duration: 5000,
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
    logout();
  };

  const testWebhook = async () => {
    try {
      setTestingWebhook(true);
      
      // Use the same API base URL as the rest of the app
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
      
      // Get CSRF token for the request
      let csrfToken = null;
      try {
        const csrfResponse = await fetch(`${API_BASE_URL}/auth/csrf-token/`, {
          method: 'GET',
          credentials: 'include',
        });
        if (csrfResponse.ok) {
          const csrfData = await csrfResponse.json();
          csrfToken = csrfData.csrf_token;
        }
      } catch (error) {
        console.warn('Could not fetch CSRF token:', error);
      }
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
      
      const response = await fetch(`${API_BASE_URL}/comments/test-webhook/`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        timeout: 10000,  // 10 second timeout
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Webhook test successful',
          description: 'Your webhook is working correctly!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Webhook test failed',
          description: result.message || 'Webhook test failed. Check your URL and try again.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Error testing webhook:', err);
      
      let errorMessage = 'Failed to test webhook. Please check your configuration.';
      
      if (err.name === 'TypeError' && err.message.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.message.includes('403')) {
        errorMessage = 'Authentication required. Please log in again.';
      }
      
      toast({
        title: 'Webhook test error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  if (loading) {
    return (
      <Container className="max-w-3xl py-8">
        <Box className="text-center">
          <Spinner size="xl" />
          <Text className="mt-4">Loading settings...</Text>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>Settings - Dhivehinoos.net</title>
      </Helmet>

      <Container className="max-w-3xl py-8">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box className="flex justify-between items-center">
            <Heading size="xl">Site Settings</Heading>
            <HStack spacing={4}>
              <Button onClick={() => navigate('/')}>
                Back to Home
              </Button>
              <Button colorScheme="red" onClick={handleLogout}>
                Logout
              </Button>
            </HStack>
          </Box>

          {error && (
            <Alert status="error">
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
                    <option value="scheduled">Scheduled</option>
                  </Select>
                  <Text size="sm" className="text-gray-600 mt-2">
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
                  <Text size="sm" className="text-gray-600 mt-2">
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
                <FormControl className="flex items-center">
                  <FormLabel className="mb-0">Allow Comments</FormLabel>
                  <Switch
                    isChecked={settings.allow_comments}
                    onChange={(e) => handleChange('allow_comments', e.target.checked)}
                    colorScheme="brand"
                  />
                </FormControl>

                <FormControl className="flex items-center">
                  <FormLabel className="mb-0">Require Comment Approval</FormLabel>
                  <Switch
                    isChecked={settings.require_comment_approval}
                    onChange={(e) => handleChange('require_comment_approval', e.target.checked)}
                    colorScheme="brand"
                    disabled={!settings.allow_comments}
                  />
                </FormControl>

                <Text size="sm" className="text-gray-600">
                  When comment approval is required, comments will need admin approval before being visible to users.
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <Heading size="md">Theme & Layout Settings</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <FormControl>
                  <FormLabel>Active Theme</FormLabel>
                  <Select
                    value={settings.active_theme || 'modern'}
                    onChange={(e) => handleChange('active_theme', e.target.value)}
                  >
                    <option value="modern">Modern News</option>
                    <option value="classic">Classic Blog</option>
                    <option value="minimal">Minimal Clean</option>
                    <option value="newspaper">Newspaper Style</option>
                    <option value="magazine">Magazine Layout</option>
                  </Select>
                  <Text size="sm" className="text-gray-600 mt-2">
                    Select the frontend theme/layout for your site. Changes will be applied immediately after saving.
                  </Text>
                </FormControl>

                <Box className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <Text size="sm" className="font-medium mb-2">Theme Descriptions:</Text>
                  <VStack spacing={2} align="stretch">
                    <Box>
                      <Text size="sm" className="font-semibold">Modern News</Text>
                      <Text size="xs" className="text-gray-600">
                        Clean, modern design with featured article and grid layout. Current default style.
                      </Text>
                    </Box>
                    <Box>
                      <Text size="sm" className="font-semibold">Classic Blog</Text>
                      <Text size="xs" className="text-gray-600">
                        Traditional blog layout with sidebar, warm colors, and serif fonts.
                      </Text>
                    </Box>
                    <Box>
                      <Text size="sm" className="font-semibold">Minimal Clean</Text>
                      <Text size="xs" className="text-gray-600">
                        Minimalist design with lots of whitespace, simple typography, focus on content.
                      </Text>
                    </Box>
                    <Box>
                      <Text size="sm" className="font-semibold">Newspaper Style</Text>
                      <Text size="xs" className="text-gray-600">
                        Traditional newspaper layout with multi-column grid, black/white/gray colors.
                      </Text>
                    </Box>
                    <Box>
                      <Text size="sm" className="font-semibold">Magazine Layout</Text>
                      <Text size="xs" className="text-gray-600">
                        Bold, visual design with large featured images, asymmetric layouts, bold typography.
                      </Text>
                    </Box>
                  </VStack>
                </Box>

                <Alert status="info">
                  <Box>
                    <Text size="sm" className="font-bold">Note:</Text>
                    <Text size="xs" className="mt-1">
                      Theme changes take effect immediately after saving. You can preview the theme by navigating to the homepage.
                      Custom theme configuration (colors, fonts, spacing) can be set via the theme_config field in Django admin if needed.
                    </Text>
                  </Box>
                </Alert>
              </VStack>
            </CardBody>
          </Card>

          {/* Story Card Layout Settings */}
          <Card>
            <CardHeader>
              <Heading size="md">Story Card Layout Settings</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <FormControl>
                  <FormLabel>Number of Rows</FormLabel>
                  <Select
                    value={settings.story_cards_rows}
                    onChange={(e) => handleChange('story_cards_rows', parseInt(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num} row{num !== 1 ? 's' : ''}</option>
                    ))}
                  </Select>
                  <Text size="sm" className="text-gray-600 mt-2">
                    Number of rows to display story cards on the homepage. Currently set to: <strong>{settings.story_cards_rows}</strong>
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>Number of Columns</FormLabel>
                  <Select
                    value={settings.story_cards_columns}
                    onChange={(e) => handleChange('story_cards_columns', parseInt(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num} column{num !== 1 ? 's' : ''}</option>
                    ))}
                  </Select>
                  <Text size="sm" className="text-gray-600 mt-2">
                    Number of columns to display story cards on the homepage. Currently set to: <strong>{settings.story_cards_columns}</strong>
                  </Text>
                </FormControl>

                <Box className="p-4 bg-blue-50 rounded-md border border-blue-200">
                  <Text size="sm" className="text-blue-700 font-medium">
                    Layout Preview: {settings.story_cards_rows} row{settings.story_cards_rows !== 1 ? 's' : ''} × {settings.story_cards_columns} column{settings.story_cards_columns !== 1 ? 's' : ''} = {settings.story_cards_rows * settings.story_cards_columns} story cards
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Webhook Settings */}
          <Card>
            <CardHeader>
              <Heading size="md">Webhook Settings</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <FormControl className="flex items-center">
                  <FormLabel className="mb-0">Enable Comment Webhook</FormLabel>
                  <Switch
                    isChecked={settings.comment_webhook_enabled}
                    onChange={(e) => handleChange('comment_webhook_enabled', e.target.checked)}
                    colorScheme="brand"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Webhook URL</FormLabel>
                  <Input
                    value={settings.comment_webhook_url || ''}
                    onChange={(e) => handleChange('comment_webhook_url', e.target.value)}
                    placeholder="https://your-n8n-workflow-url.com/webhook"
                    disabled={!settings.comment_webhook_enabled}
                  />
                  <Text size="sm" className="text-gray-600 mt-2">
                    Enter your n8n workflow webhook URL. Approved comments will be sent to this endpoint.
                    Leave empty to disable webhook notifications.
                  </Text>
                  <Text size="xs" className="text-gray-500 mt-1">
                    Must start with http:// or https://
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>Webhook Secret (Optional)</FormLabel>
                  <Input
                    type="password"
                    value={settings.comment_webhook_secret || ''}
                    onChange={(e) => handleChange('comment_webhook_secret', e.target.value)}
                    placeholder="Optional secret key for webhook authentication"
                    disabled={!settings.comment_webhook_enabled}
                  />
                  <Text size="sm" className="text-gray-600 mt-2">
                    Optional secret key for webhook authentication. This will be sent in the X-Webhook-Secret header.
                  </Text>
                </FormControl>

                {settings.comment_webhook_enabled && settings.comment_webhook_url && (
                  <Box>
                    <Button
                      colorScheme="green"
                      variant="outline"
                      size="sm"
                      onClick={testWebhook}
                      disabled={testingWebhook}
                    >
                      {testingWebhook ? 'Testing...' : 'Test Webhook'}
                    </Button>
                    <Text size="xs" className="text-gray-500 mt-1">
                      Test your webhook configuration to ensure it's working correctly.
                    </Text>
                  </Box>
                )}

                <Alert status="info">
                  <Box>
                    <Text size="sm" className="font-bold">Webhook Payload:</Text>
                    <Text size="xs" className="mt-1">
                      When a comment is approved, the webhook will receive a JSON payload containing:
                      comment details, article information, and site metadata.
                    </Text>
                  </Box>
                </Alert>
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
                  <Text size="sm" className="text-gray-600 mt-2">
                    Enter your Google Analytics 4 tracking ID (e.g., G-MLXXKKVFXQ). 
                    This should be your Measurement ID from Google Analytics 4.
                    Leave empty to disable analytics tracking.
                  </Text>
                  <Text size="xs" className="text-gray-500 mt-1">
                    Format: G- followed by 8-10 alphanumeric characters
                  </Text>
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          {/* Save Button */}
          <Box>
            <Divider className="mb-6" />
            <HStack spacing={4} justify="center">
              <Button
                colorScheme="brand"
                size="lg"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button
                size="lg"
                onClick={fetchSettings}
                disabled={saving}
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
