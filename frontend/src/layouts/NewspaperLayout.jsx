// Newspaper Style Layout - Traditional newspaper multi-column
import { Box, Container, Grid, GridItem, Divider } from '@chakra-ui/react';

/**
 * Newspaper Layout - Traditional newspaper style
 * Features: Multi-column layout, dense information, black/white/gray colors
 */
export const NewspaperLayout = ({ children, featuredArticle, articles, settings }) => {
  return (
    <Container maxW="7xl" py={{ base: 4, md: 6 }}>
      <Box
        borderWidth="2px"
        borderColor="gray.900"
        p={{ base: 4, md: 6 }}
        bg="white"
      >
        {/* Newspaper-style header border */}
        <Box
          borderBottomWidth="3px"
          borderBottomColor="gray.900"
          pb={2}
          mb={6}
        />
        
        <Grid
          templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
          gap={6}
        >
          {children}
        </Grid>
      </Box>
    </Container>
  );
};

export default NewspaperLayout;


