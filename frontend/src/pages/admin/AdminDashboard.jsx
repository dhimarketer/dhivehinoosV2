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
  Image as ChakraImage,
  Checkbox,
  CheckboxGroup,
  Stack,
  Divider,
  Link,
} from '@chakra-ui/react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { articlesAPI, commentsAPI, contactAPI, adsAPI } from '../../services/api';
import AdPlacementMap from '../../components/AdPlacementMap';
import api from '../../services/api';
import FormattedText from '../../components/FormattedText';
import SchedulingPage from './SchedulingPage';
import SubscriptionManagement from './SubscriptionManagement';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('articles');
  const [articles, setArticles] = useState([]);
  const [comments, setComments] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [ads, setAds] = useState([]);
  const [adPlacements, setAdPlacements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [articleFilter, setArticleFilter] = useState('all'); // 'all', 'published', 'draft'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [editingArticle, setEditingArticle] = useState(null);
  const [editingAd, setEditingAd] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 20,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrevious: false
  });
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    image: '',
    imageFile: null,
    status: 'draft',
    publishing_mode: 'instant',
    scheduled_publish_time: ''
  });
  
  const [adForm, setAdForm] = useState({
    title: '',
    image: '',
    imageFile: null,
    destination_url: '',
    placement: '',
    is_active: true,
    start_date: '',
    end_date: ''
  });
  
  const { isOpen: isArticleModalOpen, onOpen: onArticleModalOpen, onClose: onArticleModalClose } = useDisclosure();
  const { isOpen: isAdModalOpen, onOpen: onAdModalOpen, onClose: onAdModalClose } = useDisclosure();

  useEffect(() => {
    fetchData(1, 20); // Start with page 1, page size 20
  }, []);

  const fetchData = async (page = pagination.currentPage, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        t: Date.now().toString()
      });
      
      // Add status filter if not 'all'
      if (articleFilter !== 'all') {
        params.append('status', articleFilter);
      }
      
      // Add search query if provided
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      console.log('Fetching articles with params:', params.toString());
      
      const [articlesRes, commentsRes, contactRes, adsRes, placementsRes] = await Promise.all([
        api.get(`/articles/admin/?${params.toString()}`),
        commentsAPI.getAll ? commentsAPI.getAll() : { data: { results: [] } },
        contactAPI.getAll(),
        adsAPI.getAll(),
        adsAPI.getPlacements(),
      ]);
      
      console.log('Articles API response:', articlesRes.data);
      
      // Update articles and pagination info
      setArticles(articlesRes.data.results || []);
      setPagination({
        currentPage: articlesRes.data.current_page || page,
        pageSize: articlesRes.data.page_size || pageSize,
        totalPages: articlesRes.data.total_pages || 1,
        totalCount: articlesRes.data.count || 0,
        hasNext: articlesRes.data.next !== null,
        hasPrevious: articlesRes.data.previous !== null
      });
      
      setComments(commentsRes.data.results || commentsRes.data || []);
      setContactMessages(contactRes.data.results || contactRes.data || []);
      setAds(adsRes.data.results || adsRes.data || []);
      setAdPlacements(placementsRes.data.results || placementsRes.data || []);
      
      // Force refresh by updating the refresh key
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error loading data',
        description: 'Failed to load admin data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for date conversion
  const formatDateForInput = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
  };

  const formatDateForAPI = (inputValue) => {
    if (!inputValue) return null;
    return new Date(inputValue).toISOString();
  };

  const handleLogout = () => {
    logout();
  };

  // Filter functions - now handled by backend API
  const getFilteredArticles = () => {
    return articles; // Backend handles filtering
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    fetchData(newPage, pagination.pageSize);
  };

  const handlePageSizeChange = (newPageSize) => {
    fetchData(1, newPageSize);
  };

  // Filter and search handlers that trigger API refresh
  const handleFilterChange = (newFilter) => {
    setArticleFilter(newFilter);
    fetchData(1, pagination.pageSize);
  };

  const handleSearchChange = (newQuery) => {
    setSearchQuery(newQuery);
    fetchData(1, pagination.pageSize);
  };

  // Ad filtering functionality temporarily disabled for deployment

  const handleCreateArticle = () => {
    console.log('Create Article button clicked');
    setEditingArticle(null);
    setArticleForm({
      title: '',
      content: '',
      image: '',
      imageFile: null,
      status: 'draft',
      publishing_mode: 'instant',
      scheduled_publish_time: ''
    });
    onArticleModalOpen();
  };

  const handleEditArticle = (article) => {
    setEditingArticle(article);
    setArticleForm({
      title: article.title || '',
      content: article.content || '',
      image: article.image || '',
      imageFile: null,
      status: article.status || 'draft',
      publishing_mode: article.publishing_mode || 'instant',
      scheduled_publish_time: article.scheduled_publish_time || ''
    });
    onArticleModalOpen();
  };

  // Ad creation and editing functionality temporarily disabled for deployment

  const handleArticleSubmit = async () => {
    console.log('Article submit clicked', articleForm);
    try {
      let apiData;
      
      // If there's a file upload, use FormData
      if (articleForm.imageFile) {
        apiData = new FormData();
        apiData.append('title', articleForm.title);
        apiData.append('content', articleForm.content);
        apiData.append('image_file', articleForm.imageFile);
        
        // For published articles, don't send status to keep them published
        if (!editingArticle || editingArticle.status !== 'published') {
          apiData.append('status', articleForm.status);
        }
        
        apiData.append('publishing_mode', articleForm.publishing_mode);
        if (articleForm.scheduled_publish_time) {
          apiData.append('scheduled_publish_time', articleForm.scheduled_publish_time);
        }
      } else {
        // Regular JSON data for URL-based images or no image
        apiData = {
          title: articleForm.title,
          content: articleForm.content,
          image: articleForm.image || null,
          publishing_mode: articleForm.publishing_mode,
          scheduled_publish_time: articleForm.scheduled_publish_time || null
        };
        
        // For published articles, don't send status to keep them published
        if (!editingArticle || editingArticle.status !== 'published') {
          apiData.status = articleForm.status;
        }
      }
      
      console.log('Submitting article data:', apiData);
      
      if (editingArticle) {
        console.log('Updating article:', editingArticle.id);
        await articlesAPI.update(editingArticle.id, apiData);
        toast({
          title: 'Article updated',
          status: 'success',
          duration: 2000,
        });
      } else {
        console.log('Creating new article');
        await articlesAPI.create(apiData);
        toast({
          title: 'Article created',
          status: 'success',
          duration: 2000,
        });
      }
      await fetchData();
      onArticleModalClose();
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: 'Error saving article',
        description: error.response?.data?.detail || JSON.stringify(error.response?.data) || 'Failed to save article',
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Ad submission functionality temporarily disabled for deployment

  const handleToggleArticleStatus = async (article) => {
    try {
      const newStatus = article.status === 'published' ? 'draft' : 'published';
      // Only send the fields that are allowed to be updated
      const updateData = {
        title: article.title,
        content: article.content,
        status: newStatus
      };
      
      // Only include image if it exists and is not null
      if (article.image) {
        updateData.image = article.image;
      }
      
      await articlesAPI.update(article.id, updateData);
      
      toast({
        title: `Article ${newStatus === 'published' ? 'published' : 'unpublished'}`,
        status: 'success',
        duration: 2000,
      });
      
      await fetchData();
    } catch (error) {
      console.error('Error toggling article status:', error);
      toast({
        title: 'Error updating article status',
        description: error.response?.data?.detail || 'Failed to update status',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDeleteArticle = async (id) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        console.log('Deleting article with ID:', id);
        const response = await articlesAPI.delete(id);
        console.log('Delete response:', response);
        
        // Remove the article from local state immediately for better UX
        setArticles(prevArticles => prevArticles.filter(article => article.id !== id));
        
        toast({
          title: 'Article deleted',
          status: 'success',
          duration: 2000,
        });
        
        // Refresh data to ensure consistency
        await fetchData();
      } catch (error) {
        console.error('Error deleting article:', error);
        toast({
          title: 'Error deleting article',
          description: error.response?.data?.detail || 'Failed to delete article',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  // Bulk operations
  const handleSelectAll = () => {
    const filteredArticles = getFilteredArticles();
    if (selectedArticles.length === filteredArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(filteredArticles.map(article => article.id));
    }
  };

  const handleSelectArticle = (articleId) => {
    setSelectedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const handleBulkAction = async () => {
    if (selectedArticles.length === 0) {
      toast({
        title: 'No articles selected',
        description: 'Please select articles to perform bulk actions',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!bulkAction) {
      toast({
        title: 'No action selected',
        description: 'Please select a bulk action to perform',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const selectedArticlesData = articles.filter(article => selectedArticles.includes(article.id));
      
      if (bulkAction === 'publish') {
        for (const article of selectedArticlesData) {
          if (article.status !== 'published') {
            const updateData = {
              title: article.title,
              content: article.content,
              status: 'published'
            };
            if (article.image) {
              updateData.image = article.image;
            }
            await articlesAPI.update(article.id, updateData);
          }
        }
        toast({
          title: 'Articles published',
          description: `${selectedArticles.length} articles have been published`,
          status: 'success',
          duration: 3000,
        });
      } else if (bulkAction === 'unpublish') {
        for (const article of selectedArticlesData) {
          if (article.status !== 'draft') {
            const updateData = {
              title: article.title,
              content: article.content,
              status: 'draft'
            };
            if (article.image) {
              updateData.image = article.image;
            }
            await articlesAPI.update(article.id, updateData);
          }
        }
        toast({
          title: 'Articles unpublished',
          description: `${selectedArticles.length} articles have been unpublished`,
          status: 'success',
          duration: 3000,
        });
      } else if (bulkAction === 'delete') {
        if (window.confirm(`Are you sure you want to delete ${selectedArticles.length} articles? This action cannot be undone.`)) {
          console.log('Bulk deleting articles:', selectedArticles);
          
          // Delete articles one by one
          for (const articleId of selectedArticles) {
            try {
              await articlesAPI.delete(articleId);
              console.log('Successfully deleted article:', articleId);
            } catch (error) {
              console.error('Error deleting article:', articleId, error);
            }
          }
          
          // Remove deleted articles from local state immediately
          setArticles(prevArticles => 
            prevArticles.filter(article => !selectedArticles.includes(article.id))
          );
          
          toast({
            title: 'Articles deleted',
            description: `${selectedArticles.length} articles have been deleted`,
            status: 'success',
            duration: 3000,
          });
        } else {
          return;
        }
      }

      setSelectedArticles([]);
      setBulkAction('');
      await fetchData();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: 'Error performing bulk action',
        description: error.response?.data?.detail || 'Failed to perform bulk action',
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Ad status toggle and deletion functionality temporarily disabled for deployment

  // Ad management handlers
  const handleCreateAd = () => {
    setAdForm({
      title: '',
      image: '',
      imageFile: null,
      destination_url: '',
      placement: '',
      is_active: true,
      start_date: '',
      end_date: ''
    });
    onAdModalOpen();
  };

  const handleEditAd = (ad) => {
    setEditingAd(ad);
    setAdForm({
      title: ad.title,
      image: ad.image_url || ad.image || '',
      imageFile: null,
      destination_url: ad.destination_url || '',
      placement: ad.placement?.id || '',
      is_active: ad.is_active,
      start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
      end_date: ad.end_date ? ad.end_date.split('T')[0] : ''
    });
    onAdModalOpen();
  };

  const handleAdSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('title', adForm.title);
      if (adForm.destination_url) {
        formData.append('destination_url', adForm.destination_url);
      }
      // Only append placement_id if it's not empty
      if (adForm.placement && adForm.placement !== '') {
        formData.append('placement_id', adForm.placement);
      }
      formData.append('is_active', adForm.is_active);
      
      if (adForm.start_date) {
        formData.append('start_date', adForm.start_date);
      }
      if (adForm.end_date) {
        formData.append('end_date', adForm.end_date);
      }
      
      if (adForm.imageFile) {
        formData.append('image_file', adForm.imageFile);
      }

      if (editingAd) {
        // Update existing ad
        await adsAPI.update(editingAd.id, formData);
        toast({
          title: 'Ad updated successfully',
          status: 'success',
          duration: 3000,
        });
      } else {
        // Create new ad
        await adsAPI.create(formData);
        toast({
          title: 'Ad created successfully',
          status: 'success',
          duration: 3000,
        });
      }
      
      setEditingAd(null);
      onAdModalClose();
      await fetchData();
    } catch (error) {
      console.error('Error saving ad:', error);
      toast({
        title: editingAd ? 'Error updating ad' : 'Error creating ad',
        description: error.response?.data?.detail || 'Failed to save ad',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDeleteAd = async (id) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      try {
        await adsAPI.delete(id);
        toast({
          title: 'Ad deleted successfully',
          status: 'success',
          duration: 3000,
        });
        await fetchData();
      } catch (error) {
        console.error('Error deleting ad:', error);
        toast({
          title: 'Error deleting ad',
          description: error.response?.data?.detail || 'Failed to delete ad',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  const handleApproveComment = async (id) => {
    try {
      console.log('Approving comment:', id);
      await commentsAPI.approve(id);
      await fetchData();
      toast({
        title: 'Comment approved',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error approving comment:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to approve comment';
      toast({
        title: 'Error approving comment',
        description: errorMessage,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleRejectComment = async (id) => {
    if (window.confirm('Are you sure you want to reject this comment?')) {
      try {
        console.log('Rejecting comment:', id);
        await commentsAPI.reject(id);
        await fetchData();
        toast({
          title: 'Comment rejected',
          status: 'success',
          duration: 2000,
        });
      } catch (error) {
        console.error('Error rejecting comment:', error);
        const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to reject comment';
        toast({
          title: 'Error rejecting comment',
          description: errorMessage,
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  const handleArchiveMessage = async (messageId) => {
    try {
      await contactAPI.archive(messageId);
      toast({
        title: 'Message archived',
        description: 'Contact message has been archived',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error archiving message:', error);
      toast({
        title: 'Error archiving message',
        description: 'Failed to archive message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to permanently delete this message? This action cannot be undone.')) {
      try {
        await contactAPI.delete(messageId);
        toast({
          title: 'Message deleted',
          description: 'Contact message has been permanently deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchData(); // Refresh data
      } catch (error) {
        console.error('Error deleting message:', error);
        toast({
          title: 'Error deleting message',
          description: 'Failed to delete message',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await contactAPI.markAsRead(messageId);
      toast({
        title: 'Message marked as read',
        description: 'Contact message has been marked as read',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast({
        title: 'Error marking message as read',
        description: 'Failed to mark message as read',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderArticlesTab = () => (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Article Management</Heading>
        <HStack spacing={4}>
          {/* View Mode Toggle */}
          <HStack spacing={2}>
            <Text fontSize="sm" fontWeight="medium">View:</Text>
            <Button
              size="sm"
              colorScheme={viewMode === 'cards' ? 'blue' : 'gray'}
              variant={viewMode === 'cards' ? 'solid' : 'outline'}
              onClick={() => setViewMode('cards')}
              leftIcon={<span>📋</span>}
            >
              Cards
            </Button>
            <Button
              size="sm"
              colorScheme={viewMode === 'list' ? 'blue' : 'gray'}
              variant={viewMode === 'list' ? 'solid' : 'outline'}
              onClick={() => setViewMode('list')}
              leftIcon={<span>📝</span>}
            >
              List
            </Button>
          </HStack>
          <Button colorScheme="blue" onClick={handleCreateArticle}>
            Create New Article
          </Button>
        </HStack>
      </Flex>
      
      {/* Article Filter and Search */}
      <Box mb={6}>
        <VStack spacing={4} align="stretch">
          {/* Filter Buttons */}
          <HStack spacing={4} align="center">
            <Text fontWeight="semibold">Filter:</Text>
            <Button
              size="sm"
              colorScheme={articleFilter === 'all' ? 'blue' : 'gray'}
              variant={articleFilter === 'all' ? 'solid' : 'outline'}
              onClick={() => handleFilterChange('all')}
              leftIcon={<span>📋</span>}
            >
              All ({pagination.totalCount})
            </Button>
            <Button
              size="sm"
              colorScheme={articleFilter === 'published' ? 'green' : 'gray'}
              variant={articleFilter === 'published' ? 'solid' : 'outline'}
              onClick={() => handleFilterChange('published')}
              leftIcon={<span>📰</span>}
            >
              Published
            </Button>
            <Button
              size="sm"
              colorScheme={articleFilter === 'draft' ? 'yellow' : 'gray'}
              variant={articleFilter === 'draft' ? 'solid' : 'outline'}
              onClick={() => handleFilterChange('draft')}
              leftIcon={<span>📝</span>}
            >
              Draft
            </Button>
            {articleFilter !== 'all' && (
              <Button
                size="sm"
                variant="ghost"
                colorScheme="gray"
                onClick={() => handleFilterChange('all')}
              >
                Clear Filter
              </Button>
            )}
          </HStack>
          
          {/* Search Box */}
          <HStack spacing={4} align="center">
            <Text fontWeight="semibold" minW="60px">Search:</Text>
            <Input
              placeholder="Search articles by title, content, or category..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              size="md"
              maxW="400px"
            />
            {searchQuery && (
              <Button
                size="sm"
                variant="ghost"
                colorScheme="gray"
                onClick={() => handleSearchChange('')}
              >
                Clear Search
              </Button>
            )}
            {searchQuery && (
              <Text fontSize="sm" color="gray.600">
                {pagination.totalCount} result{pagination.totalCount !== 1 ? 's' : ''} found
              </Text>
            )}
          </HStack>
        </VStack>
      </Box>

      {/* Bulk Operations Controls */}
      {viewMode === 'list' && getFilteredArticles().length > 0 && (
        <Box mb={6} p={4} bg="gray.50" borderRadius="md">
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <Checkbox
                isChecked={selectedArticles.length === getFilteredArticles().length && getFilteredArticles().length > 0}
                isIndeterminate={selectedArticles.length > 0 && selectedArticles.length < getFilteredArticles().length}
                onChange={handleSelectAll}
              >
                <Text fontSize="sm" fontWeight="medium">
                  Select All ({selectedArticles.length}/{getFilteredArticles().length})
                </Text>
              </Checkbox>
              {selectedArticles.length > 0 && (
                <>
                  <Divider orientation="vertical" height="20px" />
                  <Text fontSize="sm" color="blue.600" fontWeight="medium">
                    {selectedArticles.length} selected
                  </Text>
                </>
              )}
            </HStack>
            
            {selectedArticles.length > 0 && (
              <HStack spacing={3}>
                <Select
                  placeholder="Bulk Actions"
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  size="sm"
                  width="150px"
                >
                  <option value="publish">📰 Publish</option>
                  <option value="unpublish">📝 Unpublish</option>
                  <option value="delete">🗑️ Delete</option>
                </Select>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={handleBulkAction}
                  isDisabled={!bulkAction}
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedArticles([]);
                    setBulkAction('');
                  }}
                >
                  Clear
                </Button>
              </HStack>
            )}
          </Flex>
        </Box>
      )}
      
      {loading ? (
        <Box textAlign="center" py={8}>
          <Spinner size="xl" />
        </Box>
      ) : getFilteredArticles().length === 0 ? (
        <Box textAlign="center" py={8}>
          <Text fontSize="lg" color="gray.500">
            {searchQuery ? 
              `No articles found matching "${searchQuery}"` :
              articleFilter === 'all' ? 'No articles found' : 
              articleFilter === 'published' ? 'No published articles found' : 
              'No draft articles found'}
          </Text>
          {searchQuery && (
            <Button
              size="sm"
              variant="outline"
              colorScheme="blue"
              onClick={() => handleSearchChange('')}
              mt={2}
            >
              Clear Search
            </Button>
          )}
        </Box>
      ) : viewMode === 'cards' ? (
        <Grid templateColumns="repeat(auto-fill, 350px)" gap={6}>
          {getFilteredArticles().map((article) => (
            <Card key={article.id} h="500px" w="350px" display="flex" flexDirection="column" overflow="hidden">
              <CardHeader>
                <Flex justify="space-between" align="start">
                  <Box flex="1">
                    <Heading size="sm" mb={2} noOfLines={2}>{article.title}</Heading>
                    <Badge colorScheme={
                      article.status === 'published' ? 'green' : 
                      article.status === 'scheduled' ? 'blue' : 'yellow'
                    } variant="solid">
                      {article.status === 'published' ? '📰 Published' : 
                       article.status === 'scheduled' ? '⏰ Scheduled' : '📝 Draft'}
                    </Badge>
                  </Box>
                  <HStack>
                    <IconButton
                      size="sm"
                      icon="✏️"
                      aria-label="Edit article"
                      onClick={() => handleEditArticle(article)}
                    />
                    <IconButton
                      size="sm"
                      icon={article.status === 'published' ? '👁️‍🗨️' : '👁️'}
                      aria-label={article.status === 'published' ? 'Unpublish article' : 'Publish article'}
                      colorScheme={article.status === 'published' ? 'orange' : 'green'}
                      onClick={() => handleToggleArticleStatus(article)}
                    />
                    <IconButton
                      size="sm"
                      icon="🗑️"
                      aria-label="Delete article"
                      colorScheme="red"
                      onClick={() => handleDeleteArticle(article.id)}
                    />
                  </HStack>
                </Flex>
              </CardHeader>
              <CardBody flex="1" display="flex" flexDirection="column">
                {article.image_url && (
                  <ChakraImage
                    src={article.image_url}
                    alt={article.title}
                    borderRadius="md"
                    objectFit="cover"
                    h="200px"
                    w="100%"
                    mb={3}
                    fallbackSrc="https://via.placeholder.com/350x200/cccccc/666666?text=No+Image"
                  />
                )}
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Created: {new Date(article.created_at).toLocaleDateString()}
                </Text>
                <FormattedText 
                  content={article.content} 
                  preview={true} 
                  maxLength={120}
                  fontSize="sm"
                  mb={3}
                  flex="1"
                />
                <Button 
                  size="sm" 
                  colorScheme="blue" 
                  variant="outline"
                  onClick={() => window.open(`/article/${article.slug}`, '_blank')}
                  isDisabled={article.status !== 'published'}
                  title={article.status !== 'published' ? 'Article must be published to view' : 'View full article'}
                >
                  {article.status === 'published' ? 'View Full Article' : 'Draft - Cannot View'}
                </Button>
              </CardBody>
            </Card>
          ))}
        </Grid>
      ) : (
        // List View
        <Box>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th width="50px">
                  <Checkbox
                    isChecked={selectedArticles.length === getFilteredArticles().length && getFilteredArticles().length > 0}
                    isIndeterminate={selectedArticles.length > 0 && selectedArticles.length < getFilteredArticles().length}
                    onChange={handleSelectAll}
                  />
                </Th>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Updated</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {getFilteredArticles().map((article) => (
                <Tr key={article.id} _hover={{ bg: 'gray.50' }}>
                  <Td>
                    <Checkbox
                      isChecked={selectedArticles.includes(article.id)}
                      onChange={() => handleSelectArticle(article.id)}
                    />
                  </Td>
                  <Td>
                    <Box>
                      <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                        {article.title}
                      </Text>
                      {article.image_url && (
                        <ChakraImage
                          src={article.image_url}
                          alt={article.title}
                          borderRadius="sm"
                          objectFit="cover"
                          h="40px"
                          w="60px"
                          mt={1}
                          fallbackSrc="https://via.placeholder.com/60x40/cccccc/666666?text=No+Image"
                        />
                      )}
                    </Box>
                  </Td>
                  <Td>
                    <Badge colorScheme={
                      article.status === 'published' ? 'green' : 
                      article.status === 'scheduled' ? 'blue' : 'yellow'
                    } variant="solid" size="sm">
                      {article.status === 'published' ? '📰 Published' : 
                       article.status === 'scheduled' ? '⏰ Scheduled' : '📝 Draft'}
                    </Badge>
                    {article.scheduled_publish_time && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Scheduled: {new Date(article.scheduled_publish_time).toLocaleString('en-US', {
                          timeZone: 'Indian/Maldives',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </Text>
                    )}
                  </Td>
                  <Td fontSize="sm" color="gray.600">
                    {new Date(article.created_at).toLocaleDateString('en-US', {
                      timeZone: 'Indian/Maldives',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Td>
                  <Td fontSize="sm" color="gray.600">
                    {new Date(article.updated_at).toLocaleDateString('en-US', {
                      timeZone: 'Indian/Maldives',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      <IconButton
                        size="xs"
                        icon="✏️"
                        aria-label="Edit article"
                        onClick={() => handleEditArticle(article)}
                      />
                      <IconButton
                        size="xs"
                        icon={article.status === 'published' ? '👁️‍🗨️' : '👁️'}
                        aria-label={article.status === 'published' ? 'Unpublish article' : 'Publish article'}
                        colorScheme={article.status === 'published' ? 'orange' : 'green'}
                        onClick={() => handleToggleArticleStatus(article)}
                      />
                      <IconButton
                        size="xs"
                        icon="🗑️"
                        aria-label="Delete article"
                        colorScheme="red"
                        onClick={() => handleDeleteArticle(article.id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
      
      {/* Pagination Controls */}
      {getFilteredArticles().length > 0 && (
        <Box mt={8} p={4} bg="gray.50" borderRadius="md">
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            {/* Page Size Selector */}
            <HStack spacing={3}>
              <Text fontSize="sm" fontWeight="medium">Show:</Text>
              <Select
                size="sm"
                width="80px"
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Select>
              <Text fontSize="sm" color="gray.600">per page</Text>
            </HStack>
            
            {/* Pagination Info */}
            <Text fontSize="sm" color="gray.600">
              Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of{' '}
              {pagination.totalCount} articles
            </Text>
            
            {/* Pagination Buttons */}
            <HStack spacing={2}>
              <Button
                size="sm"
                variant="outline"
                isDisabled={!pagination.hasPrevious}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                Previous
              </Button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={pageNum === pagination.currentPage ? "solid" : "outline"}
                    colorScheme={pageNum === pagination.currentPage ? "blue" : "gray"}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                size="sm"
                variant="outline"
                isDisabled={!pagination.hasNext}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                Next
              </Button>
            </HStack>
          </Flex>
        </Box>
      )}
    </Box>
  );

  // Ads tab rendering functionality temporarily disabled for deployment

  const renderCommentsTab = () => (
    <Box>
      <Heading size="lg" mb={6}>Comment Moderation</Heading>
      {loading ? (
        <Box textAlign="center" py={8}>
          <Spinner size="xl" />
        </Box>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Article</Th>
              <Th>Author</Th>
              <Th>Comment</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {comments.map((comment) => (
              <Tr key={comment.id}>
                <Td>
                  <Box>
                    <Text fontWeight="medium" fontSize="sm">
                      {comment.article_title || 'N/A'}
                    </Text>
                    <Link 
                      href={`/article/${comment.article_slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      color="blue.500"
                      fontSize="xs"
                      textDecoration="underline"
                    >
                      View Article →
                    </Link>
                  </Box>
                </Td>
                <Td>{comment.author_name}</Td>
                <Td maxW="200px" isTruncated>{comment.content}</Td>
                <Td>
                  <Badge colorScheme={comment.is_approved ? 'green' : 'yellow'}>
                    {comment.is_approved ? 'Approved' : 'Pending'}
                  </Badge>
                </Td>
                <Td>
                  <HStack>
                    {!comment.is_approved && (
                      <Button 
                        size="sm" 
                        colorScheme="green"
                        onClick={() => handleApproveComment(comment.id)}
                      >
                        Approve
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      colorScheme="red"
                      onClick={() => handleRejectComment(comment.id)}
                    >
                      {comment.is_approved ? 'Unapprove' : 'Reject'}
                    </Button>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );

  const renderContactTab = () => (
    <Box>
      <Heading size="lg" mb={6}>Contact Messages</Heading>
      {loading ? (
        <Box textAlign="center" py={8}>
          <Spinner size="xl" />
        </Box>
      ) : (
        <Grid templateColumns="repeat(auto-fill, 400px)" gap={4}>
          {contactMessages.map((message) => (
            <Card key={message.id} h="350px" w="400px" display="flex" flexDirection="column" overflow="hidden">
              <CardHeader>
                <Flex justify="space-between" align="start">
                  <Box>
                    <Heading size="sm" noOfLines={1}>{message.name}</Heading>
                    <Text fontSize="sm" color="gray.600">{message.email}</Text>
                  </Box>
                  <VStack spacing={1} align="end">
                    <Badge colorScheme={message.is_read ? 'green' : 'yellow'}>
                      {message.is_read ? 'Read' : 'Unread'}
                    </Badge>
                    {message.is_archived && (
                      <Badge colorScheme="gray">
                        Archived
                      </Badge>
                    )}
                  </VStack>
                </Flex>
              </CardHeader>
              <CardBody flex="1" display="flex" flexDirection="column">
                <Text fontSize="sm" flex="1" noOfLines={6}>{message.message}</Text>
                <Text fontSize="xs" color="gray.500" mt="auto" mb={2}>
                  {new Date(message.created_at).toLocaleDateString('en-US', {
                    timeZone: 'Indian/Maldives',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </Text>
                <HStack spacing={2} justify="end">
                  <Button
                    size="xs"
                    colorScheme={message.is_archived ? "green" : "gray"}
                    onClick={() => message.is_archived ? handleUnarchiveMessage(message.id) : handleArchiveMessage(message.id)}
                  >
                    {message.is_archived ? "Unarchive" : "Archive"}
                  </Button>
                  {!message.is_read && (
                    <Button
                      size="xs"
                      colorScheme="blue"
                      onClick={() => handleMarkAsRead(message.id)}
                    >
                      Mark Read
                    </Button>
                  )}
                  <Button
                    size="xs"
                    colorScheme="red"
                    variant="outline"
                    onClick={() => handleDeleteMessage(message.id)}
                  >
                    Delete
                  </Button>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderAdsTab = () => (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Ad Management</Heading>
        <Button colorScheme="blue" onClick={handleCreateAd}>
          Create New Ad
        </Button>
      </Flex>
      
      {loading ? (
        <Box textAlign="center" py={8}>
          <Spinner size="xl" />
        </Box>
      ) : (
        <Grid templateColumns="repeat(auto-fill, 350px)" gap={4}>
          {ads.map((ad) => (
            <Card key={ad.id}>
              <CardHeader>
                <Flex justify="space-between" align="start">
                  <Box>
                    <Heading size="sm" noOfLines={1}>{ad.title}</Heading>
                    <Text fontSize="sm" color="gray.600">
                      Placement: {ad.placement?.name || 'None'}
                    </Text>
                  </Box>
                  <Badge colorScheme={ad.is_active ? 'green' : 'red'}>
                    {ad.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </Flex>
              </CardHeader>
              <CardBody>
                {(ad.image_url || ad.image) && (
                  <ChakraImage
                    src={ad.image_url || ad.image}
                    alt={ad.title}
                    maxW="100%"
                    h="150px"
                    objectFit="cover"
                    borderRadius="md"
                    mb={3}
                    fallbackSrc="https://via.placeholder.com/300x150/cccccc/666666?text=No+Image"
                  />
                )}
                {ad.destination_url && (
                  <Text fontSize="sm" color="blue.600" mb={2}>
                    <Link href={ad.destination_url} isExternal>
                      {ad.destination_url}
                    </Link>
                  </Text>
                )}
                <Text fontSize="xs" color="gray.500">
                  Created: {new Date(ad.created_at).toLocaleDateString()}
                </Text>
                {ad.start_date && (
                  <Text fontSize="xs" color="gray.500">
                    Start: {new Date(ad.start_date).toLocaleDateString()}
                  </Text>
                )}
                {ad.end_date && (
                  <Text fontSize="xs" color="gray.500">
                    End: {new Date(ad.end_date).toLocaleDateString()}
                  </Text>
                )}
                <HStack mt={3}>
                  <Button size="sm" colorScheme="blue" onClick={() => handleEditAd(ad)}>
                    Edit
                  </Button>
                  <Button size="sm" colorScheme="red" onClick={() => handleDeleteAd(ad.id)}>
                    Delete
                  </Button>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      )}
    </Box>
  );

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Dhivehinoos.net</title>
      </Helmet>

      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Heading size="xl">Admin Dashboard</Heading>
            <Button colorScheme="red" onClick={handleLogout}>
              Logout
            </Button>
          </Box>

          {/* Navigation Tabs */}
          <Box>
            <HStack spacing={4} mb={6}>
              <Button
                colorScheme={activeTab === 'articles' ? 'blue' : 'gray'}
                onClick={() => setActiveTab('articles')}
              >
                Articles ({articles.length})
              </Button>
              <Button
                colorScheme={activeTab === 'comments' ? 'blue' : 'gray'}
                onClick={() => setActiveTab('comments')}
              >
                Comments ({comments.length})
              </Button>
              <Button
                colorScheme={activeTab === 'contact' ? 'blue' : 'gray'}
                onClick={() => setActiveTab('contact')}
              >
                Messages ({contactMessages.length})
              </Button>
            <Button
              colorScheme={activeTab === 'ads' ? 'blue' : 'gray'}
              onClick={() => setActiveTab('ads')}
            >
              Ads ({ads.length})
            </Button>
            <Button
              colorScheme={activeTab === 'placement-map' ? 'blue' : 'gray'}
              onClick={() => setActiveTab('placement-map')}
            >
              Placement Map
            </Button>
            <Button
              colorScheme={activeTab === 'scheduling' ? 'blue' : 'gray'}
              onClick={() => setActiveTab('scheduling')}
            >
              Scheduling
            </Button>
            <Button
              colorScheme={activeTab === 'subscriptions' ? 'blue' : 'gray'}
              onClick={() => setActiveTab('subscriptions')}
            >
              Subscriptions
            </Button>
              <Button
                colorScheme="purple"
                onClick={() => navigate('/admin/settings')}
                leftIcon={<span>⚙️</span>}
              >
                Settings
              </Button>
            </HStack>
          </Box>

          {/* Content */}
          {activeTab === 'articles' && renderArticlesTab()}
          {activeTab === 'comments' && renderCommentsTab()}
          {activeTab === 'contact' && renderContactTab()}
          {activeTab === 'ads' && renderAdsTab()}
          {activeTab === 'scheduling' && <SchedulingPage />}
          {activeTab === 'subscriptions' && <SubscriptionManagement />}
        {activeTab === 'placement-map' && (
          <AdPlacementMap
            ads={ads}
            adPlacements={adPlacements}
            onAdUpdate={handleEditAd}
            onRefresh={fetchData}
          />
        )}
        </VStack>
      </Container>

      {/* Article Modal */}
      <Modal isOpen={isArticleModalOpen} onClose={onArticleModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingArticle ? 'Edit Article' : 'Create Article'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input 
                  placeholder="Article title" 
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({...articleForm, title: e.target.value})}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Content</FormLabel>
                <Textarea 
                  placeholder="Article content" 
                  rows={6}
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Image (Optional)</FormLabel>
                <VStack spacing={3} align="stretch">
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>Option 1: Upload Image File</Text>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setArticleForm({...articleForm, image: event.target.result, imageFile: file});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>Option 2: Image URL</Text>
                    <Input 
                      placeholder="https://example.com/image.jpg" 
                      value={articleForm.image}
                      onChange={(e) => {
                        // Clear file input when switching to URL mode
                        const fileInputs = document.querySelectorAll('input[type="file"]');
                        fileInputs.forEach(input => input.value = '');
                        setArticleForm({...articleForm, image: e.target.value, imageFile: null});
                      }}
                    />
                  </Box>
                </VStack>
                <FormHelperText>
                  Choose either upload a file or enter an image URL. Leave empty if no image needed.
                </FormHelperText>
                {articleForm.image && (
                  <Box mt={2}>
                    <Text fontSize="sm" color="gray.600" mb={1}>Preview:</Text>
                    <ChakraImage
                      src={articleForm.image}
                      alt="Article preview"
                      borderRadius="md"
                      objectFit="cover"
                      h="100px"
                      w="200px"
                      fallbackSrc="https://via.placeholder.com/200x100/cccccc/666666?text=Image+Not+Found"
                    />
                  </Box>
                )}
              </FormControl>
              <FormControl>
                <FormLabel>Publishing Mode</FormLabel>
                <Select 
                  value={articleForm.publishing_mode}
                  onChange={(e) => setArticleForm({...articleForm, publishing_mode: e.target.value})}
                >
                  <option value="instant">Instant</option>
                  <option value="scheduled">Scheduled</option>
                </Select>
                <FormHelperText>
                  Choose how this article should be published
                </FormHelperText>
              </FormControl>
              
              {articleForm.publishing_mode === 'scheduled' && (
                <FormControl>
                  <FormLabel>Scheduled Publish Time</FormLabel>
                  <Input 
                    type="datetime-local"
                    value={articleForm.scheduled_publish_time}
                    onChange={(e) => setArticleForm({...articleForm, scheduled_publish_time: e.target.value})}
                  />
                  <FormHelperText>
                    When this article should be published (leave empty to use default schedule)
                  </FormHelperText>
                </FormControl>
              )}
              
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select 
                  value={articleForm.status}
                  onChange={(e) => setArticleForm({...articleForm, status: e.target.value})}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </Select>
                <FormHelperText>
                  Draft: Not visible to public. Published: Visible immediately. Scheduled: Will be published at scheduled time.
                </FormHelperText>
              </FormControl>
              <HStack spacing={4} w="full">
                <Button colorScheme="blue" flex="1" onClick={handleArticleSubmit}>
                  {editingArticle ? 'Update Article' : 'Create Article'}
                </Button>
                <Button onClick={onArticleModalClose} flex="1">
                  Cancel
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Ad Modal */}
      <Modal isOpen={isAdModalOpen} onClose={onAdModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingAd ? 'Edit Ad' : 'Create New Ad'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Ad Title</FormLabel>
                <Input 
                  placeholder="Ad title" 
                  value={adForm.title}
                  onChange={(e) => setAdForm({...adForm, title: e.target.value})}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Destination URL</FormLabel>
                <Input 
                  placeholder="https://example.com" 
                  value={adForm.destination_url}
                  onChange={(e) => setAdForm({...adForm, destination_url: e.target.value})}
                />
                <FormHelperText>
                  Optional: Where users will be redirected when they click the ad
                </FormHelperText>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Ad Placement</FormLabel>
                <Select 
                  value={adForm.placement}
                  onChange={(e) => setAdForm({...adForm, placement: e.target.value})}
                >
                  <option value="">Select placement</option>
                  {adPlacements.map((placement) => (
                    <option key={placement.id} value={placement.id}>
                      {placement.name} - {placement.description}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Ad Image</FormLabel>
                <VStack spacing={3} align="stretch">
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>Upload Image File</Text>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setAdForm({...adForm, image: event.target.result, imageFile: file});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </Box>
                </VStack>
                <FormHelperText>
                  Upload an image file for the ad. Recommended size: 300x250px for sidebar, 728x90px for banners.
                </FormHelperText>
                {adForm.image && (
                  <Box mt={2}>
                    <Text fontSize="sm" color="gray.600" mb={1}>Preview:</Text>
                    <ChakraImage
                      src={adForm.image}
                      alt="Ad preview"
                      borderRadius="md"
                      objectFit="cover"
                      h="100px"
                      w="200px"
                      fallbackSrc="https://via.placeholder.com/200x100/cccccc/666666?text=Image+Not+Found"
                    />
                  </Box>
                )}
              </FormControl>
              
              <FormControl>
                <FormLabel>Start Date (Optional)</FormLabel>
                <Input 
                  type="date"
                  value={adForm.start_date}
                  onChange={(e) => setAdForm({...adForm, start_date: e.target.value})}
                />
                <FormHelperText>
                  Leave empty to start immediately
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>End Date (Optional)</FormLabel>
                <Input 
                  type="date"
                  value={adForm.end_date}
                  onChange={(e) => setAdForm({...adForm, end_date: e.target.value})}
                />
                <FormHelperText>
                  Leave empty for no end date
                </FormHelperText>
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Active</FormLabel>
                <Switch
                  isChecked={adForm.is_active}
                  onChange={(e) => setAdForm({...adForm, is_active: e.target.checked})}
                  colorScheme="blue"
                />
              </FormControl>
              
              <HStack spacing={4} w="full">
                <Button colorScheme="blue" flex="1" onClick={handleAdSubmit}>
                  {editingAd ? 'Update Ad' : 'Create Ad'}
                </Button>
                <Button onClick={onAdModalClose} flex="1">
                  Cancel
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AdminDashboard;
