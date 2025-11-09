import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardBody,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Spinner,
  Alert,
  Textarea,
  Input,
  Divider,
  SimpleGrid,
} from '../components/ui';
import { Helmet } from 'react-helmet-async';
import { lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { articlesAPI, commentsAPI, votesAPI } from '../services/api';
import FormattedText from '../components/FormattedText';
import TopNavigation from '../components/TopNavigation';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useImageSettings } from '../hooks/useImageSettings';

// Lazy load components that aren't immediately visible
const AdComponent = lazy(() => import('../components/AdComponent'));
const SocialShare = lazy(() => import('../components/SocialShare'));

const ArticlePage = () => {
  const { slug } = useParams();
  const { settings } = useSiteSettings();
  const { settings: imageSettings } = useImageSettings();
  const [article, setArticle] = useState(null);

  // Helper function to get aspect ratio padding
  const getAspectRatioPadding = (aspectRatio) => {
    const ratios = {
      '16:9': '56.25%',
      '4:3': '75%',
      '3:2': '66.67%',
      '1:1': '100%',
      '21:9': '42.86%',
      '9:16': '177.78%',
    };
    return ratios[aspectRatio] || '56.25%'; // Default to 16:9
  };
  const [comments, setComments] = useState([]);
  const [voteStatus, setVoteStatus] = useState({ has_voted: false, vote_type: null, vote_score: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentForm, setCommentForm] = useState({ author_name: '', content: '' });
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Check if slug is valid
      if (!slug || slug.length < 3) {
        setError(`Invalid article URL: "${slug}"`);
        setLoading(false);
        return;
      }

      try {
        const [articleResponse, commentsResponse] = await Promise.all([
          articlesAPI.getBySlug(slug),
          commentsAPI.getByArticle(slug),
        ]);
        
        setArticle(articleResponse.data);
        setComments(commentsResponse.data.results || commentsResponse.data);
        
        // Fetch vote status after we have the article data
        if (articleResponse.data?.id) {
          try {
            const voteResponse = await votesAPI.getStatus(articleResponse.data.id);
            setVoteStatus(voteResponse.data);
          } catch (voteErr) {
            console.error('Error fetching vote status:', voteErr);
          }
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError(`Article "${slug}" not found or is not published`);
          console.log(`Article not found or not published: /article/${slug}`);
        } else {
          setError('Failed to load article');
          console.error('Error fetching data:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleVote = async (voteType) => {
    if (voteStatus.has_voted) return;

    try {
      await votesAPI.create({
        article: article.id,
        vote_type: voteType,
      });
      
      // Update vote status
      const response = await votesAPI.getStatus(article.id);
      setVoteStatus(response.data);
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentForm.content.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await commentsAPI.create({
        article_slug: article.slug,
        ...commentForm,
      });
      setComments([response.data, ...comments]);
      setCommentForm({ author_name: '', content: '' });
    } catch (err) {
      console.error('Error submitting comment:', err);
      console.error('Error response:', err.response?.data);
      
      // Show detailed error message to user
      if (err.response?.data?.details) {
        const errorDetails = err.response.data.details;
        const errorMessages = Object.entries(errorDetails)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        alert(`Validation Error:\n${errorMessages}`);
      } else if (err.response?.data?.error) {
        alert(err.response.data.error);
      } else {
        alert('Failed to submit comment. Please try again.');
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <Container className="max-w-5xl py-8">
        <Box className="text-center">
          <Spinner size="xl" />
          <Text className="mt-4">Loading article...</Text>
        </Box>
      </Container>
    );
  }

    if (error || !article) {
      return (
        <Container className="max-w-5xl py-8">
          <VStack spacing={6}>
            <Alert status="error">
              {error || 'Article not found'}
            </Alert>
            <Box className="text-center">
              <Text className="mb-4">
                {error?.includes('not published') 
                  ? 'This article is not yet published or has been removed.'
                  : 'The article you\'re looking for doesn\'t exist or has been removed.'
                }
              </Text>
              <Button as={Link} to="/" colorScheme="brand">
                ← Back to Home
              </Button>
            </Box>
          </VStack>
        </Container>
      );
    }

  return (
    <>
      <Helmet>
        <title>{article.title} - Dhivehinoos.net</title>
        <meta name="description" content={`${article.title} - AI-generated fictional content for research purposes`} />
        <meta name="keywords" content="Maldives, AI content, fictional stories, research, academic, entertainment" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Dhivehinoos.net" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://dhivehinoos.net/article/${article.slug}`} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={`${article.title} - AI-generated fictional content for research purposes`} />
        <meta property="og:image" content={article.image_url || 'https://dhivehinoos.net/static/favicon.svg'} />
        <meta property="og:site_name" content="Dhivehinoos.net" />
        <meta property="article:published_time" content={article.created_at} />
        <meta property="article:modified_time" content={article.updated_at} />
        <meta property="article:author" content="Dhivehinoos.net" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={`https://dhivehinoos.net/article/${article.slug}`} />
        <meta property="twitter:title" content={article.title} />
        <meta property="twitter:description" content={`${article.title} - AI-generated fictional content for research purposes`} />
        <meta property="twitter:image" content={article.image_url || 'https://dhivehinoos.net/static/favicon.svg'} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": `${article.title} - AI-generated fictional content for research purposes`,
            "image": article.image_url || 'https://dhivehinoos.net/static/favicon.svg',
            "author": {
              "@type": "Organization",
              "name": "Dhivehinoos.net"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Dhivehinoos.net",
              "logo": {
                "@type": "ImageObject",
                "url": "https://dhivehinoos.net/static/favicon.svg"
              }
            },
            "datePublished": article.created_at,
            "dateModified": article.updated_at,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://dhivehinoos.net/article/${article.slug}`
            },
            "url": `https://dhivehinoos.net/article/${article.slug}`
          })}
        </script>
      </Helmet>

      {/* Top Navigation */}
      <TopNavigation 
        onSearch={() => {}}
        searchQuery=""
        setSearchQuery={() => {}}
        selectedCategory={null}
      />

      <Container className="max-w-5xl py-4 md:py-8">
        <VStack spacing={8} align="stretch">
          {/* Article Header Ad */}
          <Suspense fallback={null}>
            <AdComponent placement="article_header" maxAds={1} />
          </Suspense>
          
          {/* Article Header with Images */}
          <Card>
            <CardBody>
              {article.reuse_images && article.reuse_images.length > 0 ? (
                // Show original image + reuse images symmetrically
                <VStack spacing={4} className="mb-2" align="stretch">
                  {/* Main images row: Original + Reuse images */}
                  <Box>
                    <HStack spacing={4} align="stretch" className="flex-wrap md:flex-nowrap">
                      {/* Original API image */}
                      <Box className="flex-1 basis-full md:basis-1/2">
                        <Box 
                          className={`relative w-full overflow-hidden ${imageSettings.image_hover_effect ? 'transition-transform hover:scale-[1.02]' : ''}`}
                          style={{
                            borderRadius: `${imageSettings.image_border_radius || 8}px`,
                            boxShadow: imageSettings.image_shadow ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
                            aspectRatio: imageSettings.main_image_aspect_ratio || "16/9",
                          }}
                        >
                          <img
                            src={article.original_image_url || article.image_url}
                            alt={`${article.title} - original image`}
                            className="w-full h-full object-cover"
                            style={{
                              objectFit: imageSettings.image_fit || 'cover',
                              objectPosition: imageSettings.image_position || 'top',
                            }}
                            loading="eager"
                            decoding="async"
                            fetchPriority="high"
                            width="800"
                            height="450"
                            onError={(e) => {
                              // Hide image if it fails to load
                              e.target.style.display = 'none';
                            }}
                          />
                        </Box>
                        <Text size="sm" className="text-gray-600 mt-2 text-center">
                          Original Story Image
                        </Text>
                      </Box>

                      {/* First reuse image - scaled to match API image height */}
                      {article.reuse_images[0] && (
                        <Box className="flex-1 basis-full md:basis-1/2">
                          <Box 
                            className={`relative w-full overflow-hidden bg-gray-100 ${imageSettings.image_hover_effect ? 'transition-transform hover:scale-[1.02]' : ''}`}
                            style={{
                              borderRadius: `${imageSettings.image_border_radius || 8}px`,
                              boxShadow: imageSettings.image_shadow ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
                              aspectRatio: imageSettings.reuse_image_aspect_ratio || "2/3",
                            }}
                          >
                            <img
                              src={article.reuse_images[0].image_url}
                              alt={`${article.title} - ${article.reuse_images[0].entity_name}`}
                              className="w-full h-full object-contain"
                              style={{
                                objectFit: imageSettings.image_fit || 'contain',
                                objectPosition: imageSettings.image_position || 'center',
                              }}
                              loading="lazy"
                              decoding="async"
                              width="400"
                              height="600"
                              onError={(e) => {
                                // Hide image if it fails to load
                                e.target.style.display = 'none';
                              }}
                            />
                          </Box>
                          <Text size="sm" className="text-gray-600 mt-2 text-center">
                            {article.reuse_images[0].entity_name}
                          </Text>
                        </Box>
                      )}
                    </HStack>
                  </Box>

                  {/* Additional reuse images (2x2 grid if more than 2 total) */}
                  {article.reuse_images.length > 1 && (
                    <Box>
                      <Heading size="md" className="mb-3 text-gray-700">
                        Related Public Figures & Institutions
                      </Heading>
                      <SimpleGrid columns={{ base: 1, sm: 2, md: Math.min(article.reuse_images.length - 1, 2) }} spacing={4}>
                        {article.reuse_images.slice(1).map((image, index) => (
                          <Box key={image.id} className="text-center">
                            <Box 
                              className={`relative pb-[125%] h-0 overflow-hidden bg-gray-100 mb-2 ${imageSettings.image_hover_effect ? 'transition-transform hover:scale-105' : ''}`}
                              style={{
                                borderRadius: `${imageSettings.image_border_radius || 8}px`,
                                boxShadow: imageSettings.image_shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                              }}
                            >
                              <img
                                src={image.image_url}
                                alt={image.entity_name}
                                className="absolute top-0 left-0 w-full h-full"
                                style={{
                                  objectFit: imageSettings.image_fit || 'contain',
                                  objectPosition: imageSettings.image_position || 'center',
                                }}
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  // Hide image if it fails to load
                                  e.target.style.display = 'none';
                                }}
                              />
                            </Box>
                            <Text size="sm" className="font-medium text-gray-600">
                              {image.entity_name}
                            </Text>
                            <Text size="xs" className="text-gray-500">
                              {image.entity_type}
                            </Text>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}
                </VStack>
              ) : (
                // Default single image display
                article.image_url ? (
                  <Box 
                    className={`relative w-full overflow-hidden mb-2 ${imageSettings.image_hover_effect ? 'transition-transform hover:scale-[1.02]' : ''}`}
                    style={{
                      borderRadius: `${imageSettings.image_border_radius || 8}px`,
                      boxShadow: imageSettings.image_shadow ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
                      aspectRatio: imageSettings.main_image_aspect_ratio || "16/9",
                    }}
                  >
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      style={{
                        objectFit: imageSettings.image_fit || 'cover',
                        objectPosition: imageSettings.image_position || 'top',
                      }}
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      width="800"
                      height="450"
                      onError={(e) => {
                        // Don't show placeholder - just hide the image container
                        e.target.style.display = 'none';
                      }}
                    />
                  </Box>
                ) : null
              )}
              <Heading size="xl" className={article.image_url ? "mt-0 mb-1" : "mb-3"}>
                {article.title}
              </Heading>
              <HStack spacing={4} className="mb-2">
                <Text size="sm" className="text-gray-600">
                  {new Date(article.created_at).toLocaleDateString()}
                </Text>
              </HStack>

              {/* Voting Section */}
              <HStack spacing={4} className="mb-4">
                <Text className="font-bold">Vote Score: {voteStatus.vote_score}</Text>
                <Button
                  colorScheme="green"
                  size="xs"
                  onClick={() => handleVote('up')}
                  disabled={voteStatus.has_voted}
                  className="min-w-auto px-2"
                >
                  👍
                </Button>
                <Button
                  colorScheme="red"
                  size="xs"
                  onClick={() => handleVote('down')}
                  disabled={voteStatus.has_voted}
                  className="min-w-auto px-2"
                >
                  👎
                </Button>
                {voteStatus.has_voted && (
                  <Text size="sm" className="text-gray-500">
                    You voted: {voteStatus.vote_type}
                  </Text>
                )}
              </HStack>

              {/* Article Content - fragments are handled within FormattedText */}
              <FormattedText content={article.content} />
              
              {/* Social Sharing */}
              <Box className="mt-6 p-4 bg-gray-50 rounded-md">
                <Suspense fallback={null}>
                  <SocialShare article={article} />
                </Suspense>
              </Box>
              
              {/* Back to Home Link */}
              <Box className="mt-8 text-center">
                <Button as={Link} to="/" colorScheme="brand" variant="outline">
                  ← Back to Home
                </Button>
              </Box>
            </CardBody>
          </Card>

          {/* Comments Section */}
          {settings.allow_comments && (
            <Card>
              <CardBody>
                <Heading size="lg" className="mb-6">
                  Comments ({comments.length})
                </Heading>

                {/* Comment Form */}
                <Box className="mb-8">
                  <form onSubmit={handleCommentSubmit}>
                    <VStack spacing={4}>
                      <Input
                        placeholder="Your name (optional)"
                        value={commentForm.author_name}
                        onChange={(e) => setCommentForm({ ...commentForm, author_name: e.target.value })}
                      />
                      <Textarea
                        placeholder="Write your comment..."
                        value={commentForm.content}
                        onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                        rows={4}
                        required
                      />
                      <Button
                        type="submit"
                        colorScheme="brand"
                        disabled={submittingComment}
                      >
                        {submittingComment ? 'Submitting...' : 'Submit Comment'}
                      </Button>
                    </VStack>
                  </form>
                </Box>

                <Divider className="mb-6" />

                {/* Comments List */}
                <VStack spacing={4} align="stretch">
                  {comments.map((comment) => (
                    <Box key={comment.id} className="p-4 bg-gray-50 rounded-md">
                      <HStack justify="space-between" className="mb-2">
                        <Text className="font-bold">
                          {comment.author_name || 'Anonymous'}
                        </Text>
                        <Text size="sm" className="text-gray-600">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </Text>
                      </HStack>
                      <Text>{comment.content}</Text>
                    </Box>
                  ))}
                  {comments.length === 0 && (
                    <Text className="text-gray-500 text-center py-8">
                      No comments yet. Be the first to comment!
                    </Text>
                  )}
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Article Footer Ad */}
          <Suspense fallback={null}>
            <AdComponent placement="article_footer" maxAds={1} />
          </Suspense>
        </VStack>
      </Container>
    </>
  );
};

export default ArticlePage;
