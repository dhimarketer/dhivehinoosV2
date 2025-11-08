// Magazine Layout - Bold, visual, asymmetric layouts
import { Box, Container, Grid, GridItem, VStack } from '@chakra-ui/react';

/**
 * Magazine Layout - Bold and visual
 * Features: Large featured images, asymmetric layouts, bold typography
 */
export const MagazineLayout = ({ children, featuredArticle, articles, settings }) => {
  return (
    <Container maxW="7xl" py={{ base: 6, md: 12 }}>
      <Grid
        templateColumns={{ base: '1fr', lg: '2fr 1fr' }}
        gap={8}
        mb={12}
      >
        {/* Main Featured Area - Larger */}
        <GridItem>
          {featuredArticle && (
            <Box mb={8}>
              {/* Featured article will be rendered here */}
            </Box>
          )}
        </GridItem>
        
        {/* Secondary Featured - Smaller */}
        <GridItem>
          <VStack spacing={6} align="stretch">
            {/* Secondary articles */}
          </VStack>
        </GridItem>
      </Grid>
      
      {/* Main Content Grid */}
      <Box>
        {children}
      </Box>
    </Container>
  );
};

export default MagazineLayout;

