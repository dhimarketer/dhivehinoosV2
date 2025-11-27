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
import CategoryTag from '../components/CategoryTag';
import SidebarWidgets from '../components/SidebarWidgets';
import FormattedText from '../components/FormattedText';
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
        
        // Preload images for better LCP (only if not searching and on first page)
        if (!searchQuery.trim() && pagination.currentPage === 1) {
          const articlesToPreload = articlesResponse.data.results || articlesResponse.data;
          preloadImages(articlesToPreload);
        }
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

  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        timeZone: 'Indian/Maldives',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  // Preload images to improve LCP - only preload if image will be rendered immediately
  const preloadImages = (articles) => {
    // Only preload the first featured image if it's actually going to be rendered
    // Skip preloading if we're in search mode or if there are no articles
    if (searchQuery.trim() || !articles || articles.length === 0) {
      return;
    }

    const firstArticle = articles[0];
    if (!firstArticle?.image_url || !firstArticle.image_url.includes('fal.media')) {
      return;
    }

    // Use the exact same URL that will be used in the hero section
    // Match the size used in the hero section (600x500)
    const optimizedUrl = getOptimizedImageUrlBySize(firstArticle.image_url, 600, 500);
    
    // Check if already preloaded to avoid duplicates
    const existingPreload = document.querySelector(`link[rel="preload"][as="image"][href="${optimizedUrl}"]`);
    if (existingPreload) {
      return;
    }

    // Only preload if we're on the first page and not searching
    if (pagination.currentPage !== 1) {
      return;
    }

    // Create preload link
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = optimizedUrl;
    link.fetchPriority = 'high';
    
    // Add crossorigin for CORS-enabled images
    if (optimizedUrl.includes('fal.media')) {
      link.crossOrigin = 'anonymous';
    }
    
    // Set a timeout to remove preload if image doesn't load quickly
    const timeoutId = setTimeout(() => {
      const preloadLink = document.querySelector(`link[rel="preload"][as="image"][href="${optimizedUrl}"]`);
      if (preloadLink) {
        preloadLink.remove();
      }
    }, 3000); // Remove after 3 seconds if not used

    document.head.appendChild(link);

    // Remove preload link once the actual image element loads
    // This prevents the warning about unused preload
    const checkImageLoad = () => {
      const imgElements = document.querySelectorAll(`img[src*="${optimizedUrl}"], img[srcset*="${optimizedUrl}"]`);
      if (imgElements.length > 0) {
        clearTimeout(timeoutId);
        // Wait for the image to actually load
        imgElements.forEach(img => {
          if (img.complete) {
            const preloadLink = document.querySelector(`link[rel="preload"][as="image"][href="${optimizedUrl}"]`);
            if (preloadLink) {
              preloadLink.remove();
            }
          } else {
            img.addEventListener('load', () => {
              const preloadLink = document.querySelector(`link[rel="preload"][as="image"][href="${optimizedUrl}"]`);
              if (preloadLink) {
                preloadLink.remove();
              }
            }, { once: true });
          }
        });
      }
    };

    // Check immediately and also after a short delay
    checkImageLoad();
    setTimeout(checkImageLoad, 100);
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

      {/* Newspaper Layout Container */}
      <Container className="max-w-newspaper mx-auto px-4 sm:px-6">
        {/* Ticker/Marquee - Breaking News */}
        {!searchQuery.trim() && articles.length > 0 && (
          <Box className="w-full bg-black text-white py-2 mb-4 overflow-hidden" style={{ borderRadius: 0 }}>
            <div className="flex whitespace-nowrap">
              <div className="flex animate-marquee">
                <span className="font-bold mr-4 text-sm font-sans">BREAKING NEWS:</span>
                {articles.slice(0, 5).map((article, index) => (
                  <React.Fragment key={article.id}>
                    <Link 
                      to={`/article/${article.slug}`}
                      className="text-white hover:text-[#00AEC7] transition-colors text-sm font-sans mr-8"
                    >
                      {article.title}
                    </Link>
                    {index < 4 && <span className="mr-8">•</span>}
                  </React.Fragment>
                ))}
                {/* Duplicate for seamless loop */}
                <span className="font-bold mr-4 text-sm font-sans">BREAKING NEWS:</span>
                {articles.slice(0, 5).map((article, index) => (
                  <React.Fragment key={`dup-${article.id}`}>
                    <Link 
                      to={`/article/${article.slug}`}
                      className="text-white hover:text-[#00AEC7] transition-colors text-sm font-sans mr-8"
                    >
                      {article.title}
                    </Link>
                    {index < 4 && <span className="mr-8">•</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </Box>
        )}

        {/* Main Table Layout: Main Content (66.67%) + Sidebar (33.33%) */}
        <table className="newspaper-layout-table w-full border-collapse">
          <tbody>
            <tr>
              {/* Main Content Area - Left Column */}
              <td className="align-top" style={{ width: '66.67%', paddingRight: '24px', verticalAlign: 'top' }}>
                <Box>

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
                <Heading 
                  size="lg" 
                  className="mb-6 font-serif font-bold text-black"
                  style={{ 
                    borderTop: '4px solid #000000',
                    borderLeft: '8px solid #000000',
                    paddingLeft: '12px',
                    paddingTop: '8px'
                  }}
                >
                  Search Results for "{searchQuery}"
                </Heading>
                <Badge colorScheme="blue" size="sm" className="px-3 py-1 mb-4">
                  {pagination.totalCount} result{pagination.totalCount !== 1 ? 's' : ''} found
                </Badge>
                
                {searchResults.length > 0 ? (
                  <SimpleGrid 
                    columns={{ base: 1, sm: 2, md: 3 }} 
                    spacing={4}
                    className="w-full"
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
                      style={{ borderRadius: 0 }}
                    >
                      Clear Search
                    </Button>
                  </Box>
                )}
              </Box>
            ) : (
              <>
                {/* Hero Section - CSS Grid Layout (2 columns, dynamic heights) */}
                {articles.length > 0 && (
                  <Box 
                    className="mb-8 hero-grid-container"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                      width: '100%',
                      backgroundColor: '#FFFFFF',
                      alignItems: 'stretch'
                    }}
                  >
                    {/* Left Item - Feature Article (spans full height) */}
                    <Box
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignSelf: 'stretch',
                        backgroundColor: 'transparent'
                      }}
                    >
                      {articles[0] && (
                        <Link 
                          to={`/article/${articles[0].slug}`}
                          className="block relative"
                          style={{ 
                            textDecoration: 'none', 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'transparent'
                          }}
                        >
                          {articles[0].image_url && (
                            <Box 
                              className="relative w-full" 
                              style={{ 
                                flex: '1 1 auto',
                                minHeight: '500px',
                                backgroundColor: 'transparent',
                                background: 'none',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              <img
                                src={getOptimizedImageUrlBySize(articles[0].image_url, 600, 500)}
                                alt={articles[0].title}
                                className="w-full h-full object-cover"
                                style={{ 
                                  borderRadius: 0, 
                                  display: 'block', 
                                  backgroundColor: 'transparent',
                                  background: 'none',
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0
                                }}
                                loading="eager"
                                fetchPriority="high"
                                decoding="async"
                                onError={(e) => {
                                  // Hide the image
                                  e.target.style.display = 'none';
                                  // Hide the entire container to prevent grey/black box from showing
                                  const container = e.target.parentElement;
                                  if (container) {
                                    container.style.display = 'none';
                                  }
                                }}
                              />
                              {/* Gradient overlay */}
                              <Box 
                                className="absolute bottom-0 left-0 right-0 p-6"
                                style={{ 
                                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                                  paddingTop: '60%',
                                  pointerEvents: 'none'
                                }}
                              >
                                <CategoryTag category={articles[0].category} />
                                <Heading 
                                  size="lg" 
                                  className="text-white font-serif font-bold mb-2"
                                  style={{ 
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {articles[0].title}
                                </Heading>
                                <Text className="text-white text-sm font-sans">
                                  {formatDate(articles[0].created_at)}
                                </Text>
                              </Box>
                            </Box>
                          )}
                        </Link>
                      )}
                    </Box>

                    {/* Right Column - Two smaller articles stacked */}
                    <Box
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        alignSelf: 'stretch',
                        backgroundColor: 'transparent'
                      }}
                    >
                      {/* Right Top Item - First smaller article */}
                      {articles.length > 1 && (
                        <Box style={{ flex: '0 0 auto', backgroundColor: 'transparent' }}>
                          <Link
                            to={`/article/${articles[1].slug}`}
                            style={{ textDecoration: 'none', display: 'block' }}
                          >
                            <Box className="bg-white border border-gray-200" style={{ borderRadius: 0 }}>
                              {articles[1].image_url && (
                                <Box className="relative w-full" style={{ aspectRatio: '16/9', backgroundColor: 'transparent' }}>
                                  <img
                                    src={getOptimizedImageUrlBySize(articles[1].image_url, 300, 169)}
                                    alt={articles[1].title}
                                    className="w-full h-full object-cover"
                                    style={{ borderRadius: 0, display: 'block', backgroundColor: 'transparent' }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      const container = e.target.parentElement;
                                      if (container) {
                                        container.style.backgroundColor = '#f3f4f6';
                                      }
                                    }}
                                  />
                                  <CategoryTag category={articles[1].category} />
                                </Box>
                              )}
                              <Box className="p-4">
                                <Heading 
                                  size="sm" 
                                  className="font-serif font-bold text-black mb-2"
                                  style={{ 
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {articles[1].title}
                                </Heading>
                                <Text className="text-gray-600 text-xs font-sans">
                                  {formatDate(articles[1].created_at)}
                                </Text>
                              </Box>
                            </Box>
                          </Link>
                        </Box>
                      )}

                      {/* Right Bottom Item - Second smaller article */}
                      {articles.length > 2 && (
                        <Box style={{ flex: '0 0 auto', backgroundColor: 'transparent' }}>
                          <Link
                            to={`/article/${articles[2].slug}`}
                            style={{ textDecoration: 'none', display: 'block' }}
                          >
                            <Box className="bg-white border border-gray-200" style={{ borderRadius: 0 }}>
                              {articles[2].image_url && (
                                <Box className="relative w-full" style={{ aspectRatio: '16/9', backgroundColor: 'transparent' }}>
                                  <img
                                    src={getOptimizedImageUrlBySize(articles[2].image_url, 300, 169)}
                                    alt={articles[2].title}
                                    className="w-full h-full object-cover"
                                    style={{ borderRadius: 0, display: 'block', backgroundColor: 'transparent' }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      const container = e.target.parentElement;
                                      if (container) {
                                        container.style.backgroundColor = '#f3f4f6';
                                      }
                                    }}
                                  />
                                  <CategoryTag category={articles[2].category} />
                                </Box>
                              )}
                              <Box className="p-4">
                                <Heading 
                                  size="sm" 
                                  className="font-serif font-bold text-black mb-2"
                                  style={{ 
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {articles[2].title}
                                </Heading>
                                <Text className="text-gray-600 text-xs font-sans">
                                  {formatDate(articles[2].created_at)}
                                </Text>
                              </Box>
                            </Box>
                          </Link>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Ad Banner - Full width */}
                <Box 
                  className="mb-8 bg-[#F3F4F6] py-6" 
                  style={{ 
                    borderRadius: 0, 
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    clear: 'both',
                    overflow: 'visible'
                  }}
                >
                  <Suspense fallback={null}>
                    <AdComponent placement="top_banner" maxAds={1} />
                  </Suspense>
                </Box>

                {/* Recommended Section - 4-column table */}
                {articles.length > 3 && (
                  <Box 
                    className="mb-8"
                    style={{ 
                      position: 'relative',
                      zIndex: 1,
                      clear: 'both',
                      marginTop: '2rem'
                    }}
                  >
                    <Heading 
                      size="md" 
                      className="mb-6 font-serif font-bold text-black"
                      style={{ 
                        borderTop: '4px solid #000000',
                        borderLeft: '8px solid #000000',
                        paddingLeft: '12px',
                        paddingTop: '8px'
                      }}
                    >
                      Recommended For You
                    </Heading>
                    <table className="newspaper-layout-table w-full border-collapse">
                      <tbody>
                        <tr>
                          {articles.slice(3, 7).map((article) => (
                            <td key={article.id} className="align-top" style={{ width: '25%', padding: '0 8px', verticalAlign: 'top' }}>
                              <Link
                                to={`/article/${article.slug}`}
                                style={{ textDecoration: 'none', display: 'block' }}
                              >
                                <Box className="bg-white border border-gray-200" style={{ borderRadius: 0 }}>
                                  {article.image_url && (
                                    <Box className="relative w-full" style={{ aspectRatio: '16/9', backgroundColor: 'transparent' }}>
                                      <img
                                        src={getOptimizedImageUrlBySize(article.image_url, 250, 141)}
                                        alt={article.title}
                                        className="w-full h-full object-cover"
                                        style={{ borderRadius: 0, display: 'block', backgroundColor: 'transparent' }}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          const container = e.target.parentElement;
                                          if (container) {
                                            container.style.backgroundColor = '#f3f4f6';
                                          }
                                        }}
                                      />
                                      <CategoryTag category={article.category} />
                                    </Box>
                                  )}
                                  <Box className="p-3">
                                    <Heading 
                                      size="xs" 
                                      className="font-serif font-bold text-black text-sm mb-1"
                                      style={{ 
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                      }}
                                    >
                                      {article.title}
                                    </Heading>
                                    <Text className="text-gray-600 text-[10px] font-sans">
                                      {formatDate(article.created_at)}
                                    </Text>
                                  </Box>
                                </Box>
                              </Link>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </Box>
                )}

                {/* Main Feed - Table layout (Image Left, Text Right) */}
                {articles.length > 7 && (
                  <Box className="mb-8">
                    <Heading 
                      size="md" 
                      className="mb-6 font-serif font-bold text-black"
                      style={{ 
                        borderTop: '4px solid #000000',
                        borderLeft: '8px solid #000000',
                        paddingLeft: '12px',
                        paddingTop: '8px'
                      }}
                    >
                      Latest News
                    </Heading>
                    <table className="newspaper-layout-table w-full border-collapse">
                      <tbody>
                        {articles.slice(7).map((article, index) => (
                          <React.Fragment key={article.id}>
                            <tr 
                              className="hover:bg-gray-50 transition-colors"
                              style={{ borderTop: index > 0 ? '1px solid #000000' : 'none' }}
                            >
                              {/* Image Column */}
                              {article.image_url && (
                                <td className="align-top" style={{ width: '128px', padding: '16px 16px 16px 0', verticalAlign: 'top' }}>
                                  <Box className="relative" style={{ width: '128px', height: '96px', borderRadius: 0, backgroundColor: 'transparent' }}>
                                    <img
                                      src={getOptimizedImageUrlBySize(article.image_url, 128, 96)}
                                      alt={article.title}
                                      className="w-full h-full object-cover"
                                      style={{ borderRadius: 0, display: 'block', backgroundColor: 'transparent' }}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        const container = e.target.parentElement;
                                        if (container) {
                                          container.style.display = 'none';
                                        }
                                      }}
                                    />
                                    <CategoryTag category={article.category} />
                                  </Box>
                                </td>
                              )}
                              {/* Text Column */}
                              <td className="align-top" style={{ padding: '16px 0', verticalAlign: 'top' }}>
                                <Link
                                  to={`/article/${article.slug}`}
                                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                >
                                  <Heading 
                                    size="sm" 
                                    className="font-serif font-bold text-black mb-2"
                                    style={{ 
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    {article.title}
                                  </Heading>
                                  {article.content && (
                                    <Text className="text-gray-600 text-sm font-sans mb-2"
                                      style={{ 
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                      }}
                                    >
                                      <FormattedText 
                                        content={article.content} 
                                        preview={true} 
                                        maxLength={100}
                                      />
                                    </Text>
                                  )}
                                  <Text className="text-gray-500 text-xs font-sans">
                                    {formatDate(article.created_at)}
                                  </Text>
                                </Link>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                )}
              </>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <Box className="mt-8 p-4 md:p-6 bg-[#F3F4F6]" style={{ borderRadius: 0 }}>
                <VStack spacing={4}>
                  <Text size="sm" className="text-gray-600 text-center font-sans">
                    Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of{' '}
                    {pagination.totalCount} articles
                  </Text>
                  
                  <HStack spacing={2} className="flex-wrap justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!pagination.hasPrevious}
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      className="min-w-[80px]"
                      style={{ borderRadius: 0 }}
                    >
                      Previous
                    </Button>
                    
                    <HStack spacing={1} className="flex-wrap justify-center">
                      {(() => {
                        const totalPages = pagination.totalPages;
                        const currentPage = pagination.currentPage;
                        const pages = [];
                        const maxVisiblePages = 10; // Show up to 10 page numbers
                        
                        if (totalPages <= maxVisiblePages) {
                          // Show all pages if total is less than max
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Always show first page
                          pages.push(1);
                          
                          // Calculate start and end of visible range
                          let startPage = Math.max(2, currentPage - 2);
                          let endPage = Math.min(totalPages - 1, currentPage + 2);
                          
                          // Adjust if we're near the beginning
                          if (currentPage <= 4) {
                            endPage = Math.min(totalPages - 1, 6);
                          }
                          
                          // Adjust if we're near the end
                          if (currentPage >= totalPages - 3) {
                            startPage = Math.max(2, totalPages - 5);
                          }
                          
                          // Add ellipsis after first page if needed
                          if (startPage > 2) {
                            pages.push('ellipsis-start');
                          }
                          
                          // Add pages in the visible range
                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(i);
                          }
                          
                          // Add ellipsis before last page if needed
                          if (endPage < totalPages - 1) {
                            pages.push('ellipsis-end');
                          }
                          
                          // Always show last page
                          pages.push(totalPages);
                        }
                        
                        return pages.map((page, index) => {
                          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                            return (
                              <Text
                                key={`ellipsis-${index}`}
                                className="px-2 text-gray-500"
                                style={{ userSelect: 'none' }}
                              >
                                ...
                              </Text>
                            );
                          }
                          
                          return (
                            <Button
                              key={page}
                              size="sm"
                              variant={page === currentPage ? "solid" : "outline"}
                              colorScheme={page === currentPage ? "brand" : "gray"}
                              onClick={() => handlePageChange(page)}
                              className="min-w-[40px]"
                              style={{ borderRadius: 0 }}
                            >
                              {page}
                            </Button>
                          );
                        });
                      })()}
                    </HStack>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!pagination.hasNext}
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      className="min-w-[80px]"
                      style={{ borderRadius: 0 }}
                    >
                      Next
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            )}
          </Box>
            </td>

            {/* Sidebar - Right Column */}
            <td className="align-top" style={{ width: '33.33%', verticalAlign: 'top' }}>
              <Box>
                <SidebarWidgets articles={articles} />
                
                {/* Sidebar Ad */}
                <Box className="mt-6 text-center">
                  <Suspense fallback={null}>
                    <AdComponent placement="sidebar" maxAds={2} />
                  </Suspense>
                </Box>
              </Box>
            </td>
          </tr>
        </tbody>
      </table>

        {/* Bottom Banner Ad */}
        <Box className="mt-8 md:mt-12 text-center bg-[#F3F4F6] py-6" style={{ borderRadius: 0 }}>
          <Suspense fallback={null}>
            <AdComponent placement="bottom_banner" maxAds={1} />
          </Suspense>
        </Box>
      </Container>
    </>
  );
};

export default HomePage;
