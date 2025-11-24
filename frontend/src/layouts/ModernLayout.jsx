// Modern News Layout - Current style, clean and modern
import { Box, Container } from '@chakra-ui/react';

/**
 * Modern Layout - Current style
 * Features: Featured article at top, grid below, clean spacing
 */
export const ModernLayout = ({ children, featuredArticle, articles, settings }) => {
  return (
    <Container maxW="7xl" py={{ base: 4, md: 8 }}>
      {children}
    </Container>
  );
};

export default ModernLayout;



