import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Flex,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Badge,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Textarea,
  Select,
  Switch,
  Alert,
  AlertIcon,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import { Helmet } from 'react-helmet-async';
import api from '../../services/api';

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const toast = useToast();

  const { isOpen: isCampaignModalOpen, onOpen: onCampaignModalOpen, onClose: onCampaignModalClose } = useDisclosure();
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    subject: '',
    content: '',
    plain_text_content: '',
    scheduled_send_time: '',
    target_categories: [],
    exclude_unsubscribed: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subscriptionsRes, campaignsRes, statsRes] = await Promise.all([
        api.get('/subscriptions/subscriptions/'),
        api.get('/subscriptions/campaigns/'),
        api.get('/subscriptions/stats/')
      ]);
      
      setSubscriptions(subscriptionsRes.data.results || subscriptionsRes.data);
      setCampaigns(campaignsRes.data.results || campaignsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError('Failed to fetch subscription data');
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = () => {
    setCampaignForm({
      title: '',
      subject: '',
      content: '',
      plain_text_content: '',
      scheduled_send_time: '',
      target_categories: [],
      exclude_unsubscribed: true
    });
    onCampaignModalOpen();
  };

  const handleCampaignSubmit = async () => {
    try {
      await api.post('/subscriptions/campaigns/', campaignForm);
      toast({
        title: 'Campaign created successfully',
        status: 'success',
        duration: 3000,
      });
      fetchData();
      onCampaignModalClose();
    } catch (err) {
      toast({
        title: 'Failed to create campaign',
        description: err.response?.data?.detail || 'Please try again',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleSendCampaign = async (campaignId) => {
    try {
      const response = await api.post(`/subscriptions/campaigns/${campaignId}/send/`);
      toast({
        title: 'Campaign sent successfully',
        description: `Sent to ${response.data.recipients} recipients`,
        status: 'success',
        duration: 3000,
      });
      fetchData();
    } catch (err) {
      toast({
        title: 'Failed to send campaign',
        description: err.response?.data?.detail || 'Please try again',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getFilteredSubscriptions = () => {
    let filtered = subscriptions;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(sub => 
        sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.first_name && sub.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (sub.last_name && sub.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading subscription data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="mt-2 text-gray-600">Manage newsletter subscriptions and email campaigns</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.total_subscribers || 0}</div>
            <div className="text-gray-600">Total Subscribers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{stats.active_subscribers || 0}</div>
            <div className="text-gray-600">Active Subscribers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_subscribers || 0}</div>
            <div className="text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">{stats.subscriptions_this_month || 0}</div>
            <div className="text-gray-600">This Month</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-4 py-2 rounded-md font-medium ${
                activeTab === 'subscriptions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Subscriptions ({subscriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-2 rounded-md font-medium ${
                activeTab === 'campaigns'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Email Campaigns ({campaigns.length})
            </button>
          </div>
        </div>

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Newsletter Subscriptions</h2>
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Search subscribers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="unsubscribed">Unsubscribed</option>
                  <option value="bounced">Bounced</option>
                </select>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscribed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confirmed
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredSubscriptions().map((subscription) => (
                    <tr key={subscription.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {subscription.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subscription.first_name && subscription.last_name
                          ? `${subscription.first_name} ${subscription.last_name}`
                          : subscription.first_name || subscription.last_name || '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          subscription.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : subscription.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : subscription.status === 'unsubscribed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subscription.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subscription.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(subscription.subscribed_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subscription.confirmed_at ? formatDate(subscription.confirmed_at) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Email Campaigns</h2>
              <button
                onClick={handleCreateCampaign}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Create Campaign
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {campaign.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {campaign.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          campaign.status === 'sent' 
                            ? 'bg-green-100 text-green-800'
                            : campaign.status === 'draft'
                            ? 'bg-gray-100 text-gray-800'
                            : campaign.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : campaign.status === 'sending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {campaign.total_recipients}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(campaign.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {campaign.status === 'draft' && (
                          <button
                            onClick={() => handleSendCampaign(campaign.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Send
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Campaign Modal */}
        <Modal isOpen={isCampaignModalOpen} onClose={onCampaignModalClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create Email Campaign</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Campaign Title</FormLabel>
                  <Input
                    value={campaignForm.title}
                    onChange={(e) => setCampaignForm({...campaignForm, title: e.target.value})}
                    placeholder="Newsletter Campaign"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Email Subject</FormLabel>
                  <Input
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm({...campaignForm, subject: e.target.value})}
                    placeholder="Latest Dhivehi News"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Email Content (HTML)</FormLabel>
                  <Textarea
                    value={campaignForm.content}
                    onChange={(e) => setCampaignForm({...campaignForm, content: e.target.value})}
                    rows={8}
                    placeholder="<h1>Welcome to our newsletter!</h1><p>Latest articles...</p>"
                  />
                  <FormHelperText>
                    Use HTML formatting for rich content
                  </FormHelperText>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Plain Text Content</FormLabel>
                  <Textarea
                    value={campaignForm.plain_text_content}
                    onChange={(e) => setCampaignForm({...campaignForm, plain_text_content: e.target.value})}
                    rows={6}
                    placeholder="Welcome to our newsletter! Latest articles..."
                  />
                  <FormHelperText>
                    Plain text version for email clients that don't support HTML
                  </FormHelperText>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Scheduled Send Time (Optional)</FormLabel>
                  <Input
                    type="datetime-local"
                    value={campaignForm.scheduled_send_time}
                    onChange={(e) => setCampaignForm({...campaignForm, scheduled_send_time: e.target.value})}
                  />
                  <FormHelperText>
                    Leave empty to send immediately
                  </FormHelperText>
                </FormControl>
                
                <HStack spacing={4} w="full">
                  <Button colorScheme="blue" flex="1" onClick={handleCampaignSubmit}>
                    Create Campaign
                  </Button>
                  <Button onClick={onCampaignModalClose} flex="1">
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
