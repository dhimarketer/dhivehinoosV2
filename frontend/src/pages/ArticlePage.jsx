import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardBody,
  Image as ChakraImage,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
  Textarea,
  Input,
  Divider,
} from '@chakra-ui/react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { articlesAPI, commentsAPI, votesAPI } from '../services/api';
import FormattedText from '../components/FormattedText';
import AdComponent from '../components/AdComponent';

const ArticlePage = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
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
        article: article.id,
        ...commentForm,
      });
      setComments([response.data, ...comments]);
      setCommentForm({ author_name: '', content: '' });
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Box textAlign="center">
          <Spinner size="xl" />
          <Text mt={4}>Loading article...</Text>
        </Box>
      </Container>
    );
  }

    if (error || !article) {
      return (
        <Container maxW="container.lg" py={8}>
          <VStack spacing={6}>
            <Alert status="error">
              <AlertIcon />
              {error || 'Article not found'}
            </Alert>
            <Box textAlign="center">
              <Text mb={4}>
                {error?.includes('not published') 
                  ? 'This article is not yet published or has been removed.'
                  : 'The article you\'re looking for doesn\'t exist or has been removed.'
                }
              </Text>
              <Button as={Link} to="/" colorScheme="blue">
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

      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Article Header Ad */}
          <AdComponent placement="article_header" maxAds={1} />
          
          {/* Article Header */}
          <Card>
            <CardBody>
              <ChakraImage
                src={article.image_url}
                alt={article.title}
                borderRadius="lg"
                objectFit="cover"
                h="400px"
                w="100%"
                mb={4}
                fallbackSrc="https://via.placeholder.com/800x400/cccccc/666666?text=Article+Image"
              />
              <Heading size="xl" mb={4}>
                {article.title}
              </Heading>
              <HStack spacing={4} mb={4}>
                <Text fontSize="sm" color="gray.600">
                  {new Date(article.created_at).toLocaleDateString()}
                </Text>
              </HStack>

              {/* Voting Section */}
              <HStack spacing={4} mb={6}>
                <Text fontWeight="bold">Vote Score: {voteStatus.vote_score}</Text>
                <Button
                  colorScheme="green"
                  size="sm"
                  onClick={() => handleVote('up')}
                  isDisabled={voteStatus.has_voted}
                >
                  👍 Upvote
                </Button>
                <Button
                  colorScheme="red"
                  size="sm"
                  onClick={() => handleVote('down')}
                  isDisabled={voteStatus.has_voted}
                >
                  👎 Downvote
                </Button>
                {voteStatus.has_voted && (
                  <Text fontSize="sm" color="gray.500">
                    You voted: {voteStatus.vote_type}
                  </Text>
                )}
              </HStack>

              {/* Article Content */}
              <FormattedText content={article.content} />
              
              {/* Back to Home Link */}
              <Box mt={8} textAlign="center">
                <Button as={Link} to="/" colorScheme="blue" variant="outline">
                  ← Back to Home
                </Button>
              </Box>
            </CardBody>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardBody>
              <Heading size="lg" mb={6}>
                Comments ({comments.length})
              </Heading>

              {/* Comment Form */}
              <Box mb={8}>
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
                      colorScheme="blue"
                      isLoading={submittingComment}
                      loadingText="Submitting..."
                    >
                      Submit Comment
                    </Button>
                  </VStack>
                </form>
              </Box>

              <Divider mb={6} />

              {/* Comments List */}
              <VStack spacing={4} align="stretch">
                {comments.map((comment) => (
                  <Box key={comment.id} p={4} bg="gray.50" borderRadius="md">
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="bold">
                        {comment.author_name || 'Anonymous'}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </Text>
                    </HStack>
                    <Text>{comment.content}</Text>
                  </Box>
                ))}
                {comments.length === 0 && (
                  <Text color="gray.500" textAlign="center" py={8}>
                    No comments yet. Be the first to comment!
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Article Footer Ad */}
          <AdComponent placement="article_footer" maxAds={1} />
        </VStack>
      </Container>
    </>
  );
};

export default ArticlePage;
