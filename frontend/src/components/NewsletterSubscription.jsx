import React, { useState } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  useToast,
  FormControl,
  FormLabel,
  FormHelperText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Badge,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import api from '../services/api';

const NewsletterSubscription = ({ variant = 'default', showTitle = true }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const toast = useToast();
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
      <Box p={6} bg="green.50" borderRadius="md" border="1px" borderColor="green.200">
        <VStack spacing={4}>
          <Badge colorScheme="green" fontSize="sm" px={3} py={1} borderRadius="full">
            ✓ Subscribed Successfully
          </Badge>
          <Text fontSize="sm" color="green.700" textAlign="center">
            Thank you for subscribing! You'll receive our latest articles and updates.
          </Text>
        </VStack>
      </Box>
    );
  }

  if (variant === 'modal') {
    return (
      <>
        <Button onClick={onOpen} colorScheme="blue" variant="outline" size="sm">
          📧 Subscribe to Newsletter
        </Button>
        
        <Modal isOpen={isOpen} onClose={onClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Subscribe to Newsletter</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
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
                  
                  <HStack spacing={4} w="full">
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
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    isLoading={loading}
                    loadingText="Subscribing..."
                  >
                    Subscribe to Newsletter
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
      <Box p={4} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
        <VStack spacing={4}>
          {showTitle && (
            <Text fontSize="lg" fontWeight="semibold" color="blue.800">
              📧 Stay Updated
            </Text>
          )}
          <Text fontSize="sm" color="blue.700" textAlign="center">
            Get the latest Dhivehi articles and cultural insights delivered to your inbox.
          </Text>
          
          <form onSubmit={handleSubscribe} style={{ width: '100%' }}>
            <VStack spacing={3}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                size="md"
                bg="white"
              />
              <Button
                type="submit"
                colorScheme="blue"
                size="md"
                w="full"
                isLoading={loading}
                loadingText="Subscribing..."
              >
                Subscribe
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    );
  }

  // Default variant - sidebar style
  return (
    <Box p={6} bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
      <VStack spacing={4} align="stretch">
        {showTitle && (
          <Text fontSize="lg" fontWeight="semibold" color="gray.800">
            📧 Newsletter
          </Text>
        )}
        
        <Text fontSize="sm" color="gray.600">
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
              bg="white"
            />
            
            <HStack spacing={2} w="full">
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                size="sm"
                bg="white"
              />
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                size="sm"
                bg="white"
              />
            </HStack>
            
            <Button
              type="submit"
              colorScheme="blue"
              size="sm"
              w="full"
              isLoading={loading}
              loadingText="Subscribing..."
            >
              Subscribe
            </Button>
          </VStack>
        </form>
        
        <Divider />
        
        <VStack spacing={2}>
          <Text fontSize="xs" color="gray.500" textAlign="center">
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
