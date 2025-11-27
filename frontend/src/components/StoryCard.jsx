import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  HStack,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Skeleton,
} from './ui';
import { Link } from 'react-router-dom';
import FormattedText from './FormattedText';
import ArticleVoteButtons from './ArticleVoteButtons';
import { generateSrcSet, generateSizes, getOptimizedImageUrlBySize } from '../utils/imageOptimization';

const StoryCard = ({ article, variant = 'default' }) => {
  const [imageLoading, setImageLoading] = useState(true);
  
  // Helper function to check if image_url is valid
  const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return trimmed !== '' && trimmed !== 'null' && trimmed !== 'undefined' && 
           (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/'));
  };
  
  // Get the best available image URL - fallback to reuse_images if image_url is invalid
  const getImageUrl = () => {
    // First try the main image_url
    if (isValidImageUrl(article.image_url)) {
      return article.image_url;
    }
    
    // Fallback to first reuse image if available (check all reuse_images)
    if (article.reuse_images && Array.isArray(article.reuse_images) && article.reuse_images.length > 0) {
      // Try each reuse image until we find a valid one
      for (const reuseImage of article.reuse_images) {
        if (reuseImage && reuseImage.image_url && isValidImageUrl(reuseImage.image_url)) {
          return reuseImage.image_url;
        }
      }
    }
    
    // Fallback to reused_image_url if available
    if (isValidImageUrl(article.reused_image_url)) {
      return article.reused_image_url;
    }
    
    // Last resort: try original_image_url if available
    if (isValidImageUrl(article.original_image_url)) {
      return article.original_image_url;
    }
    
    return null;
  };
  
  const displayImageUrl = getImageUrl();
  
  // Debug logging in development
  if (import.meta.env.DEV && !displayImageUrl && (article.reuse_images?.length > 0 || article.reused_image_url)) {
    console.warn('StoryCard: No valid image URL found for article:', {
      id: article.id,
      title: article.title,
      image_url: article.image_url,
      reuse_images_count: article.reuse_images?.length || 0,
      reused_image_url: article.reused_image_url,
      original_image_url: article.original_image_url,
    });
  }
  
  // Enhanced image error handling
  const handleImageError = (e) => {
    setImageLoading(false);
    // Hide the image container if image fails to load to prevent blank spaces
    const target = e.target;
    const container = target.closest('.relative');
    if (container && !target.dataset.retry) {
      // Try to reload the original image once
      target.dataset.retry = 'true';
      const originalSrc = target.getAttribute('data-original-src') || displayImageUrl;
      if (originalSrc && originalSrc !== target.src && originalSrc.trim() !== '') {
        setTimeout(() => {
          target.src = originalSrc;
        }, 1000);
      } else {
        // If no valid original source, hide the container to prevent blank space
        if (container) {
          container.style.display = 'none';
        }
      }
    }
  };
  
  const cardBg = 'white';
  const borderColor = 'gray.200';
  const textColor = 'gray.600';
  const titleColor = 'gray.800';

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
        className="news-card featured-article h-auto w-full max-w-4xl flex flex-col mb-8 mx-auto"
        style={{ borderRadius: 0 }}
      >
        <CardHeader className="pb-3">
          <Box className="flex-1">
            <Heading size="lg" className="mb-3 news-title">
              {article.title}
            </Heading>
            <Flex gap={2} className="mb-2 items-center">
              {article.category && (
                <Badge 
                  colorScheme="gray" 
                  variant="subtle"
                  size="sm"
                  className="text-xs"
                >
                  {article.category.icon} {article.category.name}
                </Badge>
              )}
              <Text size="sm" className="text-gray-500 text-xs">
                {formatDate(article.created_at)}
              </Text>
            </Flex>
          </Box>
        </CardHeader>
        <CardBody className="flex-1 flex flex-col pt-0">
          {displayImageUrl && (
            <Box 
              className="relative mb-4 w-full overflow-hidden"
              style={{ 
                aspectRatio: '16/9',
                maxHeight: variant === 'featured' ? '500px' : 'none',
                borderRadius: 0
              }}
            >
              {imageLoading && (
                <Skeleton
                  className="absolute inset-0 z-10"
                  style={{ borderRadius: 0 }}
                />
              )}
              <img
                src={displayImageUrl.includes('fal.media') 
                  ? getOptimizedImageUrlBySize(displayImageUrl, 800, 450)
                  : displayImageUrl}
                data-original-src={displayImageUrl}
                srcSet={displayImageUrl.includes('fal.media') ? generateSrcSet(displayImageUrl, { aspectRatio: 16/9, breakpoints: [400, 600, 800, 1200] }) : undefined}
                sizes={displayImageUrl.includes('fal.media') ? generateSizes({ featured: true }) : undefined}
                alt={article.title}
                className="w-full h-full object-cover object-center news-card-image"
                loading={variant === 'featured' ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={variant === 'featured' ? 'high' : 'auto'}
                width="1200"
                height="675"
                onLoad={() => {
                  setImageLoading(false);
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
              className="text-base text-gray-600 mb-3 line-clamp-4 leading-normal"
            />
          )}
          <Flex align="center" justify="space-between" className="news-meta text-xs mt-auto pt-3 border-t border-gray-100">
            <Flex gap={3} align="center">
              <ArticleVoteButtons article={article} compact={true} />
              <Text className="news-stats">💬 {article.approved_comments_count || 0}</Text>
            </Flex>
          </Flex>
        </CardBody>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        to={`/article/${article.slug}`}
        className="news-card compact-article flex overflow-hidden mb-4 border border-gray-200 bg-white w-full max-w-[400px] h-[120px] mx-auto hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer no-underline"
        style={{ textDecoration: 'none', display: 'block', color: 'inherit', borderRadius: 0 }}
      >
        {displayImageUrl && (
          <img
            src={getOptimizedImageUrlBySize(displayImageUrl, 120, 100)}
            srcSet={generateSrcSet(displayImageUrl, { aspectRatio: 1.2, breakpoints: [120] })}
            sizes={generateSizes({ compact: true })}
            alt={article.title}
            className="w-[120px] h-[100px] object-cover flex-shrink-0 news-card-image pointer-events-none"
            width="120"
            height="100"
            loading="lazy"
            decoding="async"
            onError={handleImageError}
          />
        )}
        <Box 
          className="p-3 flex-1 flex flex-col justify-between min-w-0 overflow-hidden pointer-events-none"
        >
          <Heading
            size="sm"
            className="news-title mb-1 leading-tight line-clamp-2 text-gray-800 text-sm md:text-base hover:text-blue-500 transition-colors"
          >
            {article.title}
          </Heading>
          {article.content && (
            <Text 
              size="xs"
              className="text-gray-600 mb-1 line-clamp-2 leading-tight"
            >
              <FormattedText 
                content={article.content} 
                preview={true} 
                maxLength={60}
              />
            </Text>
          )}
          <Text 
            size="xs"
            className="news-meta text-gray-600 font-medium"
          >
            {formatDate(article.created_at)}
          </Text>
        </Box>
      </Link>
    );
  }

  // Default card variant - Standard.mv style
  return (
    <Card 
      as={Link}
      to={`/article/${article.slug}`}
      className="news-card h-auto w-full flex flex-col"
      style={{ minWidth: 0, borderRadius: 0 }}
    >
      <CardHeader className="pb-2">
        <Heading size="sm" className="mb-2 news-title line-clamp-2">
          {article.title}
        </Heading>
        <Flex gap={2} className="mb-2 items-center">
          {article.category && (
            <Badge 
              colorScheme="gray" 
              variant="subtle"
              size="sm"
              className="text-xs"
            >
              {article.category.icon} {article.category.name}
            </Badge>
          )}
          <Text size="sm" className="text-gray-500 text-xs">
            {formatDate(article.created_at)}
          </Text>
        </Flex>
      </CardHeader>
      <CardBody className="flex-1 flex flex-col pt-0">
        {displayImageUrl && (
          <Box 
            className="relative mb-3 w-full overflow-hidden aspect-video min-h-[200px]"
            style={{ borderRadius: 0 }}
          >
            {imageLoading && (
              <Skeleton
                className="absolute inset-0 z-10"
                style={{ borderRadius: 0 }}
              />
            )}
            <img
              src={displayImageUrl.includes('fal.media')
                ? getOptimizedImageUrlBySize(displayImageUrl, 350, 197)
                : displayImageUrl}
              data-original-src={displayImageUrl}
              srcSet={displayImageUrl.includes('fal.media') ? generateSrcSet(displayImageUrl, { aspectRatio: 16/9, breakpoints: [350, 400, 600] }) : undefined}
              sizes={displayImageUrl.includes('fal.media') ? "(max-width: 768px) 100vw, (max-width: 1024px) 350px, 400px" : undefined}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover object-center news-card-image"
              loading="lazy"
              decoding="async"
              width="400"
              height="300"
              onLoad={() => {
                setImageLoading(false);
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
            className="text-sm text-gray-600 mb-3 line-clamp-3 leading-relaxed"
          />
        )}
        <Flex align="center" justify="space-between" className="news-meta text-xs mt-auto pt-2 border-t border-gray-100">
          <Flex gap={3} align="center">
            <ArticleVoteButtons article={article} compact={true} />
            <Text className="news-stats">💬 {article.approved_comments_count || 0}</Text>
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default StoryCard;
