// Minimal Clean Layout - Lots of whitespace, simple design
import { Box, Container, VStack } from '@chakra-ui/react';

/**
 * Minimal Layout - Clean and minimal
 * Features: Lots of whitespace, simple typography, focus on content
 */
export const MinimalLayout = ({ children, featuredArticle, articles, settings }) => {
  return (
    <Container maxW="4xl" py={{ base: 8, md: 16 }}>
      <VStack spacing={12} align="stretch">
        {children}
      </VStack>
    </Container>
  );
};

export default MinimalLayout;



