// Classic Blog Layout - Traditional blog with sidebar
import { Box, Container, Grid, GridItem, VStack } from '@chakra-ui/react';

/**
 * Classic Layout - Traditional blog style
 * Features: Main content area with sidebar, warm colors, serif fonts
 */
export const ClassicLayout = ({ children, featuredArticle, articles, settings }) => {
  return (
    <Container maxW="7xl" py={{ base: 4, md: 8 }}>
      <Grid
        templateColumns={{ base: '1fr', lg: '2fr 1fr' }}
        gap={8}
        alignItems="start"
      >
        {/* Main Content */}
        <GridItem>
          {children}
        </GridItem>
        
        {/* Sidebar */}
        <GridItem>
          <VStack spacing={6} align="stretch" position={{ lg: 'sticky' }} top={{ lg: 4 }}>
            {/* Sidebar content will be injected here via children or props */}
            <Box>
              {/* Sidebar ads, recent articles, etc. */}
            </Box>
          </VStack>
        </GridItem>
      </Grid>
    </Container>
  );
};

export default ClassicLayout;


