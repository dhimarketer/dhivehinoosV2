import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Image as ChakraImage,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Flex,
  Button,
  HStack,
  SimpleGrid,
  Divider,
  Skeleton,
} from '@chakra-ui/react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { articlesAPI } from '../services/api';
import StoryCard from '../components/StoryCard';
import CategoryNavigation from '../components/CategoryNavigation';
import AdComponent from '../components/AdComponent';

const HomePage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrevious: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const articlesResponse = await articlesAPI.getPublished(selectedCategory, pagination.currentPage, pagination.pageSize);
        console.log('Articles response:', articlesResponse.data);
        setArticles(articlesResponse.data.results || articlesResponse.data);
        
        // Update pagination info
        setPagination({
          currentPage: articlesResponse.data.current_page || pagination.currentPage,
          pageSize: articlesResponse.data.page_size || pagination.pageSize,
          totalPages: articlesResponse.data.total_pages || 1,
          totalCount: articlesResponse.data.count || 0,
          hasNext: articlesResponse.data.next !== null,
          hasPrevious: articlesResponse.data.previous !== null
        });
        
        // Preload images for better first-visit experience
        preloadImages(articlesResponse.data.results || articlesResponse.data);
      } catch (err) {
        setError('Failed to load articles');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, pagination.currentPage, pagination.pageSize]);

  // Preload images to improve first-visit experience
  const preloadImages = (articles) => {
    const imageUrls = [];
    
    // Collect article image URLs
    articles.forEach(article => {
      if (article.image_url) {
        imageUrls.push(article.image_url);
      }
    });
    
    // Preload images
    imageUrls.forEach(url => {
      const img = new Image();
      img.src = url;
      img.onload = () => console.log('Preloaded image:', url);
      img.onerror = () => console.log('Failed to preload image:', url);
    });
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, currentPage: 1 }));
  };

  // Ad rendering functionality temporarily disabled for deployment

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center">
          <Spinner size="xl" />
          <Text mt={4}>Loading articles...</Text>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dhivehinoos.net - AI-Generated Fictional Content for Research</title>
        <meta name="description" content="AI-generated fictional content for research purposes. Not a news site - all content is fictional material created for academic research and entertainment." />
        <meta name="keywords" content="Maldives, AI content, fictional stories, research, academic, entertainment" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Dhivehinoos.net" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dhivehinoos.net/" />
        <meta property="og:title" content="Dhivehinoos.net - AI-Generated Fictional Content" />
        <meta property="og:description" content="AI-generated fictional content for research purposes. Not a news site - all content is fictional material created for academic research and entertainment." />
        <meta property="og:site_name" content="Dhivehinoos.net" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://dhivehinoos.net/" />
        <meta property="twitter:title" content="Dhivehinoos.net - AI-Generated Fictional Content" />
        <meta property="twitter:description" content="AI-generated fictional content for research purposes. Not a news site - all content is fictional material created for academic research and entertainment." />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Dhivehinoos.net",
            "description": "AI-generated fictional content for research purposes",
            "url": "https://dhivehinoos.net/",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://dhivehinoos.net/?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>

      {/* Navigation Header */}
      <Box className="site-header" bg="white" shadow="sm" borderBottom="1px" borderColor="gray.200">
        <Container maxW="container.xl" py={4}>
          <Flex justify="space-between" align="center">
            <Heading size="lg" className="site-title" color="brand.600">
              Dhivehinoos.net
            </Heading>
            <HStack spacing={4}>
              <Button as={Link} to="/" variant="ghost" size="sm">
                Home
              </Button>
              <Button as={Link} to="/contact" variant="ghost" size="sm">
                Contact
              </Button>
              <Button as={Link} to="/admin/login" colorScheme="brand" size="sm">
                Admin Login
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" py={8}>
        {/* Top Banner Ad */}
        <Box mb={6}>
          <AdComponent placement="top_banner" maxAds={1} />
        </Box>

        {/* Category Navigation */}
        <CategoryNavigation selectedCategory={selectedCategory} />

        {/* Featured Article Section */}
        {articles.length > 0 && (
          <Box mb={12}>
            <Heading size="lg" mb={6} color="gray.800" textAlign="center">
              {selectedCategory ? `Latest ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} News` : 'Latest News'}
            </Heading>
            <StoryCard article={articles[0]} variant="featured" />
          </Box>
        )}

        <Divider my={8} />

        {/* Main Articles Grid */}
        <Box>
          <Heading size="md" mb={6} color="gray.700" textAlign="center">
            More News
          </Heading>
          
          {/* Responsive Grid Layout */}
          <Grid templateColumns="repeat(auto-fill, 350px)" gap={6} justifyItems="center">
            {articles.slice(1).map((article, index) => (
              <StoryCard key={article.id} article={article} variant="default" />
            ))}
          </Grid>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <Box mt={8} p={4} bg="gray.50" borderRadius="md">
              <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                {/* Page Size Selector */}
                <HStack spacing={3}>
                  <Text fontSize="sm" fontWeight="medium">Show:</Text>
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px'
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
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

        {/* Sidebar Ad */}
        <Box mt={8} textAlign="center">
          <AdComponent placement="sidebar" maxAds={2} />
        </Box>

        {/* Sidebar-style compact articles for additional content */}
        {articles.length > 7 && (
          <Box mt={12}>
            <Heading size="md" mb={6} color="gray.700" textAlign="center">
              Recent Stories
            </Heading>
            <SimpleGrid 
              columns={{ base: 1, md: 2 }} 
              spacing={4}
              maxW="800px"
              mx="auto"
            >
              {articles.slice(7, 11).map((article) => (
                <StoryCard key={article.id} article={article} variant="compact" />
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Bottom Banner Ad */}
        <Box mt={12} textAlign="center">
          <AdComponent placement="bottom_banner" maxAds={1} />
        </Box>
      </Container>
    </>
  );
};

export default HomePage;
