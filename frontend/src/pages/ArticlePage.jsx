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
  Badge,
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
  const [voteStatus, setVoteStatus] = useState({ has_voted: false, vote_count: 0, vote_type: null, vote_score: 0 });
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
        
        const articleData = articleResponse.data;
        setArticle(articleData);
        setComments(commentsResponse.data.results || commentsResponse.data);
        
        // Debug: Log image data to help diagnose issues
        if (import.meta.env.DEV) {
          console.log('Article image data:', {
            image_url: articleData.image_url,
            original_image_url: articleData.original_image_url,
            reuse_images: articleData.reuse_images?.length || 0,
            reused_image_url: articleData.reused_image_url,
          });
        }
        
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
    try {
      const voteResponse = await votesAPI.create({
        article: article.id,
        vote_type: voteType,
      });
      
      // Check if article was moved to draft
      if (voteResponse.data?.article_moved_to_draft) {
        // Dispatch event to refresh landing page
        window.dispatchEvent(new CustomEvent('articleMovedToDraft', {
          detail: { articleId: voteResponse.data.article_id }
        }));
        
        // Redirect to home page after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
        
        return; // Don't update vote status since we're redirecting
      }
      
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

      {/* Main Article Container - Standard.mv style with sidebar */}
      <Box className="w-full article-page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <style>{`
          .article-page-container .grid-container {
            display: flex;
            gap: 2rem;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
          }
          .article-page-container .s-ct {
            flex: 0 0 69.9%;
            width: 69.9%;
            min-width: 0;
          }
          .article-page-container .sidebar-wrap {
            flex: 0 0 30%;
            width: 30%;
            min-width: 0;
          }
          @media (max-width: 1024px) {
            .article-page-container .s-ct {
              flex: 0 0 100%;
              width: 100%;
            }
            .article-page-container .sidebar-wrap {
              display: none;
            }
            .article-page-container .grid-container {
              flex-direction: column;
              gap: 1rem;
            }
          }
          .entry-content p {
            margin-bottom: 1.5rem;
            line-height: 1.6;
          }
          .entry-content img.aligncenter {
            display: block;
            margin: 2rem auto;
            max-width: 100%;
            height: auto;
          }
        `}</style>
        <Box className="grid-container">
          {/* Main Content Area - 70% width, responsive */}
          <Box className="s-ct">
            <VStack spacing={8} align="stretch">
              {/* Article Header Ad */}
              <Suspense fallback={null}>
                <AdComponent placement="article_header" maxAds={1} />
              </Suspense>
              
              {/* Article Header with Images */}
              <Box style={{ backgroundColor: 'white' }}>
                  {/* Article Header Content */}
                  <Box className="single-header" style={{ marginBottom: '1.5rem' }}>
                    {/* Categories */}
                    {article.category && (
                      <Box className="s-cats" style={{ marginBottom: '1rem' }}>
                        <Badge 
                          colorScheme="gray" 
                          variant="subtle"
                          size="sm"
                          className="text-xs"
                        >
                          {article.category.icon} {article.category.name}
                        </Badge>
                      </Box>
                    )}
                    
                    {/* Headline - Standard.mv style */}
                    <Heading 
                      size="xl" 
                      className="s-title" 
                      style={{ 
                        fontSize: '2.625rem', 
                        fontWeight: 900, 
                        lineHeight: '1.048',
                        color: '#000000',
                        marginBottom: '1rem',
                        fontFamily: 'Crimson Pro, serif',
                        letterSpacing: '-0.02381em',
                      }}
                    >
                      {article.title}
                    </Heading>
                    
                    {/* Metadata - Standard.mv style */}
                    <Box className="single-meta" style={{ marginBottom: '1.5rem' }}>
                      <HStack spacing={4} className="meta-s-line">
                        <Text size="sm" className="text-gray-600" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                          By {article.author_name || 'Staff'}
                        </Text>
                        <Text size="sm" className="text-gray-500">•</Text>
                        <Text size="sm" className="text-gray-600" style={{ fontSize: '11px' }}>
                          <time dateTime={article.created_at}>
                            {new Date(article.created_at).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </time>
                        </Text>
                      </HStack>
                    </Box>

                    {/* Voting Section */}
                    <HStack spacing={4} className="mb-4">
                      <Text className="font-bold">Vote Score: {voteStatus.vote_score}</Text>
                      <Button
                        colorScheme="green"
                        size="xs"
                        onClick={() => handleVote('up')}
                        className="min-w-auto px-2"
                      >
                        👍
                      </Button>
                      <Button
                        colorScheme="red"
                        size="xs"
                        onClick={() => handleVote('down')}
                        className="min-w-auto px-2"
                      >
                        👎
                      </Button>
                      {voteStatus.vote_count > 0 && (
                        <Text size="sm" className="text-gray-500">
                          Your votes: {voteStatus.vote_count} ({voteStatus.vote_type === 'up' ? '👍' : '👎'} last)
                        </Text>
                      )}
                    </HStack>
                  </Box>

                  {/* Featured Image Section - Standard.mv style */}
                  {(() => {
                    const mainImageUrl = article.original_image_url || article.image_url;
                    if (!mainImageUrl || typeof mainImageUrl !== 'string' || mainImageUrl.trim() === '') {
                      return null;
                    }
                    
                    return (
                      <Box className="s-feat-outer" style={{ marginBottom: '2rem' }}>
                        <Box className="s-feat" style={{ width: '100%' }}>
                          <figure style={{ margin: 0, padding: 0, width: '100%' }}>
                            <img
                              src={mainImageUrl}
                              alt={article.title}
                              width="860"
                              height="573"
                              style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                                objectFit: 'cover',
                                borderRadius: '0',
                              }}
                              loading="eager"
                              decoding="async"
                              fetchPriority="high"
                              className="wp-post-image"
                              onError={(e) => {
                                console.error('Main image failed to load:', mainImageUrl);
                                const container = e.target.closest('.s-feat-outer');
                                if (container) {
                                  container.style.display = 'none';
                                }
                              }}
                              onLoad={() => {
                                if (import.meta.env.DEV) {
                                  console.log('Main image loaded successfully:', mainImageUrl);
                                }
                              }}
                            />
                          </figure>
                        </Box>
                      </Box>
                    );
                  })()}

                  {/* Article Content Wrapper - Standard.mv style */}
                  <Box className="s-ct-wrap">
                    <Box className="s-ct-inner">
                      <Box 
                        className="entry-content rbct clearfix"
                        style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: '19px',
                          lineHeight: '1.6',
                          color: '#000000',
                        }}
                      >

                        {/* Article Content - Standard.mv style with proper paragraph and image layout */}
                        {(() => {
                          // If there are reuse images, render content with images interspersed between paragraphs
                          if (article.reuse_images && article.reuse_images.length > 0) {
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
                              paragraphToImageMap.set(0, 0);
                            }
                            
                            // Build content elements with images
                            const contentElements = [];
                            paragraphMatches.forEach((paraHTML, paraIndex) => {
                              // Add paragraph
                              contentElements.push(
                                <Box
                                  key={`para-${paraIndex}`}
                                  dangerouslySetInnerHTML={{ __html: paraHTML }}
                                  className="formatted-text"
                                  style={{
                                    marginBottom: '1.5rem',
                                  }}
                                />
                              );
                              
                              // Insert image after this paragraph if it's an insertion point
                              const imageIndex = paragraphToImageMap.get(paraIndex);
                              if (imageIndex !== undefined && imageIndex < article.reuse_images.length) {
                                const reuseImage = article.reuse_images[imageIndex];
                                if (reuseImage && reuseImage.image_url && typeof reuseImage.image_url === 'string' && reuseImage.image_url.trim() !== '') {
                                  contentElements.push(
                                    <Box key={`img-${imageIndex}`} style={{ margin: '2rem 0', textAlign: 'center' }}>
                                      <figure style={{ margin: 0, padding: 0, display: 'inline-block', maxWidth: '100%' }}>
                                        <img 
                                          src={reuseImage.image_url}
                                          alt={`${article.title} - ${reuseImage.entity_name || 'Related image'}`}
                                          className="aligncenter size-full"
                                          style={{
                                            width: '100%',
                                            height: 'auto',
                                            maxWidth: '100%',
                                            display: 'block',
                                            margin: '0 auto',
                                          }}
                                          loading="lazy"
                                          decoding="async"
                                          onError={(e) => {
                                            console.error('Reuse image failed to load:', reuseImage.image_url);
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                        {reuseImage.entity_name && (
                                          <figcaption style={{
                                            textAlign: 'center',
                                            marginTop: '0.75rem',
                                            fontSize: '0.875rem',
                                            color: '#6b7280',
                                            fontStyle: 'italic',
                                            lineHeight: '1.5',
                                          }}>
                                            {reuseImage.entity_name}
                                          </figcaption>
                                        )}
                                      </figure>
                                    </Box>
                                  );
                                }
                              }
                            });
                            
                            // Add any remaining HTML after the last paragraph
                            const lastParaIndex = formattedHTML.lastIndexOf('</p>');
                            if (lastParaIndex !== -1 && lastParaIndex + 4 < formattedHTML.length) {
                              const remainingHTML = formattedHTML.substring(lastParaIndex + 4);
                              if (remainingHTML.trim()) {
                                contentElements.push(
                                  <Box
                                    key="remaining"
                                    dangerouslySetInnerHTML={{ __html: remainingHTML }}
                                    className="formatted-text"
                                  />
                                );
                              }
                            }
                            
                            return (
                              <>
                                {contentElements}
                                {fragmentsContent && (
                                  <Box className="mt-8 pt-6 pb-4 px-4 border-t-2 border-gray-300 bg-gray-50 rounded-lg">
                                    <Box
                                      dangerouslySetInnerHTML={{ 
                                        __html: formatTextToHTML(fragmentsContent) 
                                      }}
                                      className="[&_p]:mb-3 [&_p]:pl-4 [&_p]:border-l-[3px] [&_p]:border-gray-300 [&_p]:italic [&_p]:text-[0.7em] [&_p]:leading-relaxed [&_p]:text-gray-500"
                                    />
                                  </Box>
                                )}
                              </>
                            );
                          } else {
                            // No reuse images, render normally - Standard.mv style
                            return <FormattedText content={article.content} />;
                          }
                        })()}
                      </Box>
                    </Box>
                  </Box>
                </Box>
                
                {/* Social Sharing - Standard.mv style */}
                <Box className="e-shared-sec entry-sec" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
                  <Box className="e-shared-header" style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 700 }}>
                    Share This Article
                  </Box>
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
            </Box>
                  
                  {/* Sidebar - Standard.mv style (30% width), hidden on mobile */}
                  <Box className="sidebar-wrap single-sidebar">
                    <Box className="sidebar-inner clearfix">
                      <Suspense fallback={null}>
                        <AdComponent placement="sidebar" maxAds={2} />
                      </Suspense>
                    </Box>
                  </Box>
                </Box>
              </Box>
    </>
  );
};

export default ArticlePage;
