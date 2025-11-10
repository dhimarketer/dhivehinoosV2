import React from 'react';
import {
  Box,
  Container,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Divider,
} from '../components/ui';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import TopNavigation from '../components/TopNavigation';
import { 
  SparklesIcon, 
  ChartBarIcon, 
  DocumentTextIcon, 
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About Us - Dhivehinoos.net | Maldives' First AI News Site</title>
        <meta name="description" content="Learn about Dhivehinoos.net, Maldives' first fully autonomous AI news site. Discover how we gather sentiments from social media, analyze trends, and generate comprehensive news articles using advanced AI technology." />
        <meta name="keywords" content="about, Dhivehinoos, AI news, Maldives news, sentiment analysis, autonomous journalism, AI content generation" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Dhivehinoos.net" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dhivehinoos.net/about" />
        <meta property="og:title" content="About Us - Dhivehinoos.net | Maldives' First AI News Site" />
        <meta property="og:description" content="Learn about Dhivehinoos.net, Maldives' first fully autonomous AI news site. Discover how we gather sentiments from social media, analyze trends, and generate comprehensive news articles using advanced AI technology." />
        <meta property="og:site_name" content="Dhivehinoos.net" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:url" content="https://dhivehinoos.net/about" />
        <meta property="twitter:title" content="About Us - Dhivehinoos.net | Maldives' First AI News Site" />
        <meta property="twitter:description" content="Learn about Dhivehinoos.net, Maldives' first fully autonomous AI news site. Discover how we gather sentiments from social media, analyze trends, and generate comprehensive news articles using advanced AI technology." />
      </Helmet>

      {/* Top Navigation */}
      <TopNavigation 
        onSearch={() => {}}
        searchQuery=""
        setSearchQuery={() => {}}
        selectedCategory={null}
      />

      <Box className="bg-gray-50 min-h-screen">
        <Container className="max-w-5xl py-12">
          <VStack spacing={10} align="stretch">
            {/* Hero Section - News Agency Style */}
            <Box className="text-center border-b-4 border-brand-600 pb-8 mb-8">
              <Heading 
                size="3xl" 
                className="mb-4 text-gray-900 font-bold"
                style={{ 
                  fontFamily: 'Georgia, serif',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.2'
                }}
              >
                About Dhivehinoos.net
              </Heading>
              <Box className="w-24 h-1 bg-red-600 mx-auto mb-4"></Box>
              <Text 
                size="xl" 
                className="text-gray-800 font-semibold mb-3"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Maldives' First Fully Autonomous AI News Agency
              </Text>
              <Text 
                className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Transforming how news is gathered, analyzed, and delivered through cutting-edge artificial intelligence
              </Text>
            </Box>

            {/* Main Content - News Agency Style */}
            <Box className="bg-white shadow-lg rounded-sm border border-gray-200 p-8 md:p-12">
              <VStack spacing={10} align="stretch">
                {/* Introduction */}
                <Box>
                  <Heading 
                    size="xl" 
                    className="mb-6 text-gray-900 border-b-2 border-gray-300 pb-3"
                    style={{ 
                      fontFamily: 'Georgia, serif',
                      fontWeight: 700
                    }}
                  >
                    How We Work
                  </Heading>
                  <Text 
                    className="text-gray-800 leading-relaxed text-lg mb-6"
                    style={{ 
                      fontFamily: 'Georgia, serif',
                      fontSize: '18px',
                      lineHeight: '1.8'
                    }}
                  >
                    Dhivehinoos.net represents a revolutionary approach to news gathering and content creation. 
                    As Maldives' first fully autonomous AI news site, we leverage advanced artificial intelligence 
                    to monitor, analyze, and synthesize the pulse of Maldivian social media and online discourse.
                  </Text>
                  <Text 
                    className="text-gray-800 leading-relaxed text-lg"
                    style={{ 
                      fontFamily: 'Georgia, serif',
                      fontSize: '18px',
                      lineHeight: '1.8'
                    }}
                  >
                    Our platform continuously gathers sentiments, discussions, and trending topics from across 
                    Maldivian social media platforms, news sources, and online communities. We then use sophisticated 
                    AI algorithms to synthesize this information into comprehensive, well-structured articles that 
                    reflect the collective voice and concerns of the Maldivian people.
                  </Text>
                </Box>

                <Box className="border-t border-gray-300 pt-8"></Box>

                {/* AI Capabilities */}
                <Box>
                  <Heading 
                    size="xl" 
                    className="mb-8 text-gray-900 border-b-2 border-gray-300 pb-3"
                    style={{ 
                      fontFamily: 'Georgia, serif',
                      fontWeight: 700
                    }}
                  >
                    Our Autonomous AI System
                  </Heading>
                  <VStack spacing={6} align="stretch">
                    {/* Data Gathering */}
                    <Box className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-sm">
                      <HStack spacing={4} align="start">
                        <Box className="flex-shrink-0 bg-blue-600 p-3 rounded-full">
                          <ChartBarIcon className="h-6 w-6 text-white" />
                        </Box>
                        <Box className="flex-1">
                          <Heading 
                            size="lg" 
                            className="mb-3 text-gray-900"
                            style={{ 
                              fontFamily: 'Georgia, serif',
                              fontWeight: 700
                            }}
                          >
                            Intelligent Data Gathering
                          </Heading>
                          <Text 
                            className="text-gray-800 leading-relaxed"
                            style={{ 
                              fontFamily: 'Georgia, serif',
                              fontSize: '17px',
                              lineHeight: '1.75'
                            }}
                          >
                            Our AI system continuously monitors and collects data from multiple Maldivian social 
                            media platforms, news outlets, forums, and online communities. This comprehensive 
                            data gathering ensures we capture the full spectrum of public sentiment and trending 
                            discussions across the Maldives.
                          </Text>
                        </Box>
                      </HStack>
                    </Box>

                    {/* Sentiment Analysis */}
                    <Box className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded-sm">
                      <HStack spacing={4} align="start">
                        <Box className="flex-shrink-0 bg-purple-600 p-3 rounded-full">
                          <SparklesIcon className="h-6 w-6 text-white" />
                        </Box>
                        <Box className="flex-1">
                          <Heading 
                            size="lg" 
                            className="mb-3 text-gray-900"
                            style={{ 
                              fontFamily: 'Georgia, serif',
                              fontWeight: 700
                            }}
                          >
                            Advanced Sentiment Analysis
                          </Heading>
                          <Text 
                            className="text-gray-800 leading-relaxed mb-3"
                            style={{ 
                              fontFamily: 'Georgia, serif',
                              fontSize: '17px',
                              lineHeight: '1.75'
                            }}
                          >
                            Using state-of-the-art natural language processing, our AI analyzes the emotional 
                            tone, sentiment, and key themes from user-generated content. This allows us to 
                            understand not just what people are discussing, but how they feel about it, 
                            providing deeper insights into public opinion and emerging trends.
                          </Text>
                          <Box className="bg-white border-l-4 border-red-600 p-4 mt-3 rounded-sm">
                            <Text 
                              className="text-gray-800 leading-relaxed font-medium"
                              style={{ 
                                fontFamily: 'Georgia, serif',
                                fontSize: '17px',
                                lineHeight: '1.75'
                              }}
                            >
                              The source fragments produced by this sentiment analysis form the real foundation 
                              and basis of every generated story. These fragments capture the authentic voice 
                              and sentiment of the Maldivian people, ensuring our content truly reflects public 
                              opinion and discourse.
                            </Text>
                          </Box>
                        </Box>
                      </HStack>
                    </Box>

                    {/* Article Generation */}
                    <Box className="bg-green-50 border-l-4 border-green-600 p-6 rounded-sm">
                      <HStack spacing={4} align="start">
                        <Box className="flex-shrink-0 bg-green-600 p-3 rounded-full">
                          <DocumentTextIcon className="h-6 w-6 text-white" />
                        </Box>
                        <Box className="flex-1">
                          <Heading 
                            size="lg" 
                            className="mb-3 text-gray-900"
                            style={{ 
                              fontFamily: 'Georgia, serif',
                              fontWeight: 700
                            }}
                          >
                            AI-Powered Article Generation
                          </Heading>
                          <Text 
                            className="text-gray-800 leading-relaxed"
                            style={{ 
                              fontFamily: 'Georgia, serif',
                              fontSize: '17px',
                              lineHeight: '1.75'
                            }}
                          >
                            Our sophisticated AI writing system synthesizes the gathered data and sentiment 
                            analysis into well-structured, comprehensive articles. Each article is crafted to 
                            accurately represent the collective views and discussions from Maldivian social media, 
                            presenting them in a clear, engaging, and informative format.
                          </Text>
                        </Box>
                      </HStack>
                    </Box>

                    {/* Image Generation */}
                    <Box className="bg-orange-50 border-l-4 border-orange-600 p-6 rounded-sm">
                      <HStack spacing={4} align="start">
                        <Box className="flex-shrink-0 bg-orange-600 p-3 rounded-full">
                          <PhotoIcon className="h-6 w-6 text-white" />
                        </Box>
                        <Box className="flex-1">
                          <Heading 
                            size="lg" 
                            className="mb-3 text-gray-900"
                            style={{ 
                              fontFamily: 'Georgia, serif',
                              fontWeight: 700
                            }}
                          >
                            Automated Image Generation
                          </Heading>
                          <Text 
                            className="text-gray-800 leading-relaxed"
                            style={{ 
                              fontFamily: 'Georgia, serif',
                              fontSize: '17px',
                              lineHeight: '1.75'
                            }}
                          >
                            To complement our articles, our AI system automatically generates relevant, 
                            contextually appropriate images using advanced image generation technology. 
                            These visuals are created to match the content and enhance the reader's 
                            understanding and engagement with each story.
                          </Text>
                        </Box>
                      </HStack>
                    </Box>
                  </VStack>
                </Box>

                <Box className="border-t border-gray-300 pt-8"></Box>

                {/* Comprehensive System */}
                <Box>
                  <Heading 
                    size="xl" 
                    className="mb-6 text-gray-900 border-b-2 border-gray-300 pb-3"
                    style={{ 
                      fontFamily: 'Georgia, serif',
                      fontWeight: 700
                    }}
                  >
                    A Truly Autonomous News Agency
                  </Heading>
                  <Text 
                    className="text-gray-800 leading-relaxed text-lg mb-6"
                    style={{ 
                      fontFamily: 'Georgia, serif',
                      fontSize: '18px',
                      lineHeight: '1.8'
                    }}
                  >
                    Beyond sentiment analysis and article generation, our autonomous system incorporates 
                    extensive Maldives context information nodes, sophisticated image styling guidelines, 
                    comprehensive content generation protocols, and many other integrated components that 
                    work together seamlessly to make this a truly autonomous and successful news operation.
                  </Text>
                  <Box className="bg-red-50 border-l-4 border-red-600 p-6 mb-6 rounded-sm">
                    <Text 
                      className="text-gray-900 leading-relaxed text-lg font-semibold"
                      style={{ 
                        fontFamily: 'Georgia, serif',
                        fontSize: '18px',
                        lineHeight: '1.8'
                      }}
                    >
                      Dhivehinoos.net is Maldives' first fully autonomous news agency—a 
                      complete one-stop solution for news. Our system automatically distributes content across 
                      multiple platforms including Telegram, WhatsApp, Discord, and more, ensuring that news 
                      reaches audiences wherever they are, whenever they need it.
                    </Text>
                  </Box>
                  <Text 
                    className="text-gray-800 leading-relaxed text-lg"
                    style={{ 
                      fontFamily: 'Georgia, serif',
                      fontSize: '18px',
                      lineHeight: '1.8'
                    }}
                  >
                    This is not just a news website—it's a true news agency, fully autonomous, operating 
                    24/7 to capture, analyze, and deliver the pulse of Maldivian society through the power 
                    of artificial intelligence.
                  </Text>
                </Box>

                <Box className="border-t border-gray-300 pt-8"></Box>

                {/* Quality & Feedback */}
                <Box className="bg-indigo-50 border-l-4 border-indigo-600 p-8 rounded-sm">
                  <Heading 
                    size="lg" 
                    className="mb-4 text-gray-900"
                    style={{ 
                      fontFamily: 'Georgia, serif',
                      fontWeight: 700
                    }}
                  >
                    Continuous Improvement Through Your Feedback
                  </Heading>
                  <Text 
                    className="text-gray-800 leading-relaxed text-lg mb-4"
                    style={{ 
                      fontFamily: 'Georgia, serif',
                      fontSize: '18px',
                      lineHeight: '1.8'
                    }}
                  >
                    As with any advanced AI system, from time to time there may be artifacts in generated 
                    images or some inconsistencies in content. We are committed to continuous improvement 
                    and value your input immensely.
                  </Text>
                  <Text 
                    className="text-gray-800 leading-relaxed text-lg mb-4"
                    style={{ 
                      fontFamily: 'Georgia, serif',
                      fontSize: '18px',
                      lineHeight: '1.8'
                    }}
                  >
                    <strong>We encourage you to comment, guide us, and share your feedback.</strong> Any 
                    help, suggestions, or constructive criticism is greatly appreciated. Your observations 
                    help us refine our algorithms, improve our context understanding, and enhance the 
                    overall quality of our autonomous news generation system.
                  </Text>
                  <Text 
                    className="text-gray-800 leading-relaxed text-lg"
                    style={{ 
                      fontFamily: 'Georgia, serif',
                      fontSize: '18px',
                      lineHeight: '1.8'
                    }}
                  >
                    Together, we can build the most accurate, comprehensive, and reliable autonomous news 
                    platform for the Maldives. Your voice and feedback are essential to this mission.
                  </Text>
                </Box>

                <Box className="border-t border-gray-300 pt-8"></Box>

                {/* Human Touch */}
                <Box className="bg-yellow-50 border-l-4 border-yellow-600 p-8 rounded-sm">
                  <HStack spacing={4} align="start">
                    <Box className="flex-shrink-0 bg-yellow-600 p-3 rounded-full">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                    </Box>
                    <Box className="flex-1">
                      <Heading 
                        size="lg" 
                        className="mb-4 text-gray-900"
                        style={{ 
                          fontFamily: 'Georgia, serif',
                          fontWeight: 700
                        }}
                      >
                        Human Connection in Comments
                      </Heading>
                      <Text 
                        className="text-gray-800 leading-relaxed text-lg mb-4"
                        style={{ 
                          fontFamily: 'Georgia, serif',
                          fontSize: '18px',
                          lineHeight: '1.8'
                        }}
                      >
                        While our content generation is fully automated, we believe in the importance of 
                        human connection and engagement. <strong>All comments on our articles are reviewed 
                        and responded to by real human moderators and writers.</strong> We value your 
                        feedback, questions, and perspectives, and we're committed to maintaining a 
                        meaningful dialogue with our readers.
                      </Text>
                      <Text 
                        className="text-gray-800 leading-relaxed text-lg"
                        style={{ 
                          fontFamily: 'Georgia, serif',
                          fontSize: '18px',
                          lineHeight: '1.8'
                        }}
                      >
                        Your voice matters to us. Whether you have questions about our articles, want to 
                        share additional insights, or simply want to engage in discussion, our team is here 
                        to respond and interact with you personally.
                      </Text>
                    </Box>
                  </HStack>
                </Box>

                <Box className="border-t border-gray-300 pt-8"></Box>

                {/* Call to Action */}
                <Box className="text-center">
                  <Heading 
                    size="xl" 
                    className="mb-6 text-gray-900 border-b-2 border-gray-300 pb-3"
                    style={{ 
                      fontFamily: 'Georgia, serif',
                      fontWeight: 700
                    }}
                  >
                    Get in Touch
                  </Heading>
                  <Text 
                    className="text-gray-800 leading-relaxed text-lg mb-6 max-w-3xl mx-auto"
                    style={{ 
                      fontFamily: 'Georgia, serif',
                      fontSize: '18px',
                      lineHeight: '1.8'
                    }}
                  >
                    We're always looking to improve and expand our coverage. Whether you're a reader with 
                    feedback, a journalist interested in our technology, a researcher studying AI in media, 
                    or someone with ideas for collaboration, we'd love to hear from you. Your insights help 
                    us better understand the needs of the Maldivian community and refine our AI systems to 
                    serve you better.
                  </Text>
                  <Text 
                    className="text-gray-800 leading-relaxed text-lg mb-8 max-w-3xl mx-auto"
                    style={{ 
                      fontFamily: 'Georgia, serif',
                      fontSize: '18px',
                      lineHeight: '1.8'
                    }}
                  >
                    Have a story idea? Noticed something we should cover? Want to learn more about our 
                    technology? Or simply want to share your thoughts? Reach out to us—we're here to listen 
                    and engage.
                  </Text>
                  
                  {/* Contact Email Display */}
                  <Box className="bg-blue-50 border-l-4 border-blue-600 p-6 max-w-[450px] mx-auto mb-8 rounded-sm">
                    <HStack spacing={3} justify="center" className="mb-3">
                      <EnvelopeIcon className="h-6 w-6 text-blue-600" />
                      <Text 
                        className="font-semibold text-blue-800 text-lg"
                        style={{ fontFamily: 'Georgia, serif' }}
                      >
                        Contact us directly:
                      </Text>
                    </HStack>
                    <a 
                      href="mailto:emaildym@proton.me"
                      className="text-blue-700 font-bold text-xl hover:text-blue-900 hover:underline block text-center"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      emaildym@proton.me
                    </a>
                  </Box>

                  <HStack spacing={4} justify="center" wrap="wrap">
                    <Button
                      as={Link}
                      to="/contact"
                      colorScheme="brand"
                      size="lg"
                      leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                      className="px-10 py-6 text-lg font-semibold"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      Contact Us
                    </Button>
                    <Button
                      as={Link}
                      to="/"
                      variant="outline"
                      size="lg"
                      className="px-10 py-6 text-lg font-semibold border-2"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      Explore Articles
                    </Button>
                  </HStack>
                </Box>
              </VStack>
            </Box>

            {/* Mission Statement - News Agency Footer Style */}
            <Box className="bg-white border-t-4 border-gray-900 shadow-lg rounded-sm p-8 md:p-12">
              <VStack spacing={6} align="stretch">
                <Heading 
                  size="xl" 
                  className="text-gray-900 text-center border-b-2 border-gray-300 pb-4 mb-6"
                  style={{ 
                    fontFamily: 'Georgia, serif',
                    fontWeight: 700
                  }}
                >
                  Our Mission
                </Heading>
                <Text 
                  className="text-gray-800 leading-relaxed text-center text-lg"
                  style={{ 
                    fontFamily: 'Georgia, serif',
                    fontSize: '19px',
                    lineHeight: '1.9'
                  }}
                >
                  At Dhivehinoos.net, our mission is to democratize news gathering and make information 
                  more accessible by leveraging the power of artificial intelligence. We aim to capture 
                  the authentic voice of the Maldivian people by synthesizing the vast amount of 
                  user-generated content and discussions happening across social media platforms. 
                  Through our fully autonomous system, we provide timely, comprehensive coverage that 
                  reflects the real sentiments and concerns of the community.
                </Text>
                <Box className="bg-red-50 border-l-4 border-red-600 p-6 my-4 rounded-sm">
                  <Text 
                    className="text-gray-900 leading-relaxed text-lg font-semibold"
                    style={{ 
                      fontFamily: 'Georgia, serif',
                      fontSize: '19px',
                      lineHeight: '1.9'
                    }}
                  >
                    We are Maldives' first fully autonomous news agency—a true one-stop 
                    news solution that operates independently, gathering data, analyzing sentiment, 
                    generating articles and images, and distributing content across multiple platforms 
                    automatically. This is not just a website; it's a complete, autonomous news operation 
                    dedicated to serving the Maldivian people.
                  </Text>
                </Box>
                <Text 
                  className="text-gray-800 leading-relaxed text-center text-lg"
                  style={{ 
                    fontFamily: 'Georgia, serif',
                    fontSize: '19px',
                    lineHeight: '1.9'
                  }}
                >
                  We believe that by combining advanced AI technology with human oversight and engagement, 
                  we can create a new model for news that is both efficient and deeply connected to the 
                  communities we serve.
                </Text>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>
    </>
  );
};

export default AboutPage;

