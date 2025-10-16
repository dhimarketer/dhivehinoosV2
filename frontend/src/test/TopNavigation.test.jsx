import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import TopNavigation from '../components/TopNavigation'

const renderWithProviders = (component) => {
  return render(
    <ChakraProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ChakraProvider>
  )
}

describe('TopNavigation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders navigation elements', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
    })

    it('displays site branding', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      expect(screen.getByText('Dhivehinoos.net')).toBeInTheDocument()
    })

    it('shows navigation links', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Contact')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('handles search input changes', () => {
      const mockOnSearchInput = vi.fn()
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: mockOnSearchInput,
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      const searchInput = screen.getByPlaceholderText(/search/i)
      fireEvent.change(searchInput, { target: { value: 'test search' } })

      expect(mockOnSearchInput).toHaveBeenCalledWith('test search')
    })

    it('submits search form', () => {
      const mockOnSearch = vi.fn()
      const mockProps = {
        onSearch: mockOnSearch,
        onSearchInput: vi.fn(),
        searchQuery: 'test search',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      const form = screen.getByRole('form')
      fireEvent.submit(form)

      expect(mockOnSearch).toHaveBeenCalled()
    })

    it('shows clear search button when there is a query', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: 'test search',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      expect(screen.getByText('Clear')).toBeInTheDocument()
    })

    it('calls clear search when clear button is clicked', () => {
      const mockOnClearSearch = vi.fn()
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: 'test search',
        setSearchQuery: vi.fn(),
        onClearSearch: mockOnClearSearch,
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      const clearButton = screen.getByText('Clear')
      fireEvent.click(clearButton)

      expect(mockOnClearSearch).toHaveBeenCalled()
    })

    it('does not show clear button when there is no query', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      expect(screen.queryByText('Clear')).not.toBeInTheDocument()
    })
  })

  describe('Category Navigation', () => {
    it('displays category links', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      expect(screen.getByText('Politics')).toBeInTheDocument()
      expect(screen.getByText('Sports')).toBeInTheDocument()
      expect(screen.getByText('Technology')).toBeInTheDocument()
    })

    it('highlights selected category', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: 'politics'
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      const politicsLink = screen.getByText('Politics')
      expect(politicsLink.closest('a')).toHaveClass('active')
    })

    it('navigates to category pages', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      const politicsLink = screen.getByText('Politics')
      expect(politicsLink.closest('a')).toHaveAttribute('href', '/?category=politics')
    })
  })

  describe('Responsive Design', () => {
    it('renders mobile menu toggle', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      // Mobile menu toggle should be present
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
    })

    it('toggles mobile menu', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      const menuToggle = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(menuToggle)

      // Menu should be expanded
      expect(menuToggle).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('Accessibility', () => {
    it('has proper navigation role', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('has proper form structure', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      expect(screen.getByRole('form')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
    })

    it('has proper button labels', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
    })

    it('has proper link attributes', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      const homeLink = screen.getByText('Home')
      expect(homeLink.closest('a')).toHaveAttribute('href', '/')
    })
  })

  describe('Performance', () => {
    it('renders quickly', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      const startTime = performance.now()
      renderWithProviders(<TopNavigation {...mockProps} />)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100)
    })

    it('handles rapid input changes', () => {
      const mockOnSearchInput = vi.fn()
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: mockOnSearchInput,
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      const searchInput = screen.getByPlaceholderText(/search/i)
      
      // Rapidly change input value
      for (let i = 0; i < 10; i++) {
        fireEvent.change(searchInput, { target: { value: `search ${i}` } })
      }

      expect(mockOnSearchInput).toHaveBeenCalledTimes(10)
    })
  })

  describe('Edge Cases', () => {
    it('handles missing props gracefully', () => {
      expect(() => {
        renderWithProviders(<TopNavigation />)
      }).not.toThrow()
    })

    it('handles undefined search query', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: undefined,
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      expect(() => {
        renderWithProviders(<TopNavigation {...mockProps} />)
      }).not.toThrow()
    })

    it('handles null selected category', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      expect(() => {
        renderWithProviders(<TopNavigation {...mockProps} />)
      }).not.toThrow()
    })
  })
})

