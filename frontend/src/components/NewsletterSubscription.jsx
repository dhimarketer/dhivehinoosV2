import React, { useState } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  Alert,
  FormControl,
  FormLabel,
  FormHelperText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Divider,
  Badge,
  IconButton,
  Tooltip
} from './ui';
import { useToast } from '../contexts/ToastContext';
import { useDisclosure } from '../hooks/useDisclosure';
import api from '../services/api';

const NewsletterSubscription = ({ variant = 'default', showTitle = true }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/subscriptions/subscribe/', {
        email: email,
        first_name: firstName,
        last_name: lastName,
        source: 'website'
      });

      setSubscribed(true);
      toast({
        title: 'Successfully subscribed!',
        description: 'Thank you for subscribing to our newsletter',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setEmail('');
      setFirstName('');
      setLastName('');
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Subscription failed',
        description: error.response?.data?.email?.[0] || 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <Box className="p-6 bg-green-50 rounded-lg border border-green-200">
        <VStack spacing={4}>
          <Badge colorScheme="green" size="sm" className="px-3 py-1 rounded-full">
            ✓ Subscribed Successfully
          </Badge>
          <Text size="sm" className="text-green-700 text-center">
            Thank you for subscribing! You'll receive our latest articles and updates.
          </Text>
        </VStack>
      </Box>
    );
  }

  if (variant === 'modal') {
    return (
      <>
        <Button onClick={onOpen} colorScheme="brand" variant="outline" size="sm">
          📧 Subscribe to Newsletter
        </Button>
        
        <Modal isOpen={isOpen} onClose={onClose} size="md">
          <ModalContent className="p-6">
            <ModalHeader>Subscribe to Newsletter</ModalHeader>
            <ModalCloseButton onClose={onClose} />
            <ModalBody className="pb-6">
              <form onSubmit={handleSubscribe}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Email Address</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                    <FormHelperText>
                      We'll never share your email with anyone else.
                    </FormHelperText>
                  </FormControl>
                  
                  <HStack spacing={4} className="w-full">
                    <FormControl>
                      <FormLabel>First Name (Optional)</FormLabel>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Last Name (Optional)</FormLabel>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                      />
                    </FormControl>
                  </HStack>
                  
                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Subscribing...' : 'Subscribe to Newsletter'}
                  </Button>
                </VStack>
              </form>
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  }

  if (variant === 'inline') {
    return (
      <Box className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <VStack spacing={4}>
          {showTitle && (
            <Text size="lg" className="font-semibold text-blue-800">
              📧 Stay Updated
            </Text>
          )}
          <Text size="sm" className="text-blue-700 text-center">
            Get the latest Dhivehi articles and cultural insights delivered to your inbox.
          </Text>
          
          <form onSubmit={handleSubscribe} className="w-full">
            <VStack spacing={3}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                size="md"
                className="bg-white"
              />
              <Button
                type="submit"
                colorScheme="brand"
                size="md"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    );
  }

  // Default variant - sidebar style
  return (
    <Box className="p-6 bg-gray-50 rounded-lg border border-gray-200">
      <VStack spacing={4} align="stretch">
        {showTitle && (
          <Text size="lg" className="font-semibold text-gray-800">
            📧 Newsletter
          </Text>
        )}
        
        <Text size="sm" className="text-gray-600">
          Subscribe to get the latest Dhivehi articles and cultural insights delivered to your inbox.
        </Text>
        
        <form onSubmit={handleSubscribe}>
          <VStack spacing={3}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              size="sm"
              className="bg-white"
            />
            
            <HStack spacing={2} className="w-full">
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                size="sm"
                className="bg-white"
              />
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                size="sm"
                className="bg-white"
              />
            </HStack>
            
            <Button
              type="submit"
              colorScheme="brand"
              size="sm"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </VStack>
        </form>
        
        <Divider />
        
        <VStack spacing={2}>
          <Text size="xs" className="text-gray-500 text-center">
            RSS Feeds Available
          </Text>
          <HStack spacing={2}>
            <Tooltip label="RSS Feed">
              <IconButton
                size="xs"
                icon={<span>📡</span>}
                onClick={() => window.open('/api/v1/articles/rss/', '_blank')}
                aria-label="RSS Feed"
              />
            </Tooltip>
            <Tooltip label="Atom Feed">
              <IconButton
                size="xs"
                icon={<span>⚛️</span>}
                onClick={() => window.open('/api/v1/articles/atom/', '_blank')}
                aria-label="Atom Feed"
              />
            </Tooltip>
          </HStack>
        </VStack>
      </VStack>
    </Box>
  );
};

export default NewsletterSubscription;
