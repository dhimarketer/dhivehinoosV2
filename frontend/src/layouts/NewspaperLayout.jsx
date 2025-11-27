import React from 'react';
import { Box, Container } from '../components/ui';

/**
 * NewspaperLayout - Traditional newspaper aesthetic layout
 * Features: 12-column grid, max-width 1240px, Main Content (8 cols) + Sidebar (4 cols)
 */
export const NewspaperLayout = ({ children, featuredArticle, articles, settings }) => {
  return (
    <Container maxW="newspaper" className="py-4 md:py-8">
      <div className="grid grid-cols-12 gap-6">
        {/* Main Content Area - 8 columns on desktop, full width on mobile */}
        <Box className="col-span-12 lg:col-span-8">
          {children}
        </Box>

        {/* Sidebar - 4 columns on desktop, full width on mobile */}
        <Box className="col-span-12 lg:col-span-4">
          {/* Sidebar content will be rendered by HomePage */}
        </Box>
      </div>
    </Container>
  );
};

export default NewspaperLayout;
