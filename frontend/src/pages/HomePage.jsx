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
} from '@chakra-ui/react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { articlesAPI, adsAPI } from '../services/api';
import StoryCard from '../components/StoryCard';

const HomePage = () => {
  const [articles, setArticles] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articlesResponse, adsResponse] = await Promise.all([
          articlesAPI.getPublished(),
          adsAPI.getActive(),
        ]);
        console.log('Articles response:', articlesResponse.data);
        console.log('Ads response:', adsResponse.data);
        setArticles(articlesResponse.data.results || articlesResponse.data);
        setAds(adsResponse.data.results || adsResponse.data);
      } catch (err) {
        setError('Failed to load articles');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderAd = (ad, index) => (
    <Card key={ad.id} className="ad-container" h="450px" w="300px" mx="auto" display="flex" flexDirection="column" overflow="hidden">
        <CardHeader>
          <Heading size="sm" mb={2} noOfLines={2}>{ad.title}</Heading>
        </CardHeader>
        <CardBody flex="1" display="flex" flexDirection="column">
          <ChakraImage
            src={ad.image_url}
            alt={ad.title}
            borderRadius="md"
            objectFit="cover"
            h="200px"
            w="100%"
            mb={3}
            onClick={ad.destination_url ? () => window.open(ad.destination_url, '_blank') : undefined}
            cursor={ad.destination_url ? "pointer" : "default"}
            fallbackSrc="https://via.placeholder.com/300x200/cccccc/666666?text=Ad+Image"
            onLoad={() => console.log('Ad image loaded:', ad.image_url)}
            onError={(e) => {
              console.log('Ad image failed to load:', ad.image_url);
              e.target.src = "https://via.placeholder.com/300x200/cccccc/666666?text=Ad+Image";
            }}
          />
          {ad.destination_url && (
            <Text fontSize="sm" color="gray.600" mt="auto">
              Click to visit: {ad.destination_url}
            </Text>
          )}
        </CardBody>
    </Card>
  );

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
        <title>Dhivehinoos.net - Maldivian News</title>
        <meta name="description" content="Latest news and articles from the Maldives" />
        <meta property="og:title" content="Dhivehinoos.net - Maldivian News" />
        <meta property="og:description" content="Latest news and articles from the Maldives" />
        <meta property="og:type" content="website" />
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
        {ads.length > 0 && (
          <Box mb={8} textAlign="center">
            {renderAd(ads[0], 0)}
          </Box>
        )}

        {/* Featured Article Section */}
        {articles.length > 0 && (
          <Box mb={12}>
            <Heading size="lg" mb={6} color="gray.800" textAlign="center">
              Latest News
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
              <React.Fragment key={article.id}>
                <StoryCard article={article} variant="default" />
                {/* Show ad after every 4th article */}
                {index > 0 && (index + 1) % 4 === 0 && ads.length > 1 && (
                  <Box w="100%" maxW="400px">
                    {renderAd(ads[1] || ads[0], index)}
                  </Box>
                )}
              </React.Fragment>
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
