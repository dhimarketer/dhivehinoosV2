import React, { useState, useEffect, useRef } from 'react';
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
import { lazy, Suspense } from 'react';
import { articlesAPI } from '../services/api';
import StoryCard from '../components/StoryCard';
import TopNavigation from '../components/TopNavigation';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { getOptimizedImageUrlBySize } from '../utils/imageOptimization';

// Lazy load components that aren't immediately visible or below the fold
const AdComponent = lazy(() => import('../components/AdComponent'));
const NewsletterSubscription = lazy(() => import('../components/NewsletterSubscription'));

const HomePage = () => {
  const { settings } = useSiteSettings();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Separate state for input field
  const [searchResults, setSearchResults] = useState([]);
  // Simplified pagination - use default from settings, but user can override
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10, // Initial default, will be updated from settings
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrevious: false
  });
  const settingsInitialized = useRef(false);
  
  // Helper function to round page size to be divisible by columns
  const roundToColumnMultiple = (size, columns) => {
    if (!columns || columns < 1) return size;
    return Math.max(columns, Math.floor(size / columns) * columns);
  };

  // Set default pageSize from settings once when settings first load
  // Round it to be divisible by columns
  useEffect(() => {
    if (!settingsInitialized.current && settings.default_pagination_size) {
      const columns = settings.story_cards_columns || 3;
      const roundedSize = roundToColumnMultiple(settings.default_pagination_size, columns);
      setPagination(prev => ({ 
        ...prev, 
        pageSize: roundedSize 
      }));
      settingsInitialized.current = true;
    }
  }, [settings.default_pagination_size, settings.story_cards_columns]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let articlesResponse;
        if (searchQuery.trim()) {
          // Use search API when there's a search query
          articlesResponse = await articlesAPI.search(searchQuery.trim(), selectedCategory, pagination.currentPage, pagination.pageSize);
          setSearchResults(articlesResponse.data.results || articlesResponse.data);
          setArticles([]); // Clear regular articles when searching
        } else {
          // Use regular API when no search query
          articlesResponse = await articlesAPI.getPublished(selectedCategory, pagination.currentPage, pagination.pageSize);
          setArticles(articlesResponse.data.results || articlesResponse.data);
          setSearchResults([]); // Clear search results when not searching
        }
        
        // Update pagination info - keep user's pageSize selection, don't override from API
        setPagination(prev => ({
          ...prev,
          currentPage: articlesResponse.data.current_page || prev.currentPage,
          // Don't override pageSize - respect user's selection
          totalPages: articlesResponse.data.total_pages || 1,
          totalCount: articlesResponse.data.count || 0,
          hasNext: articlesResponse.data.next !== null,
          hasPrevious: articlesResponse.data.previous !== null
        }));
        
        // Preload images for better LCP
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

  // Preload images to improve LCP - use link preload for better performance
  const preloadImages = (articles) => {
    // Only preload the first featured image (LCP element) using link preload
    // This is more efficient than Image() preloading and prevents duplicates
    if (articles && articles.length > 0 && articles[0].image_url) {
      const firstArticle = articles[0];
      // Use link preload - matches the srcSet 800w size for optimal LCP
      // Don't use 1200w as that might not be needed initially
      if (firstArticle.image_url && firstArticle.image_url.includes('fal.media')) {
        const optimizedUrl = getOptimizedImageUrlBySize(firstArticle.image_url, 800, 450);
        // Check if already preloaded to avoid duplicates
        const existingPreload = document.querySelector(`link[rel="preload"][href="${optimizedUrl}"]`);
        if (!existingPreload) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = optimizedUrl;
          link.fetchPriority = 'high';
          document.head.appendChild(link);
        }
      }
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handlePageSizeChange = (newPageSize) => {
    const columns = settings.story_cards_columns || 3;
    const roundedSize = roundToColumnMultiple(newPageSize, columns);
    setPagination(prev => ({ ...prev, pageSize: roundedSize, currentPage: 1 }));
  };
  
  // Adjust pageSize when columns change to ensure it's divisible by columns
  useEffect(() => {
    const columns = settings.story_cards_columns || 3;
    if (pagination.pageSize % columns !== 0) {
      const roundedSize = roundToColumnMultiple(pagination.pageSize, columns);
      setPagination(prev => ({ ...prev, pageSize: roundedSize }));
    }
  }, [settings.story_cards_columns]);

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
        selectedCategory={selectedCategory}
      />

      <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
        {/* Top Banner Ad */}
        <Box mb={{ base: 4, md: 6 }}>
          <Suspense fallback={null}>
            <AdComponent placement="top_banner" maxAds={1} />
          </Suspense>
        </Box>


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
              /* Search Results Grid - Dynamic Layout */
              <Grid 
                templateColumns={{ 
                  base: "1fr", 
                  sm: `repeat(${Math.min(settings.story_cards_columns || 3, 2)}, 1fr)`, 
                  md: `repeat(${settings.story_cards_columns || 3}, 1fr)` 
                }} 
                gap={{ base: 4, md: 6 }} 
                justifyItems="center"
                maxW="1200px"
                mx="auto"
              >
                {searchResults.map((article) => (
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
              
              {/* Dynamic Grid Layout based on settings */}
              <Grid 
                templateColumns={{ 
                  base: "1fr", 
                  sm: `repeat(${Math.min(settings.story_cards_columns || 3, 2)}, 1fr)`, 
                  md: `repeat(${settings.story_cards_columns || 3}, 1fr)` 
                }} 
                gap={{ base: 4, md: 6 }} 
                justifyItems="center"
                maxW="1200px"
                mx="auto"
              >
                {/* Show all articles from paginated results (skip first one which is featured) */}
                {articles.slice(1).map((article) => (
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

        {/* Newsletter Subscription Section */}
        {!searchQuery.trim() && (
          <Box mb={8}>
            <Suspense fallback={null}>
              <NewsletterSubscription variant="inline" showTitle={true} />
            </Suspense>
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
                  {(() => {
                    const columns = settings.story_cards_columns || 3;
                    // Generate options that are multiples of columns
                    // For 3 columns: 3, 6, 9, 12, 15, 18, 21, 24
                    // For 4 columns: 4, 8, 12, 16, 20, 24, 28, 32
                    const options = [];
                    const maxOptions = 8; // Show up to 8 options
                    for (let i = 1; i <= maxOptions; i++) {
                      const value = columns * i;
                      if (value <= 100) { // Cap at 100
                        options.push(
                          <option key={value} value={value}>
                            {value}
                          </option>
                        );
                      }
                    }
                    return options;
                  })()}
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
        <Box mt={{ base: 6, md: 8 }} textAlign="center">
          <Suspense fallback={null}>
            <AdComponent placement="sidebar" maxAds={2} />
          </Suspense>
        </Box>

        {/* Sidebar-style compact articles for additional content */}
        {articles.length > 7 && (
          <Box mt={12}>
            <Heading size="md" mb={6} color="gray.700" textAlign="center">
              Recent Stories
            </Heading>
            <SimpleGrid 
              columns={{ base: 1, sm: 2, md: 3 }} 
              spacing={4}
              maxW="1200px"
              mx="auto"
            >
              {articles.slice(7, 10).map((article) => (
                <StoryCard key={article.id} article={article} variant="compact" />
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Bottom Banner Ad */}
        <Box mt={{ base: 8, md: 12 }} textAlign="center">
          <Suspense fallback={null}>
            <AdComponent placement="bottom_banner" maxAds={1} />
          </Suspense>
        </Box>
      </Container>
    </>
  );
};

export default HomePage;
