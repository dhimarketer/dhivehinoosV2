import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Spinner,
  Alert,
  Flex,
  Button,
  HStack,
  SimpleGrid,
  Divider,
  Skeleton,
  Badge,
  VStack,
  Select,
} from '../components/ui';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { articlesAPI } from '../services/api';
import StoryCard from '../components/StoryCard';
import TopNavigation from '../components/TopNavigation';
import ThemeLayout from '../components/ThemeLayout';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useTheme } from '../hooks/useTheme';
import { getOptimizedImageUrlBySize } from '../utils/imageOptimization';

// Lazy load components that aren't immediately visible or below the fold
const AdComponent = lazy(() => import('../components/AdComponent'));
const NewsletterSubscription = lazy(() => import('../components/NewsletterSubscription'));

const HomePage = () => {
  const { settings } = useSiteSettings();
  const { themeName } = useTheme();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { slug: categorySlug } = useParams();
  const selectedCategory = categorySlug || null;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Separate state for input field
  const [searchResults, setSearchResults] = useState([]);
  // Helper function to round page size to be divisible by columns
  const roundToColumnMultiple = (size, columns) => {
    if (!columns || columns < 1) return size;
    return Math.max(columns, Math.floor(size / columns) * columns);
  };

  // Simplified pagination - use default from settings, but user can override
  const [pagination, setPagination] = useState(() => {
    // Lazy initializer - calculate from settings if available, otherwise use safe default
    const initialSize = settings.default_pagination_size || 12;
    const columns = settings.story_cards_columns || 3;
    return {
      currentPage: 1,
      pageSize: roundToColumnMultiple(initialSize, columns),
      totalPages: 1,
      totalCount: 0,
      hasNext: false,
      hasPrevious: false
    };
  });
  
  // Update pageSize when settings change (this handles when settings load asynchronously)
  useEffect(() => {
    if (settings.default_pagination_size) {
      const columns = settings.story_cards_columns || 3;
      const roundedSize = roundToColumnMultiple(settings.default_pagination_size, columns);
      setPagination(prev => {
        // Only update if it's different to avoid unnecessary re-renders
        if (prev.pageSize !== roundedSize) {
          return { ...prev, pageSize: roundedSize, currentPage: 1 };
        }
        return prev;
      });
    }
  }, [settings.default_pagination_size, settings.story_cards_columns]);

  // Reset search and pagination when category changes
  useEffect(() => {
    // Force re-render when category changes by resetting state
    setSearchQuery('');
    setSearchInput('');
    setSearchResults([]);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    // Clear articles to show loading state
    setArticles([]);
  }, [selectedCategory]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Ensure pageSize is set - use a minimum of columns to ensure at least one row
        const effectivePageSize = pagination.pageSize || (settings.story_cards_columns || 3) * 3;
        
        let articlesResponse;
        if (searchQuery.trim()) {
          // Use search API when there's a search query
          articlesResponse = await articlesAPI.search(searchQuery.trim(), selectedCategory, pagination.currentPage, effectivePageSize);
          setSearchResults(articlesResponse.data.results || articlesResponse.data);
          setArticles([]); // Clear regular articles when searching
        } else {
          // Use regular API when no search query - request 1 extra for featured article
          // So if pageSize is 12, we request 13 (1 featured + 12 in grid)
          // Request exactly pageSize + 1 to ensure we have enough for featured + grid
          const apiPageSize = effectivePageSize + 1;
          articlesResponse = await articlesAPI.getPublished(selectedCategory, pagination.currentPage, apiPageSize);
          let allArticles = articlesResponse.data.results || articlesResponse.data;
          
          // If we didn't get enough articles and we're on page 1, try to get more
          // This handles cases where the API pagination might limit results
          if (allArticles.length < apiPageSize && pagination.currentPage === 1) {
            // Try requesting a larger page size to get more articles
            const largerPageSize = apiPageSize + 3; // Request a few extra to ensure we have enough
            try {
              const additionalResponse = await articlesAPI.getPublished(selectedCategory, 1, largerPageSize);
              const additionalArticles = additionalResponse.data.results || additionalResponse.data;
              if (additionalArticles.length > allArticles.length) {
                allArticles = additionalArticles;
              }
            } catch (err) {
              // If the larger request fails, use what we have
              console.warn('Could not fetch additional articles:', err);
            }
          }
          
          // Log if we didn't get enough articles (for debugging)
          if (allArticles.length < apiPageSize && import.meta.env.DEV) {
            console.warn(`API returned ${allArticles.length} articles, but requested ${apiPageSize} (1 featured + ${effectivePageSize} grid)`);
          }
          setArticles(allArticles);
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
  }, [selectedCategory, pagination.currentPage, pagination.pageSize, searchQuery, settings.story_cards_columns]);

  // Listen for article moved to draft event and refresh
  useEffect(() => {
    const handleArticleMovedToDraft = (event) => {
      // Force refresh by resetting pagination to page 1 and clearing articles
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      setArticles([]);
      setSearchResults([]);
      // The fetchData will be triggered by the dependency change
    };

    window.addEventListener('articleMovedToDraft', handleArticleMovedToDraft);
    
    return () => {
      window.removeEventListener('articleMovedToDraft', handleArticleMovedToDraft);
    };
  }, []);

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
      <Container className="max-w-7xl py-8">
        <Box className="text-center">
          <Spinner size="xl" />
          <Text className="mt-4">Loading articles...</Text>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="max-w-7xl py-8">
        <Alert status="error">
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

      {/* Top Banner Ad - Match content width (max-w-7xl) and increase height to match feature image prominence */}
      <Box className="w-full bg-gray-50 py-6 md:py-8 mb-6 md:mb-8">
        <Container className="max-w-7xl mx-auto px-4 sm:px-6">
          <Suspense fallback={null}>
            <AdComponent placement="top_banner" maxAds={1} />
          </Suspense>
        </Container>
      </Box>

      <ThemeLayout
        featuredArticle={articles.length > 0 ? articles[0] : null}
        articles={articles}
        settings={settings}
      >

        {/* Search Results or Regular Content */}
        {loading ? (
          <Box className="mb-12">
            <VStack spacing={4} align="center">
              <Spinner size="lg" />
              <Text>{searchQuery.trim() ? 'Searching articles...' : 'Loading articles...'}</Text>
            </VStack>
          </Box>
        ) : searchQuery.trim() ? (
          <Box className="mb-12">
            <Flex justify="space-between" align="center" className="mb-6 flex-wrap gap-4">
              <Heading size="lg" className="text-gray-800">
                Search Results for "{searchQuery}"
              </Heading>
              <Badge colorScheme="blue" size="sm" className="px-3 py-1">
                {pagination.totalCount} result{pagination.totalCount !== 1 ? 's' : ''} found
              </Badge>
            </Flex>
            
            {searchResults.length > 0 ? (
              /* Search Results Grid - Dynamic Layout - Standard.mv style */
              <SimpleGrid 
                columns={{ 
                  base: 1, 
                  sm: Math.min(settings.story_cards_columns || 3, 2), 
                  md: settings.story_cards_columns || 3,
                  lg: settings.story_cards_columns || 3
                }} 
                spacing={4}
                className="max-w-[1200px] mx-auto w-full"
              >
                {searchResults.map((article) => (
                  <StoryCard key={article.id} article={article} variant="default" />
                ))}
              </SimpleGrid>
            ) : (
              <Box className="text-center py-8">
                <Text size="lg" className="text-gray-500 mb-4">
                  No articles found matching "{searchQuery}"
                </Text>
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="outline"
                  colorScheme="brand"
                  size="sm"
                >
                  Clear Search
                </Button>
              </Box>
            )}
          </Box>
        ) : (
          <>
            {/* Featured Article Section - Standard.mv style */}
            {articles.length > 0 && (
              <Box className="mb-10">
                <StoryCard article={articles[0]} variant="featured" />
              </Box>
            )}

            {/* Main Articles Grid - Standard.mv style */}
            <Box className="mt-6">
              <Heading size="md" className="mb-6 text-gray-800">
                More News
              </Heading>
              
              {/* Dynamic Grid Layout based on settings - Standard.mv style */}
              <SimpleGrid 
                columns={{ 
                  base: 1, 
                  sm: Math.min(settings.story_cards_columns || 3, 2), 
                  md: settings.story_cards_columns || 3,
                  lg: settings.story_cards_columns || 3
                }} 
                spacing={4}
                className="max-w-[1200px] mx-auto w-full"
              >
                {/* Show articles ensuring each row has equal number of cards */}
                {/* Exclude the featured article (index 0) and round down to nearest multiple of columns */}
                {(() => {
                  if (articles.length <= 1) return null;
                  
                  const columns = settings.story_cards_columns || 3;
                  const availableArticles = articles.slice(1); // Skip featured article
                  
                  // Calculate how many cards to show (round down to nearest multiple of columns)
                  const maxCardsToShow = Math.floor(availableArticles.length / columns) * columns;
                  
                  // Show cards up to the calculated limit (ensures equal rows)
                  return availableArticles.slice(0, maxCardsToShow).map((article) => (
                    <StoryCard key={article.id} article={article} variant="default" />
                  ));
                })()}
              </SimpleGrid>
            </Box>
          </>
        )}

        {/* Clear Search Button */}
        {searchQuery.trim() && (
          <Box className="mb-6 text-center">
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
          <Box className="mb-8">
            <Suspense fallback={null}>
              <NewsletterSubscription variant="inline" showTitle={true} />
            </Suspense>
          </Box>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <Box className="mt-8 p-4 md:p-6 bg-gray-50 rounded-md">
            <VStack spacing={4}>
              {/* Pagination Info - Mobile Friendly */}
              <Text size="sm" className="text-gray-600 text-center">
                Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of{' '}
                {pagination.totalCount} articles
              </Text>
              
              {/* Pagination Buttons - Mobile Optimized */}
              <HStack spacing={2} className="flex-wrap justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pagination.hasPrevious}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  className="min-w-[80px]"
                >
                  Previous
                </Button>
                
                {/* Page Numbers - Responsive */}
                <HStack spacing={1} className="flex-wrap justify-center">
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
                        variant={pageNum === pagination.currentPage ? "primary" : "outline"}
                        colorScheme={pageNum === pagination.currentPage ? "brand" : "gray"}
                        onClick={() => handlePageChange(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </HStack>
                
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pagination.hasNext}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  className="min-w-[80px]"
                >
                  Next
                </Button>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* Sidebar Ad */}
        <Box className="mt-6 md:mt-8 text-center">
          <Suspense fallback={null}>
            <AdComponent placement="sidebar" maxAds={2} />
          </Suspense>
        </Box>

        {/* Sidebar-style compact articles for additional content */}
        {articles.length > 7 && (
          <Box className="mt-12">
            <Heading size="md" className="mb-6 text-gray-700 text-center">
              Recent Stories
            </Heading>
            <SimpleGrid 
              columns={{ base: 1, sm: 2, md: 3 }} 
              spacing={4}
              className="max-w-[1200px] mx-auto"
            >
              {articles.slice(7, 10).map((article) => (
                <StoryCard key={article.id} article={article} variant="compact" />
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Bottom Banner Ad */}
        <Box className="mt-8 md:mt-12 text-center">
          <Suspense fallback={null}>
            <AdComponent placement="bottom_banner" maxAds={1} />
          </Suspense>
        </Box>
      </ThemeLayout>
    </>
  );
};

export default HomePage;
