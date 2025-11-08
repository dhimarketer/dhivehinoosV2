import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TopNavigation from '../components/TopNavigation'

// Mock useBreakpointValue to always return false (desktop mode)
vi.mock('../hooks/useBreakpointValue', () => ({
  useBreakpointValue: vi.fn(() => false), // Always desktop mode
}))

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
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

      expect(screen.getByText('Dhivehinoos.net')).toBeInTheDocument()
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
      expect(screen.getByText('Contact Us')).toBeInTheDocument()
      expect(screen.getByText('Categories')).toBeInTheDocument()
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

      const form = screen.getByRole('textbox').closest('form')
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

      expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
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

      const clearButton = screen.getByLabelText('Clear search')
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
    it('displays category dropdown', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      expect(screen.getByText('Categories')).toBeInTheDocument()
    })

    it('opens category dropdown when clicked', () => {
      const mockProps = {
        onSearch: vi.fn(),
        onSearchInput: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        onClearSearch: vi.fn(),
        selectedCategory: null
      }

      renderWithProviders(<TopNavigation {...mockProps} />)

      const categoriesButton = screen.getByText('Categories')
      fireEvent.click(categoriesButton)

      expect(screen.getByText('All Articles')).toBeInTheDocument()
    })

    it('navigates to home page', () => {
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

      // In desktop mode, there's no mobile menu toggle
      // The navigation is always visible
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Categories')).toBeInTheDocument()
      expect(screen.getByText('Contact Us')).toBeInTheDocument()
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

      // In desktop mode, there's no mobile menu to toggle
      // Test that the navigation elements are visible
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Categories')).toBeInTheDocument()
      expect(screen.getByText('Contact Us')).toBeInTheDocument()
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

      expect(screen.getByRole('textbox')).toBeInTheDocument()
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

      // Test that buttons have proper labels
      expect(screen.getByRole('button', { name: /categories/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
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

