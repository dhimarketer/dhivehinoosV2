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
  Badge,
  VStack,
} from '@chakra-ui/react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { articlesAPI } from '../services/api';
import StoryCard from '../components/StoryCard';
import CategoryNavigation from '../components/CategoryNavigation';
import AdComponent from '../components/AdComponent';
import TopNavigation from '../components/TopNavigation';
import { useSiteSettings } from '../hooks/useSiteSettings';

const HomePage = () => {
  const { settings } = useSiteSettings();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Separate state for input field
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
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
        setError(null);
        
        let articlesResponse;
        if (searchQuery.trim()) {
          // Use search API when there's a search query
          articlesResponse = await articlesAPI.search(searchQuery.trim(), selectedCategory, pagination.currentPage, pagination.pageSize);
          console.log('Search response:', articlesResponse.data);
          setSearchResults(articlesResponse.data.results || articlesResponse.data);
          setArticles([]); // Clear regular articles when searching
        } else {
          // Use regular API when no search query
          articlesResponse = await articlesAPI.getPublished(selectedCategory, pagination.currentPage, pagination.pageSize);
          console.log('Articles response:', articlesResponse.data);
          setArticles(articlesResponse.data.results || articlesResponse.data);
          setSearchResults([]); // Clear search results when not searching
        }
        
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
        const articlesToPreload = searchQuery.trim() ? 
          (articlesResponse.data.results || articlesResponse.data) : 
          (articlesResponse.data.results || articlesResponse.data);
        preloadImages(articlesToPreload);
      } catch (err) {
        setError('Failed to load articles');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, pagination.currentPage, pagination.pageSize, searchQuery]);

  // Search only on Enter key press
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle input change (no search until Enter)
  const handleSearchInput = (value) => {
    setSearchInput(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setSearchResults([]);
  };

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
        <title>{settings.site_name} - {settings.site_description}</title>
        <meta name="description" content={settings.site_description} />
        <meta name="keywords" content="Maldives, Dhivehi, Maldivian diaspora, cultural insights, Twitter thoughts, authentic content" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content={settings.site_name} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dhivehinoos.net/" />
        <meta property="og:title" content={`${settings.site_name} - ${settings.site_description}`} />
        <meta property="og:description" content={settings.site_description} />
        <meta property="og:site_name" content={settings.site_name} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://dhivehinoos.net/" />
        <meta property="twitter:title" content={`${settings.site_name} - ${settings.site_description}`} />
        <meta property="twitter:description" content={settings.site_description} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": settings.site_name,
            "description": settings.site_description,
            "url": "https://dhivehinoos.net/",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://dhivehinoos.net/?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>

      {/* Top Navigation */}
      <TopNavigation 
        onSearch={handleSearchSubmit}
        onSearchInput={handleSearchInput}
        searchQuery={searchInput}
        setSearchQuery={setSearchInput}
        onClearSearch={clearSearch}
      />

      <Container maxW="container.xl" py={8}>
        {/* Top Banner Ad */}
        <Box mb={6}>
          <AdComponent placement="top_banner" maxAds={1} />
        </Box>

        {/* Category Navigation */}
        <CategoryNavigation selectedCategory={selectedCategory} />

        {/* Search Results or Regular Content */}
        {loading ? (
          <Box mb={12}>
            <VStack spacing={4} align="center">
              <Spinner size="lg" />
              <Text>{searchQuery.trim() ? 'Searching articles...' : 'Loading articles...'}</Text>
            </VStack>
          </Box>
        ) : searchQuery.trim() ? (
          <Box mb={12}>
            <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
              <Heading size="lg" color="gray.800">
                Search Results for "{searchQuery}"
              </Heading>
              <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                {pagination.totalCount} result{pagination.totalCount !== 1 ? 's' : ''} found
              </Badge>
            </Flex>
            
            {searchResults.length > 0 ? (
              /* Search Results Grid - Mobile Optimized */
              <Grid 
                templateColumns={{ 
                  base: "1fr", 
                  sm: "repeat(auto-fill, minmax(300px, 1fr))", 
                  md: "repeat(auto-fill, minmax(350px, 1fr))" 
                }} 
                gap={{ base: 4, md: 6 }} 
                justifyItems="center"
              >
                {searchResults.map((article, index) => (
                  <StoryCard key={article.id} article={article} variant="default" />
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={8}>
                <Text fontSize="lg" color="gray.500" mb={4}>
                  No articles found matching "{searchQuery}"
                </Text>
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="outline"
                  colorScheme="blue"
                  size="sm"
                >
                  Clear Search
                </Button>
              </Box>
            )}
          </Box>
        ) : (
          <>
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
              
              {/* Responsive Grid Layout - Mobile Optimized */}
              <Grid 
                templateColumns={{ 
                  base: "1fr", 
                  sm: "repeat(auto-fill, minmax(300px, 1fr))", 
                  md: "repeat(auto-fill, minmax(350px, 1fr))" 
                }} 
                gap={{ base: 4, md: 6 }} 
                justifyItems="center"
              >
                {articles.slice(1).map((article, index) => (
                  <StoryCard key={article.id} article={article} variant="default" />
                ))}
              </Grid>
            </Box>
          </>
        )}

        {/* Clear Search Button */}
        {searchQuery.trim() && (
          <Box mb={6} textAlign="center">
            <Button
              onClick={clearSearch}
              variant="outline"
              colorScheme="gray"
              size="sm"
            >
              Clear Search
            </Button>
          </Box>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <Box mt={8} p={{ base: 4, md: 6 }} bg="gray.50" borderRadius="md">
            <VStack spacing={4}>
              {/* Page Size Selector - Mobile Friendly */}
              <HStack spacing={3} wrap="wrap" justify="center">
                <Text fontSize="sm" fontWeight="medium">Show:</Text>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    minWidth: '60px'
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <Text fontSize="sm" color="gray.600">per page</Text>
              </HStack>
              
              {/* Pagination Info - Mobile Friendly */}
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of{' '}
                {pagination.totalCount} articles
              </Text>
              
              {/* Pagination Buttons - Mobile Optimized */}
              <HStack spacing={2} wrap="wrap" justify="center">
                <Button
                  size="sm"
                  variant="outline"
                  isDisabled={!pagination.hasPrevious}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  minW="80px"
                >
                  Previous
                </Button>
                
                {/* Page Numbers - Responsive */}
                <HStack spacing={1} wrap="wrap" justify="center">
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
                        minW="40px"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </HStack>
                
                <Button
                  size="sm"
                  variant="outline"
                  isDisabled={!pagination.hasNext}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  minW="80px"
                >
                  Next
                </Button>
              </HStack>
            </VStack>
          </Box>
        )}

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
