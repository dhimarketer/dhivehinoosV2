import React, { useState } from 'react';
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
  Skeleton,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import FormattedText from './FormattedText';
import SocialShare from './SocialShare';

const StoryCard = ({ article, variant = 'default' }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Enhanced image error handling
  const handleImageError = (e) => {
    setImageLoading(false);
    setImageError(true);
    console.log('Image failed to load:', article.image_url);
    
    // Use a more reliable fallback image
    const fallbackImages = {
      featured: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=300&fit=crop&crop=center",
      default: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=350&h=200&fit=crop&crop=center",
      compact: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=120&h=100&fit=crop&crop=center"
    };
    
    e.target.src = fallbackImages[variant] || fallbackImages.default;
  };
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const titleColor = useColorModeValue('gray.800', 'white');
  const hoverShadow = useColorModeValue('lg', 'dark-lg');

  // Format date like Times of Addu with consistent timezone handling
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
      // Always use Maldives timezone for consistent display
      return date.toLocaleDateString('en-US', { 
        timeZone: 'Indian/Maldives',
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
        h={{ base: "auto", md: "600px" }}
        w={{ base: "100%", md: "800px" }}
        maxW="100%"
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
              <Flex gap={2} mb={2}>
                <Badge colorScheme="blue" variant="solid">
                  Featured
                </Badge>
                {article.category && (
                  <Badge 
                    colorScheme="gray" 
                    variant="subtle"
                    bg={`${article.category.color}20`}
                    color={article.category.color}
                    borderColor={article.category.color}
                  >
                    {article.category.icon} {article.category.name}
                  </Badge>
                )}
              </Flex>
            </Box>
          </Flex>
        </CardHeader>
        <CardBody flex="1" display="flex" flexDirection="column">
          {article.image_url && (
            <Box position="relative" mb={3} w="100%" borderRadius="md" overflow="hidden">
              {/* Maintain 16:9 aspect ratio for featured images */}
              <Box paddingTop={{ base: "56.25%", md: "37.5%" }} />
              {imageLoading && (
                <Skeleton
                  position="absolute"
                  inset={0}
                  borderRadius="md"
                  zIndex={1}
                />
              )}
              <Image
                src={article.image_url}
                alt={article.title}
                position="absolute"
                inset={0}
                w="100%"
                h="100%"
                objectFit="cover"
                objectPosition="center"
                className="news-card-image"
                fallbackSrc="https://via.placeholder.com/800x450/cccccc/666666?text=Featured+Article"
                onLoad={() => {
                  setImageLoading(false);
                  console.log('Featured article image loaded:', article.image_url);
                }}
                onError={handleImageError}
                style={{ 
                  opacity: imageLoading ? 0 : 1,
                  transition: 'opacity 0.3s ease-in-out'
                }}
              />
            </Box>
          )}
          {/* Content Preview */}
          {article.content && (
            <FormattedText 
              content={article.content} 
              preview={true} 
              maxLength={150}
              fontSize="md"
              color="gray.600"
              mb={3}
              noOfLines={4}
              lineHeight="1.5"
            />
          )}
          <Flex align="center" justify="space-between" className="news-meta" fontSize="sm" mt="auto">
            <Text>{formatDate(article.created_at)}</Text>
            <Flex gap={4} align="center">
              <Text className="news-stats">👍 {article.vote_score || 0}</Text>
              <Text className="news-stats">💬 {article.approved_comments_count || 0}</Text>
              <SocialShare article={article} variant="minimal" />
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
        bg={cardBg}
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
          onError={handleImageError}
        />
        <Box 
          p={3} 
          flex="1" 
          display="flex" 
          flexDirection="column" 
          justifyContent="space-between"
          minW="0"
          overflow="hidden"
        >
          <Heading
            size="sm"
            className="news-title"
            mb={1}
            lineHeight="1.3"
            noOfLines={2}
            color={titleColor}
            fontSize={{ base: "sm", md: "md" }}
            _hover={{ color: 'blue.500' }}
            transition="color 0.2s ease"
          >
            {article.title}
          </Heading>
          {article.content && (
            <Text 
              fontSize="xs" 
              color={textColor}
              mb={1}
              noOfLines={2}
              lineHeight="1.3"
            >
              <FormattedText 
                content={article.content} 
                preview={true} 
                maxLength={60}
              />
            </Text>
          )}
          <Text 
            fontSize="xs" 
            className="news-meta" 
            color={textColor}
            fontWeight="medium"
          >
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
      h={{ base: "auto", md: "500px" }} 
      w={{ base: "100%", md: "350px" }}
      maxW="100%"
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
        <Flex gap={2} mb={2}>
          {article.category && (
            <Badge 
              colorScheme="gray" 
              variant="subtle"
              bg={`${article.category.color}20`}
              color={article.category.color}
              borderColor={article.category.color}
              size="sm"
            >
              {article.category.icon} {article.category.name}
            </Badge>
          )}
        </Flex>
        <Text fontSize="sm" color="gray.600">
          {formatDate(article.created_at)}
        </Text>
      </CardHeader>
      <CardBody flex="1" display="flex" flexDirection="column">
        {article.image_url && (
          <Box position="relative" mb={3} w="100%" borderRadius="md" overflow="hidden">
            {/* Maintain 16:9 aspect ratio for standard cards */}
            <Box paddingTop={{ base: "57%", md: "57%" }} />
            {imageLoading && (
              <Skeleton
                position="absolute"
                inset={0}
                borderRadius="md"
                zIndex={1}
              />
            )}
            <Image
              src={article.image_url}
              alt={article.title}
              position="absolute"
              inset={0}
              w="100%"
              h="100%"
              objectFit="cover"
              objectPosition="center"
              className="news-card-image"
              fallbackSrc="https://via.placeholder.com/350x200/cccccc/666666?text=Article+Image"
              onLoad={() => {
                setImageLoading(false);
                console.log('Article image loaded:', article.image_url);
              }}
              onError={handleImageError}
              style={{ 
                opacity: imageLoading ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out'
              }}
            />
          </Box>
        )}
        {/* Content Preview */}
        {article.content && (
          <FormattedText 
            content={article.content} 
            preview={true} 
            maxLength={120}
            fontSize="sm"
            color="gray.600"
            mb={3}
            noOfLines={3}
            lineHeight="1.4"
          />
        )}
        <Flex align="center" justify="space-between" className="news-meta" fontSize="sm" mt="auto">
          <Text fontWeight="medium">Read More</Text>
          <Flex gap={3} align="center">
            <Text className="news-stats">👍 {article.vote_score || 0}</Text>
            <Text className="news-stats">💬 {article.approved_comments_count || 0}</Text>
            <SocialShare article={article} variant="minimal" />
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default StoryCard;
