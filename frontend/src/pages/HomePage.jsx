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

const HomePage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const articlesResponse = await articlesAPI.getPublished(selectedCategory);
        console.log('Articles response:', articlesResponse.data);
        setArticles(articlesResponse.data.results || articlesResponse.data);
        
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
  }, [selectedCategory]);

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
      </Container>
    </>
  );
};

export default HomePage;
