import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import StoryCard from '../components/StoryCard'

const mockArticle = {
  id: 1,
  title: 'Test Article Title',
  content: 'This is a test article content that should be displayed in the card.',
  slug: 'test-article-title',
  image_url: 'https://example.com/test-image.jpg',
  created_at: '2025-01-15T10:00:00Z',
  vote_score: 5,
  approved_comments_count: 3,
  category: {
    id: 1,
    name: 'Politics',
    color: 'blue',
    icon: '🏛️'
  }
}

const mockArticleWithoutImage = {
  id: 2,
  title: 'Article Without Image',
  content: 'This article has no image.',
  slug: 'article-without-image',
  image_url: null,
  created_at: '2025-01-14T10:00:00Z',
  vote_score: 0,
  approved_comments_count: 0,
  category: null
}

const renderWithProviders = (component) => {
  return render(
    <ChakraProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ChakraProvider>
  )
}

describe('StoryCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Default Variant', () => {
    it('renders article card with all elements', () => {
      renderWithProviders(<StoryCard article={mockArticle} />)
      
      expect(screen.getByText('Test Article Title')).toBeInTheDocument()
      expect(screen.getByText('This is a test article content that should be displayed in the card.')).toBeInTheDocument()
      expect(screen.getByText('🏛️ Politics')).toBeInTheDocument()
      expect(screen.getByText('👍 5')).toBeInTheDocument()
      expect(screen.getByText('💬 3')).toBeInTheDocument()
      expect(screen.getByText('Read More')).toBeInTheDocument()
    })

    it('renders article without image', () => {
      renderWithProviders(<StoryCard article={mockArticleWithoutImage} />)
      
      expect(screen.getByText('Article Without Image')).toBeInTheDocument()
      expect(screen.getByText('This article has no image.')).toBeInTheDocument()
      expect(screen.getByText('👍 0')).toBeInTheDocument()
      expect(screen.getByText('💬 0')).toBeInTheDocument()
    })

    it('renders article without category', () => {
      renderWithProviders(<StoryCard article={mockArticleWithoutImage} />)
      
      expect(screen.getByText('Article Without Image')).toBeInTheDocument()
      expect(screen.queryByText('🏛️ Politics')).not.toBeInTheDocument()
    })

    it('handles image loading state', async () => {
      renderWithProviders(<StoryCard article={mockArticle} />)
      
      const image = screen.getByAltText('Test Article Title')
      expect(image).toBeInTheDocument()
      
      // Simulate image load
      fireEvent.load(image)
      
      await waitFor(() => {
        expect(image).toHaveStyle({ opacity: '1' })
      })
    })

    it('handles image error with fallback', async () => {
      renderWithProviders(<StoryCard article={mockArticle} />)
      
      const image = screen.getByAltText('Test Article Title')
      
      // Simulate image error
      fireEvent.error(image)
      
      await waitFor(() => {
        expect(image.src).toContain('placeholder.com')
      })
    })

    it('formats date correctly', () => {
      renderWithProviders(<StoryCard article={mockArticle} />)
      
      // The date should be formatted and displayed
      const dateElement = screen.getByText(/January 15, 2025/)
      expect(dateElement).toBeInTheDocument()
    })

    it('is clickable and navigates to article', () => {
      renderWithProviders(<StoryCard article={mockArticle} />)
      
      const card = screen.getByRole('link')
      expect(card).toHaveAttribute('href', '/article/test-article-title')
    })
  })

  describe('Featured Variant', () => {
    it('renders featured article card', () => {
      renderWithProviders(<StoryCard article={mockArticle} variant="featured" />)
      
      expect(screen.getByText('Test Article Title')).toBeInTheDocument()
      expect(screen.getByText('Featured')).toBeInTheDocument()
      expect(screen.getByText('🏛️ Politics')).toBeInTheDocument()
    })

    it('has correct styling for featured variant', () => {
      renderWithProviders(<StoryCard article={mockArticle} variant="featured" />)
      
      const card = screen.getByRole('link')
      expect(card).toHaveClass('news-card', 'featured-article')
    })

    it('displays larger image for featured article', () => {
      renderWithProviders(<StoryCard article={mockArticle} variant="featured" />)
      
      const image = screen.getByAltText('Test Article Title')
      expect(image).toBeInTheDocument()
    })
  })

  describe('Compact Variant', () => {
    it('renders compact article card', () => {
      renderWithProviders(<StoryCard article={mockArticle} variant="compact" />)
      
      expect(screen.getByText('Test Article Title')).toBeInTheDocument()
      expect(screen.getByText(/January 15, 2025/)).toBeInTheDocument()
    })

    it('has correct styling for compact variant', () => {
      renderWithProviders(<StoryCard article={mockArticle} variant="compact" />)
      
      const card = screen.getByRole('link')
      expect(card).toHaveClass('news-card', 'compact-article')
    })

    it('displays smaller image for compact article', () => {
      renderWithProviders(<StoryCard article={mockArticle} variant="compact" />)
      
      const image = screen.getByAltText('Test Article Title')
      expect(image).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles missing article data gracefully', () => {
      const incompleteArticle = {
        id: 3,
        title: 'Incomplete Article',
        slug: 'incomplete-article'
      }
      
      expect(() => {
        renderWithProviders(<StoryCard article={incompleteArticle} />)
      }).not.toThrow()
    })

    it('handles very long titles', () => {
      const longTitleArticle = {
        ...mockArticle,
        title: 'This is a very long article title that should be truncated properly to prevent layout issues and maintain good user experience'
      }
      
      renderWithProviders(<StoryCard article={longTitleArticle} />)
      
      expect(screen.getByText(longTitleArticle.title)).toBeInTheDocument()
    })

    it('handles empty content', () => {
      const emptyContentArticle = {
        ...mockArticle,
        content: ''
      }
      
      renderWithProviders(<StoryCard article={emptyContentArticle} />)
      
      expect(screen.getByText('Test Article Title')).toBeInTheDocument()
    })

    it('handles invalid date', () => {
      const invalidDateArticle = {
        ...mockArticle,
        created_at: 'invalid-date'
      }
      
      expect(() => {
        renderWithProviders(<StoryCard article={invalidDateArticle} />)
      }).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('has proper alt text for images', () => {
      renderWithProviders(<StoryCard article={mockArticle} />)
      
      const image = screen.getByAltText('Test Article Title')
      expect(image).toBeInTheDocument()
    })

    it('has proper link attributes', () => {
      renderWithProviders(<StoryCard article={mockArticle} />)
      
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/article/test-article-title')
    })

    it('has proper heading structure', () => {
      renderWithProviders(<StoryCard article={mockArticle} />)
      
      const heading = screen.getByRole('heading')
      expect(heading).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('renders quickly', () => {
      const startTime = performance.now()
      renderWithProviders(<StoryCard article={mockArticle} />)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('handles rapid re-renders', () => {
      const { rerender } = renderWithProviders(<StoryCard article={mockArticle} />)
      
      // Rapidly re-render with different articles
      for (let i = 0; i < 5; i++) {
        const newArticle = { ...mockArticle, id: i, title: `Article ${i}` }
        rerender(<StoryCard article={newArticle} />)
      }
      
      expect(screen.getByText('Article 4')).toBeInTheDocument()
    })
  })
})

