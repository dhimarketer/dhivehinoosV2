import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import StoryCard from './components/StoryCard';

// Mock article data for testing
const mockArticle = {
  id: 1,
  title: "Government fiscal reforms yield MVR 3.4 Billion budget surplus",
  slug: "government-fiscal-reforms-yield-mvr-3-4-billion-budget-surplus",
  image_url: "https://via.placeholder.com/800x400/4A90E2/FFFFFF?text=Featured+News",
  created_at: "2025-01-15T10:30:00Z",
  vote_score: 42,
  approved_comments_count: 8
};

const mockArticle2 = {
  id: 2,
  title: "Nepalese man stabbed in Malé",
  slug: "nepalese-man-stabbed-in-male",
  image_url: "https://via.placeholder.com/400x200/E74C3C/FFFFFF?text=Breaking+News",
  created_at: "2025-01-15T15:45:00Z",
  vote_score: 15,
  approved_comments_count: 3
};

const mockArticle3 = {
  id: 3,
  title: "Maldives bans entry for Israeli passport holders in protest over Gaza conflict",
  slug: "maldives-bans-entry-for-israeli-passport-holders",
  image_url: "https://via.placeholder.com/400x200/27AE60/FFFFFF?text=Politics",
  created_at: "2025-01-15T07:43:00Z",
  vote_score: 28,
  approved_comments_count: 12
};

// Test component to showcase all variants
const StoryCardTest = () => {
  return (
    <ChakraProvider>
      <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '40px', color: '#2d3748' }}>
          Times of Addu Style Story Cards
        </h1>
        
        {/* Featured Article */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ marginBottom: '20px', color: '#4a5568' }}>Featured Article</h2>
          <StoryCard article={mockArticle} variant="featured" />
        </div>

        {/* Default Cards Grid */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ marginBottom: '20px', color: '#4a5568' }}>Default Cards</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '24px',
            justifyContent: 'center'
          }}>
            <StoryCard article={mockArticle2} variant="default" />
            <StoryCard article={mockArticle3} variant="default" />
          </div>
        </div>

        {/* Compact Cards */}
        <div>
          <h2 style={{ marginBottom: '20px', color: '#4a5568' }}>Compact Cards</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '16px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <StoryCard article={mockArticle} variant="compact" />
            <StoryCard article={mockArticle2} variant="compact" />
            <StoryCard article={mockArticle3} variant="compact" />
          </div>
        </div>
      </div>
    </ChakraProvider>
  );
};

export default StoryCardTest;
