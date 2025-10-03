import React from 'react';
import {
  Box,
  Image,
  Heading,
  Text,
  Flex,
  Badge,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';

const StoryCard = ({ article, variant = 'default' }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const titleColor = useColorModeValue('gray.800', 'white');
  const hoverShadow = useColorModeValue('lg', 'dark-lg');

  // Format date like Times of Addu
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
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  // Different card variants based on Times of Addu layout
  if (variant === 'featured') {
    return (
      <Card
        as={Link}
        to={`/article/${article.slug}`}
        h="600px"
        w="800px"
        display="flex"
        flexDirection="column"
        overflow="hidden"
        className="news-card featured-article"
        borderRadius="lg"
        shadow="md"
        transition="all 0.3s ease"
        _hover={{
          shadow: hoverShadow,
          transform: 'translateY(-2px)',
        }}
        mb={6}
        mx="auto"
      >
        <CardHeader>
          <Flex justify="space-between" align="start">
            <Box flex="1">
              <Heading size="lg" mb={2} noOfLines={2} className="news-title">
                {article.title}
              </Heading>
              <Badge colorScheme="blue" variant="solid">
                Featured
              </Badge>
            </Box>
          </Flex>
        </CardHeader>
        <CardBody flex="1" display="flex" flexDirection="column">
          {article.image_url && (
            <Image
              src={article.image_url}
              alt={article.title}
              borderRadius="md"
              objectFit="cover"
              h="300px"
              w="100%"
              mb={3}
              className="news-card-image"
              fallbackSrc="https://via.placeholder.com/800x300/cccccc/666666?text=Featured+Article"
              onLoad={() => console.log('Featured article image loaded:', article.image_url)}
              onError={(e) => {
                console.log('Featured article image failed to load:', article.image_url);
                e.target.src = "https://via.placeholder.com/800x300/cccccc/666666?text=Featured+Article";
              }}
            />
          )}
          <Flex align="center" justify="space-between" className="news-meta" fontSize="sm" mt="auto">
            <Text>{formatDate(article.created_at)}</Text>
            <Flex gap={4}>
              <Text className="news-stats">👍 {article.vote_score || 0}</Text>
              <Text className="news-stats">💬 {article.approved_comments_count || 0}</Text>
            </Flex>
          </Flex>
        </CardBody>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Box
        as={Link}
        to={`/article/${article.slug}`}
        display="flex"
        className="news-card compact-article"
        borderRadius="lg"
        overflow="hidden"
        shadow="sm"
        transition="all 0.3s ease"
        _hover={{
          shadow: hoverShadow,
          transform: 'translateY(-1px)',
        }}
        mb={4}
        border="1px solid"
        borderColor={borderColor}
        w="100%"
        maxW="400px"
        h="120px"
        mx="auto"
      >
        <Image
          src={article.image_url}
          alt={article.title}
          w="120px"
          h="100px"
          objectFit="cover"
          flexShrink={0}
          className="news-card-image"
          fallbackSrc="https://via.placeholder.com/120x100/cccccc/666666?text=News"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/120x100/cccccc/666666?text=News";
          }}
        />
        <Box p={4} flex="1" display="flex" flexDirection="column" justifyContent="space-between">
          <Heading
            size="sm"
            className="news-title"
            mb={2}
            lineHeight="1.3"
            noOfLines={2}
            _hover={{ color: 'blue.500' }}
            transition="color 0.2s ease"
          >
            {article.title}
          </Heading>
          <Text fontSize="xs" className="news-meta">
            {formatDate(article.created_at)}
          </Text>
        </Box>
      </Box>
    );
  }

  // Default card variant
  return (
    <Card 
      as={Link}
      to={`/article/${article.slug}`}
      h="500px" 
      w="350px" 
      display="flex" 
      flexDirection="column" 
      overflow="hidden"
      className="news-card"
      borderRadius="lg"
      shadow="sm"
      transition="all 0.3s ease"
      _hover={{
        shadow: hoverShadow,
        transform: 'translateY(-2px)',
      }}
      mb={6}
      border="1px solid"
      borderColor={borderColor}
    >
      <CardHeader>
        <Heading size="sm" mb={2} noOfLines={2} className="news-title">
          {article.title}
        </Heading>
        <Text fontSize="sm" color="gray.600">
          {formatDate(article.created_at)}
        </Text>
      </CardHeader>
      <CardBody flex="1" display="flex" flexDirection="column">
        {article.image_url && (
          <Image
            src={article.image_url}
            alt={article.title}
            borderRadius="md"
            objectFit="cover"
            h="200px"
            w="100%"
            mb={3}
            className="news-card-image"
            fallbackSrc="https://via.placeholder.com/350x200/cccccc/666666?text=Article+Image"
            onLoad={() => console.log('Article image loaded:', article.image_url)}
            onError={(e) => {
              console.log('Article image failed to load:', article.image_url);
              e.target.src = "https://via.placeholder.com/350x200/cccccc/666666?text=Article+Image";
            }}
          />
        )}
        <Flex align="center" justify="space-between" className="news-meta" fontSize="sm" mt="auto">
          <Text fontWeight="medium">Read More</Text>
          <Flex gap={3}>
            <Text className="news-stats">👍 {article.vote_score || 0}</Text>
            <Text className="news-stats">💬 {article.approved_comments_count || 0}</Text>
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default StoryCard;
