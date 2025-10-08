import React, { useState } from 'react';
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
  AlertIcon,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { Helmet } from 'react-helmet-async';
import { contactAPI } from '../services/api';
import TopNavigation from '../components/TopNavigation';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

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
      />

      <Container maxW="container.md" py={8}>
        <Card>
          <CardBody>
            <VStack spacing={8} align="stretch">
              <Box textAlign="center">
                <Heading size="xl" mb={4}>
                  Get in Touch
                </Heading>
                <Text color="gray.600">
                  We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                </Text>
              </Box>

              {/* About Section with Disclaimer */}
              <Box>
                <Heading size="lg" mb={4} color="blue.600">
                  About Dhivehinoos.net
                </Heading>
                <Card bg="yellow.50" borderColor="yellow.200" borderWidth="1px">
                  <CardBody>
                    <Text fontSize="md" color="gray.700" lineHeight="1.6">
                      <strong>Important Disclaimer:</strong> This website is <strong>NOT a news site</strong> and does not provide factual news reporting. 
                      All content published on Dhivehinoos.net consists of <strong>AI-generated fictional material created for research purposes only</strong>. 
                      The articles, stories, and content are generated using artificial intelligence and are intended solely for academic research, 
                      entertainment, and educational purposes.
                    </Text>
                    <Text fontSize="md" color="gray.700" mt={3} lineHeight="1.6">
                      This disclaimer is provided to comply with government registration guidelines and to ensure transparency about the nature of our content. 
                      Readers should not rely on any information from this site as factual news or current events reporting.
                    </Text>
                  </CardBody>
                </Card>
              </Box>

              {submitStatus === 'success' && (
                <Alert status="success">
                  <AlertIcon />
                  Thank you for your message! We'll get back to you soon.
                </Alert>
              )}

              {submitStatus === 'error' && (
                <Alert status="error">
                  <AlertIcon />
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
                    colorScheme="blue"
                    size="lg"
                    isLoading={isSubmitting}
                    loadingText="Sending..."
                    isDisabled={!formData.message.trim()}
                  >
                    Send Message
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
