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
} from '@chakra-ui/react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { articlesAPI, commentsAPI, contactAPI } from '../../services/api';
import api from '../../services/api';
import FormattedText from '../../components/FormattedText';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('articles');
  const [articles, setArticles] = useState([]);
  const [comments, setComments] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [articleFilter, setArticleFilter] = useState('all'); // 'all', 'published', 'draft'
  const [editingArticle, setEditingArticle] = useState(null);
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    image: '',
    imageFile: null,
    status: 'draft'
  });
  
  const { isOpen: isArticleModalOpen, onOpen: onArticleModalOpen, onClose: onArticleModalClose } = useDisclosure();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all articles from admin API with pagination
      const fetchAllArticles = async () => {
        try {
          console.log('Fetching all articles from admin API...');
          let allArticles = [];
          let page = 1;
          let hasNext = true;
          
          while (hasNext && page <= 10) { // Safety limit
            try {
              const response = await api.get(`/articles/admin/?page=${page}&page_size=100&t=${Date.now()}`);
              console.log(`Admin API response (page ${page}):`, response.data);
              
              if (response.data.results) {
                allArticles = [...allArticles, ...response.data.results];
                hasNext = response.data.next !== null;
                page++;
              } else {
                hasNext = false;
              }
            } catch (pageError) {
              console.warn(`Error fetching page ${page}, stopping pagination:`, pageError.message);
              hasNext = false;
            }
          }
          
          console.log(`Final result: ${allArticles.length} articles fetched`);
          return allArticles;
        } catch (error) {
          console.error('Error fetching articles from admin API:', error);
          return [];
        }
      };

      const [articles, commentsRes, contactRes] = await Promise.all([
        fetchAllArticles(),
        commentsAPI.getAll ? commentsAPI.getAll() : { data: { results: [] } },
        contactAPI.getAll(),
      ]);
      
      setArticles(articles);
      setComments(commentsRes.data.results || commentsRes.data || []);
      setContactMessages(contactRes.data.results || contactRes.data || []);
      
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
    localStorage.removeItem('isAuthenticated');
    navigate('/admin/login');
  };

  // Filter functions
  const getFilteredArticles = () => {
    switch (articleFilter) {
      case 'published':
        return articles.filter(article => article.status === 'published');
      case 'draft':
        return articles.filter(article => article.status === 'draft');
      default:
        return articles;
    }
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
      status: 'draft'
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
      status: article.status || 'draft'
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
        apiData.append('status', articleForm.status);
      } else {
        // Regular JSON data for URL-based images or no image
        apiData = {
          title: articleForm.title,
          content: articleForm.content,
          image: articleForm.image || null,
          status: articleForm.status
        };
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
      await articlesAPI.update(article.id, { ...article, status: newStatus });
      
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
        await articlesAPI.delete(id);
        await fetchData();
        toast({
          title: 'Article deleted',
          status: 'success',
          duration: 2000,
        });
      } catch (error) {
        toast({
          title: 'Error deleting article',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  // Ad status toggle and deletion functionality temporarily disabled for deployment

  const handleApproveComment = async (id) => {
    try {
      await commentsAPI.approve(id);
      await fetchData();
      toast({
        title: 'Comment approved',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error approving comment:', error);
      toast({
        title: 'Error approving comment',
        description: error.response?.data?.detail || 'Failed to approve comment',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleRejectComment = async (id) => {
    if (window.confirm('Are you sure you want to reject this comment?')) {
      try {
        await commentsAPI.reject(id);
        await fetchData();
        toast({
          title: 'Comment rejected',
          status: 'success',
          duration: 2000,
        });
      } catch (error) {
        console.error('Error rejecting comment:', error);
        toast({
          title: 'Error rejecting comment',
          description: error.response?.data?.detail || 'Failed to reject comment',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  const renderArticlesTab = () => (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Article Management</Heading>
        <Button colorScheme="blue" onClick={handleCreateArticle}>
          Create New Article
        </Button>
      </Flex>
      
      {/* Article Filter */}
      <Box mb={6}>
        <HStack spacing={4} align="center">
          <Text fontWeight="semibold">Filter:</Text>
          <Button
            size="sm"
            colorScheme={articleFilter === 'all' ? 'blue' : 'gray'}
            variant={articleFilter === 'all' ? 'solid' : 'outline'}
            onClick={() => setArticleFilter('all')}
            leftIcon={<span>📋</span>}
          >
            All ({articles.length})
          </Button>
          <Button
            size="sm"
            colorScheme={articleFilter === 'published' ? 'green' : 'gray'}
            variant={articleFilter === 'published' ? 'solid' : 'outline'}
            onClick={() => setArticleFilter('published')}
            leftIcon={<span>📰</span>}
          >
            Published ({articles.filter(a => a.status === 'published').length})
          </Button>
          <Button
            size="sm"
            colorScheme={articleFilter === 'draft' ? 'yellow' : 'gray'}
            variant={articleFilter === 'draft' ? 'solid' : 'outline'}
            onClick={() => setArticleFilter('draft')}
            leftIcon={<span>📝</span>}
          >
            Draft ({articles.filter(a => a.status === 'draft').length})
          </Button>
          {articleFilter !== 'all' && (
            <Button
              size="sm"
              variant="ghost"
              colorScheme="gray"
              onClick={() => setArticleFilter('all')}
            >
              Clear Filter
            </Button>
          )}
        </HStack>
      </Box>
      
      {loading ? (
        <Box textAlign="center" py={8}>
          <Spinner size="xl" />
        </Box>
      ) : getFilteredArticles().length === 0 ? (
        <Box textAlign="center" py={8}>
          <Text fontSize="lg" color="gray.500">
            {articleFilter === 'all' ? 'No articles found' : 
             articleFilter === 'published' ? 'No published articles found' : 
             'No draft articles found'}
          </Text>
        </Box>
      ) : (
        <Grid templateColumns="repeat(auto-fill, 350px)" gap={6}>
          {getFilteredArticles().map((article) => (
            <Card key={article.id} h="500px" w="350px" display="flex" flexDirection="column" overflow="hidden">
              <CardHeader>
                <Flex justify="space-between" align="start">
                  <Box flex="1">
                    <Heading size="sm" mb={2} noOfLines={2}>{article.title}</Heading>
                    <Badge colorScheme={article.status === 'published' ? 'green' : 'yellow'} variant="solid">
                      {article.status === 'published' ? '📰 Published' : '📝 Draft'}
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
                <Td>{comment.article_title || 'N/A'}</Td>
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
            <Card key={message.id} h="300px" w="400px" display="flex" flexDirection="column" overflow="hidden">
              <CardHeader>
                <Flex justify="space-between" align="start">
                  <Box>
                    <Heading size="sm" noOfLines={1}>{message.name}</Heading>
                    <Text fontSize="sm" color="gray.600">{message.email}</Text>
                  </Box>
                  <Badge colorScheme={message.is_read ? 'green' : 'yellow'}>
                    {message.is_read ? 'Read' : 'Unread'}
                  </Badge>
                </Flex>
              </CardHeader>
              <CardBody flex="1" display="flex" flexDirection="column">
                <Text fontSize="sm" flex="1">{message.message}</Text>
                <Text fontSize="xs" color="gray.500" mt="auto">
                  {new Date(message.created_at).toLocaleDateString()}
                </Text>
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
                <FormLabel>Status</FormLabel>
                <Select 
                  value={articleForm.status}
                  onChange={(e) => setArticleForm({...articleForm, status: e.target.value})}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </Select>
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

      {/* Ad Modal temporarily disabled for deployment */}
    </>
  );
};

export default AdminDashboard;
