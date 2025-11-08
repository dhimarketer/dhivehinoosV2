import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  Input,
  Textarea,
  Button,
  Alert,
  FormControl,
  FormLabel,
  HStack,
} from '../components/ui';
import { Helmet } from 'react-helmet-async';
import { contactAPI, settingsAPI } from '../services/api';
import TopNavigation from '../components/TopNavigation';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [contactEmail, setContactEmail] = useState('emaildym@proton.me');

  useEffect(() => {
    const fetchContactEmail = async () => {
      try {
        const response = await settingsAPI.getPublic();
        if (response.data.contact_email) {
          setContactEmail(response.data.contact_email);
        }
      } catch (error) {
        console.error('Error fetching contact email:', error);
        // Keep default email if fetch fails
      }
    };
    
    fetchContactEmail();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message.trim()) return;

    setIsSubmitting(true);
    try {
      await contactAPI.create(formData);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
      console.error('Error submitting contact form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <Helmet>
        <title>Contact Us - Dhivehinoos.net</title>
        <meta name="description" content="Get in touch with Dhivehinoos.net. Contact us for questions about our AI-generated fictional content for research purposes." />
        <meta name="keywords" content="contact, Dhivehinoos, AI content, research, fictional stories" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Dhivehinoos.net" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dhivehinoos.net/contact" />
        <meta property="og:title" content="Contact Us - Dhivehinoos.net" />
        <meta property="og:description" content="Get in touch with Dhivehinoos.net. Contact us for questions about our AI-generated fictional content for research purposes." />
        <meta property="og:site_name" content="Dhivehinoos.net" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:url" content="https://dhivehinoos.net/contact" />
        <meta property="twitter:title" content="Contact Us - Dhivehinoos.net" />
        <meta property="twitter:description" content="Get in touch with Dhivehinoos.net. Contact us for questions about our AI-generated fictional content for research purposes." />
      </Helmet>

      {/* Top Navigation */}
      <TopNavigation 
        onSearch={() => {}}
        searchQuery=""
        setSearchQuery={() => {}}
        selectedCategory={null}
      />

      <Container className="max-w-3xl py-8">
        <Card>
          <CardBody>
            <VStack spacing={8} align="stretch">
              <Box className="text-center">
                <Heading size="xl" className="mb-4">
                  Get in Touch
                </Heading>
                <Text className="text-gray-600 mb-4">
                  We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                </Text>
                
                {/* Contact Email Display */}
                <Card className="bg-blue-50 border border-blue-200 max-w-[400px] mx-auto">
                  <CardBody>
                    <HStack spacing={3} justify="center">
                      <EnvelopeIcon className="h-5 w-5 text-blue-500" />
                      <Text className="font-medium text-blue-700">
                        Contact us directly:
                      </Text>
                    </HStack>
                    <a 
                      href={`mailto:${contactEmail}`}
                      className="text-blue-600 font-semibold text-lg hover:text-blue-800 hover:underline block mt-2"
                    >
                      {contactEmail}
                    </a>
                  </CardBody>
                </Card>
              </Box>

              {/* About Section with Disclaimer */}
              <Box>
                <Heading size="lg" className="mb-4 text-blue-600">
                  About Dhivehinoos.net
                </Heading>
                <Card className="bg-yellow-50 border border-yellow-200">
                  <CardBody>
                    <Text className="text-base text-gray-700 leading-relaxed">
                      <strong>Important Disclaimer:</strong> This website aggregates and synthesizes sentiments, discussions, and trending topics from across Maldivian social media platforms and news sources. 
                      All content published on Dhivehinoos.net is <strong>AI-generated based on aggregated social media sentiments and news discussions</strong> from various Maldivian online communities, 
                      news outlets, and social platforms. The articles and stories are created using artificial intelligence to synthesize and present these aggregated sentiments 
                      in a readable format for research, entertainment, and educational purposes.
                    </Text>
                    <Text className="text-base text-gray-700 mt-3 leading-relaxed">
                      This disclaimer is provided to comply with government registration guidelines and to ensure transparency about the nature of our content. 
                      While our content is based on real social media discussions and news sentiments from Maldivian sources, readers should not rely on any information 
                      from this site as direct factual news reporting or current events coverage.
                    </Text>
                  </CardBody>
                </Card>
              </Box>

              {submitStatus === 'success' && (
                <Alert status="success">
                  Thank you for your message! We'll get back to you soon.
                </Alert>
              )}

              {submitStatus === 'error' && (
                <Alert status="error">
                  Sorry, there was an error sending your message. Please try again.
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <VStack spacing={6}>
                  <FormControl>
                    <FormLabel>Name (optional)</FormLabel>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Email (optional)</FormLabel>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Message</FormLabel>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Write your message here..."
                      rows={6}
                      required
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting || !formData.message.trim()}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </VStack>
              </form>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </>
  );
};

export default ContactPage;
