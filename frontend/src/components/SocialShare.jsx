import React, { useState } from 'react';
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  useColorModeValue,
  IconButton,
  Tooltip,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  Textarea,
  Divider,
} from '@chakra-ui/react';
import {
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaWhatsapp,
  FaTelegram,
  FaReddit,
  FaShare,
  FaCopy,
  FaEnvelope,
} from 'react-icons/fa';

const SocialShare = ({ article, variant = 'default' }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [emailData, setEmailData] = useState({ to: '', subject: '', message: '' });
  const toast = useToast();

  // Use social metadata from backend if available, otherwise fallback to manual construction
  const socialData = article.social_metadata || {
    url: `https://dhivehinoos.net/article/${article.slug}`,
    title: article.title,
    description: `${article.title} - AI-generated fictional content for research purposes`,
    image: article.image_url || 'https://dhivehinoos.net/static/favicon.svg',
  };

  const shareData = {
    url: socialData.url,
    title: socialData.title,
    text: socialData.description,
  };

  const handleShare = async (platform) => {
    try {
      switch (platform) {
        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(socialData.url)}`,
            '_blank',
            'width=600,height=400'
          );
          break;
        
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(socialData.url)}&text=${encodeURIComponent(socialData.title)}`,
            '_blank',
            'width=600,height=400'
          );
          break;
        
        case 'linkedin':
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(socialData.url)}`,
            '_blank',
            'width=600,height=400'
          );
          break;
        
        case 'whatsapp':
          window.open(
            `https://wa.me/?text=${encodeURIComponent(`${socialData.title} ${socialData.url}`)}`,
            '_blank'
          );
          break;
        
        case 'telegram':
          window.open(
            `https://t.me/share/url?url=${encodeURIComponent(socialData.url)}&text=${encodeURIComponent(socialData.title)}`,
            '_blank'
          );
          break;
        
        case 'reddit':
          window.open(
            `https://reddit.com/submit?url=${encodeURIComponent(socialData.url)}&title=${encodeURIComponent(socialData.title)}`,
            '_blank',
            'width=600,height=400'
          );
          break;
        
        case 'copy':
          await navigator.clipboard.writeText(socialData.url);
          toast({
            title: 'Link copied!',
            description: 'Article link has been copied to clipboard.',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
          break;
        
        case 'email':
          onOpen();
          break;
        
        case 'native':
          if (navigator.share) {
            await navigator.share(shareData);
          } else {
            // Fallback to copy if native sharing is not available
            await navigator.clipboard.writeText(socialData.url);
            toast({
              title: 'Link copied!',
              description: 'Article link has been copied to clipboard.',
              status: 'success',
              duration: 2000,
              isClosable: true,
            });
          }
          break;
        
        default:
          break;
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: 'Error',
        description: 'Failed to share. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEmailShare = () => {
    const subject = emailData.subject || socialData.title;
    const body = emailData.message || `Check out this article: ${socialData.title}\n\n${socialData.url}`;
    const mailtoUrl = `mailto:${emailData.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(mailtoUrl);
    onClose();
    setEmailData({ to: '', subject: '', message: '' });
    
    toast({
      title: 'Email opened!',
      description: 'Your email client should open with the article details.',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const buttonColor = useColorModeValue('gray.600', 'gray.300');
  const hoverColor = useColorModeValue('blue.500', 'blue.300');

  const socialButtons = [
    {
      platform: 'facebook',
      icon: FaFacebook,
      color: '#1877F2',
      label: 'Share on Facebook',
    },
    {
      platform: 'twitter',
      icon: FaTwitter,
      color: '#1DA1F2',
      label: 'Share on Twitter',
    },
    {
      platform: 'linkedin',
      icon: FaLinkedin,
      color: '#0077B5',
      label: 'Share on LinkedIn',
    },
    {
      platform: 'whatsapp',
      icon: FaWhatsapp,
      color: '#25D366',
      label: 'Share on WhatsApp',
    },
    {
      platform: 'telegram',
      icon: FaTelegram,
      color: '#0088CC',
      label: 'Share on Telegram',
    },
    {
      platform: 'reddit',
      icon: FaReddit,
      color: '#FF4500',
      label: 'Share on Reddit',
    },
  ];

  if (variant === 'compact') {
    return (
      <HStack spacing={2}>
        <Text fontSize="sm" color={buttonColor} fontWeight="medium">
          Share:
        </Text>
        {socialButtons.slice(0, 4).map(({ platform, icon: Icon, color, label }) => (
          <Tooltip key={platform} label={label} placement="top">
            <IconButton
              icon={<Icon />}
              size="sm"
              variant="ghost"
              color={buttonColor}
              _hover={{ color, bg: `${color}10` }}
              onClick={() => handleShare(platform)}
              aria-label={label}
            />
          </Tooltip>
        ))}
        <Tooltip label="Copy Link" placement="top">
          <IconButton
            icon={<FaCopy />}
            size="sm"
            variant="ghost"
            color={buttonColor}
            _hover={{ color: hoverColor, bg: `${hoverColor}10` }}
            onClick={() => handleShare('copy')}
            aria-label="Copy Link"
          />
        </Tooltip>
      </HStack>
    );
  }

  if (variant === 'minimal') {
    return (
      <HStack spacing={1}>
        {socialButtons.slice(0, 3).map(({ platform, icon: Icon, color, label }) => (
          <Tooltip key={platform} label={label} placement="top">
            <IconButton
              icon={<Icon />}
              size="xs"
              variant="ghost"
              color={buttonColor}
              _hover={{ color, bg: `${color}10` }}
              onClick={() => handleShare(platform)}
              aria-label={label}
            />
          </Tooltip>
        ))}
      </HStack>
    );
  }

  // Default variant - full social sharing
  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold" color={buttonColor}>
          Share this article
        </Text>
        
        {/* Main social platforms */}
        <HStack spacing={2} justify="center" flexWrap="wrap">
          {socialButtons.map(({ platform, icon: Icon, color, label }) => (
            <Tooltip key={platform} label={label} placement="top">
              <IconButton
                icon={<Icon />}
                size="lg"
                variant="outline"
                color={buttonColor}
                borderColor={buttonColor}
                _hover={{ 
                  color, 
                  borderColor: color,
                  bg: `${color}10`,
                  transform: 'translateY(-2px)',
                }}
                transition="all 0.2s ease"
                onClick={() => handleShare(platform)}
                aria-label={label}
              />
            </Tooltip>
          ))}
        </HStack>

        {/* Additional sharing options */}
        <HStack spacing={2} justify="center">
          <Button
            leftIcon={<FaShare />}
            size="sm"
            variant="outline"
            color={buttonColor}
            borderColor={buttonColor}
            _hover={{ color: hoverColor, borderColor: hoverColor }}
            onClick={() => handleShare('native')}
          >
            Share
          </Button>
          
          <Button
            leftIcon={<FaCopy />}
            size="sm"
            variant="outline"
            color={buttonColor}
            borderColor={buttonColor}
            _hover={{ color: hoverColor, borderColor: hoverColor }}
            onClick={() => handleShare('copy')}
          >
            Copy Link
          </Button>
          
          <Button
            leftIcon={<FaEnvelope />}
            size="sm"
            variant="outline"
            color={buttonColor}
            borderColor={buttonColor}
            _hover={{ color: hoverColor, borderColor: hoverColor }}
            onClick={() => handleShare('email')}
          >
            Email
          </Button>
        </HStack>
      </VStack>

      {/* Email Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Share via Email</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Input
                placeholder="Recipient email address"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
              />
              <Input
                placeholder="Subject (optional)"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              />
              <Textarea
                placeholder="Message (optional)"
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                rows={4}
              />
              <Divider />
              <HStack spacing={2}>
                <Button onClick={onClose} variant="outline">
                  Cancel
                </Button>
                <Button 
                  colorScheme="blue" 
                  onClick={handleEmailShare}
                  isDisabled={!emailData.to}
                >
                  Open Email Client
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SocialShare;
