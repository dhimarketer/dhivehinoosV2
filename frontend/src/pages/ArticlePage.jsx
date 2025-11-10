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
import { formatTextToHTML } from '../utils/textFormatter';

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
            <CardBody className="p-0">
              {/* Article Header Content - with padding */}
              <Box className="px-4 pt-4">
                {/* Headline with proper spacing */}
                <Heading size="xl" className="mb-6" style={{ 
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  lineHeight: '1.2',
                  color: '#1a202c'
                }}>
                  {article.title}
                </Heading>
                
                {/* Metadata with spacing */}
                <HStack spacing={4} className="mb-6">
                  <Text size="sm" className="text-gray-600">
                    {new Date(article.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                  <Text size="sm" className="text-gray-500">•</Text>
                  <Text size="sm" className="text-gray-600">
                    {new Date(article.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
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
              </Box>

              {/* Article Content Container - includes image and text */}
              <Box className="px-4 pb-4">
                {/* Main API image - positioned after headline and metadata, before article text */}
                {(article.original_image_url || article.image_url) ? (
                  <figure 
                    className="mt-2 mb-2"
                    style={{
                      margin: '0.5rem 0 0.5rem 0',
                      padding: 0,
                      width: '100%',
                      maxWidth: '100%',
                      display: 'block',
                    }}
                  >
                    <Box 
                      className={`relative overflow-hidden bg-gray-50 ${imageSettings.image_hover_effect ? 'transition-transform hover:scale-[1.02]' : ''}`}
                      style={{
                        borderRadius: `${imageSettings.image_border_radius || 8}px`,
                        boxShadow: imageSettings.image_shadow ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
                        aspectRatio: imageSettings.main_image_aspect_ratio || "3/2",
                        width: '100%',
                        maxWidth: '100%',
                        display: 'block',
                        margin: 0,
                      }}
                    >
                      <img
                        src={article.original_image_url || article.image_url}
                        alt={article.title}
                        className="w-full h-full"
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'block',
                          objectFit: imageSettings.image_fit === 'contain' ? 'contain' : (imageSettings.image_fit || 'cover'),
                          objectPosition: imageSettings.image_position || 'top center',
                        }}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        onError={(e) => {
                          // Don't show placeholder - just hide the image container
                          e.target.style.display = 'none';
                        }}
                      />
                    </Box>
                  </figure>
                ) : null}

                {/* Article Content - fragments are handled within FormattedText */}
                <Box className="mb-6 [&_p:first-child]:mt-0 [&_p:first-child]:pt-0">
                  {(() => {
                    // If there are reuse images, render content with images interspersed between paragraphs
                    if (article.reuse_images && article.reuse_images.length > 0) {
                      // First, format the content to get HTML with paragraph tags
                      
                      // Check if content contains source fragments section
                      const sourceFragmentsRegex = /(source fragments?)[\s\S]*$/i;
                      const fragmentsMatch = article.content.match(sourceFragmentsRegex);
                      
                      let mainContent = article.content;
                      let fragmentsContent = null;
                      
                      if (fragmentsMatch && fragmentsMatch.index !== undefined) {
                        const fragmentsIndex = fragmentsMatch.index;
                        mainContent = article.content.substring(0, fragmentsIndex).trim();
                        fragmentsContent = article.content.substring(fragmentsIndex).trim();
                      }
                      
                      // Format main content to HTML
                      const formattedHTML = formatTextToHTML(mainContent);
                      
                      // Parse HTML to find paragraph boundaries
                      // Split by </p> tags to get individual paragraphs
                      const paragraphMatches = formattedHTML.match(/<p>[\s\S]*?<\/p>/g) || [];
                      
                      // Calculate where to insert images (distribute evenly)
                      const paragraphToImageMap = new Map();
                      if (paragraphMatches.length > 1) {
                        const interval = Math.max(1, Math.floor(paragraphMatches.length / (article.reuse_images.length + 1)));
                        for (let i = 0; i < article.reuse_images.length; i++) {
                          const insertAfter = Math.min((i + 1) * interval, paragraphMatches.length - 1);
                          paragraphToImageMap.set(insertAfter, i);
                        }
                      } else if (paragraphMatches.length === 1) {
                        // If only one paragraph, insert first image after it
                        paragraphToImageMap.set(0, 0);
                      }
                      
                      // Build the content with images inserted
                      const contentParts = [];
                      paragraphMatches.forEach((paraHTML, paraIndex) => {
                        contentParts.push(paraHTML);
                        
                        // Insert image after this paragraph if it's an insertion point
                        const imageIndex = paragraphToImageMap.get(paraIndex);
                        if (imageIndex !== undefined && imageIndex < article.reuse_images.length) {
                          const reuseImage = article.reuse_images[imageIndex];
                          const imageHTML = `
                            <div class="reuse-image-container" style="margin: 2rem 0;">
                              <div class="reuse-image-wrapper" style="position: relative; width: 100%; max-width: 28rem; margin: 0 auto; overflow: hidden; background: #f3f4f6; border-radius: ${imageSettings.image_border_radius || 8}px; box-shadow: ${imageSettings.image_shadow ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none'}; aspect-ratio: 4/3;">
                                <img 
                                  src="${reuseImage.image_url}" 
                                  alt="${article.title} - ${reuseImage.entity_name || 'Related image'}"
                                  style="width: 100%; height: 100%; object-fit: ${imageSettings.image_fit === 'contain' ? 'contain' : (imageSettings.image_fit || 'cover')}; object-position: ${imageSettings.image_position || 'top center'};"
                                  loading="lazy"
                                  decoding="async"
                                  onerror="this.style.display='none'"
                                />
                              </div>
                              ${reuseImage.entity_name ? `<p style="text-align: center; margin-top: 0.5rem; font-size: 0.875rem; color: #4b5563;">${reuseImage.entity_name}</p>` : ''}
                            </div>
                          `;
                          contentParts.push(imageHTML);
                        }
                      });
                      
                      // Add any remaining HTML after the last paragraph
                      const lastParaIndex = formattedHTML.lastIndexOf('</p>');
                      if (lastParaIndex !== -1 && lastParaIndex + 4 < formattedHTML.length) {
                        const remainingHTML = formattedHTML.substring(lastParaIndex + 4);
                        if (remainingHTML.trim()) {
                          contentParts.push(remainingHTML);
                        }
                      }
                      
                      return (
                        <>
                          <Box
                            dangerouslySetInnerHTML={{ __html: contentParts.join('') }}
                            className="formatted-text [&_p]:mb-6 [&_p]:leading-7 [&_p]:text-base [&_p:last-child]:mb-0 [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-800 [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-800 [&_h3]:mb-3 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-gray-800 [&_strong]:font-bold [&_strong]:text-gray-800 [&_em]:italic [&_del]:line-through [&_del]:text-gray-500 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_ul]:mb-4 [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:pl-6 [&_li]:mb-1 [&_li]:leading-normal [&_a]:text-blue-500 [&_a]:underline [&_a:hover]:text-blue-600 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-gray-600"
                          />
                          {fragmentsContent && (
                            <Box className="mt-8 pt-6 pb-4 px-4 border-t-2 border-gray-300 bg-gray-50 rounded-lg">
                              <Box
                                dangerouslySetInnerHTML={{ 
                                  __html: formatTextToHTML(fragmentsContent) 
                                }}
                                className="[&_p]:mb-3 [&_p]:pl-4 [&_p]:border-l-[3px] [&_p]:border-gray-300 [&_p]:italic [&_p]:text-[0.7em] [&_p]:leading-relaxed [&_p]:text-gray-500 [&_p_sub]:italic [&_p_sub]:text-[0.85em] [&_p_sub]:align-sub [&_p_sub]:leading-normal [&_p.source-fragments-header]:font-semibold [&_p:first-of-type]:font-semibold [&_p.source-fragments-header]:text-[0.65em] [&_p:first-of-type]:text-[0.65em] [&_p.source-fragments-header]:uppercase [&_p:first-of-type]:uppercase [&_p.source-fragments-header]:tracking-wide [&_p:first-of-type]:tracking-wide [&_p.source-fragments-header]:text-gray-400 [&_p:first-of-type]:text-gray-400 [&_p.source-fragments-header]:mb-4 [&_p:first-of-type]:mb-4 [&_p.source-fragments-header]:border-l-0 [&_p:first-of-type]:border-l-0 [&_p.source-fragments-header]:pl-0 [&_p:first-of-type]:pl-0 [&_p.source-fragments-header]:not-italic [&_p:first-of-type]:not-italic"
                              />
                            </Box>
                          )}
                        </>
                      );
                    } else {
                      // No reuse images, render normally
                      return <FormattedText content={article.content} />;
                    }
                  })()}
                </Box>
                
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
