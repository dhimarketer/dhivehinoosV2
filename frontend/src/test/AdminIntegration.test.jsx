import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import AdminLogin from '../pages/admin/AdminLogin'
import AdminDashboard from '../pages/admin/AdminDashboard'
import { articlesAPI, settingsAPI, adsAPI } from '../services/api'

// Mock the API
vi.mock('../services/api', () => ({
  articlesAPI: {
    getPublished: vi.fn(),
    search: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  settingsAPI: {
    get: vi.fn(),
    update: vi.fn(),
    getPublic: vi.fn(),
  },
  adsAPI: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

// Mock react-helmet-async
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }) => children,
}))

const renderWithProviders = (component) => {
  return render(
    <ChakraProvider>
      <BrowserRouter>
        <AuthProvider>
          {component}
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  )
}

describe('Admin Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Admin Login Flow', () => {
    it('completes full login flow', async () => {
      const mockUser = { id: 1, username: 'admin', email: 'admin@example.com' }
      
      // Mock successful login
      vi.doMock('../services/auth', () => ({
        default: {
          login: vi.fn().mockResolvedValue({ success: true, user: mockUser }),
          checkAuthStatus: vi.fn().mockResolvedValue(false),
          getCurrentUser: vi.fn().mockReturnValue(mockUser),
          logout: vi.fn().mockResolvedValue(),
        }
      }))

      renderWithProviders(<AdminLogin />)

      // Fill login form
      const usernameInput = screen.getByPlaceholderText(/username/i)
      const passwordInput = screen.getByPlaceholderText(/password/i)
      const loginButton = screen.getByRole('button', { name: /login/i })

      fireEvent.change(usernameInput, { target: { value: 'admin' } })
      fireEvent.change(passwordInput, { target: { value: 'password' } })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText('Logging in...')).toBeInTheDocument()
      })
    })

    it('handles login validation errors', async () => {
      renderWithProviders(<AdminLogin />)

      const loginButton = screen.getByRole('button', { name: /login/i })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument()
        expect(screen.getByText('Password is required')).toBeInTheDocument()
      })
    })

    it('handles login API errors', async () => {
      // Mock failed login
      vi.doMock('../services/auth', () => ({
        default: {
          login: vi.fn().mockResolvedValue({ success: false, error: 'Invalid credentials' }),
          checkAuthStatus: vi.fn().mockResolvedValue(false),
          getCurrentUser: vi.fn().mockReturnValue(null),
          logout: vi.fn().mockResolvedValue(),
        }
      }))

      renderWithProviders(<AdminLogin />)

      const usernameInput = screen.getByPlaceholderText(/username/i)
      const passwordInput = screen.getByPlaceholderText(/password/i)
      const loginButton = screen.getByRole('button', { name: /login/i })

      fireEvent.change(usernameInput, { target: { value: 'admin' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
    })
  })

  describe('Admin Dashboard Integration', () => {
    it('loads dashboard data correctly', async () => {
      const mockSettings = {
        id: 1,
        site_name: 'Dhivehinoos.net',
        site_description: 'Test site',
        default_article_status: 'draft',
        allow_comments: true,
        require_comment_approval: true,
        google_analytics_id: '',
      }

      const mockArticles = [
        {
          id: 1,
          title: 'Test Article',
          content: 'Test content',
          slug: 'test-article',
          status: 'published',
          created_at: '2025-01-15T10:00:00Z',
        }
      ]

      const mockAds = [
        {
          id: 1,
          title: 'Test Ad',
          image_url: 'https://example.com/ad.jpg',
          destination_url: 'https://example.com',
          placement: { id: 1, name: 'top_banner' },
          is_active: true,
        }
      ]

      settingsAPI.get.mockResolvedValue({ data: mockSettings })
      articlesAPI.getPublished.mockResolvedValue({ data: { results: mockArticles } })
      adsAPI.get.mockResolvedValue({ data: mockAds })

      // Mock authenticated user
      vi.doMock('../services/auth', () => ({
        default: {
          checkAuthStatus: vi.fn().mockResolvedValue(true),
          getCurrentUser: vi.fn().mockReturnValue({ id: 1, username: 'admin' }),
          logout: vi.fn().mockResolvedValue(),
        }
      }))

      renderWithProviders(<AdminDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
      })
    })

    it('handles dashboard loading errors', async () => {
      settingsAPI.get.mockRejectedValue(new Error('Settings API Error'))
      articlesAPI.getPublished.mockRejectedValue(new Error('Articles API Error'))
      adsAPI.get.mockRejectedValue(new Error('Ads API Error'))

      // Mock authenticated user
      vi.doMock('../services/auth', () => ({
        default: {
          checkAuthStatus: vi.fn().mockResolvedValue(true),
          getCurrentUser: vi.fn().mockReturnValue({ id: 1, username: 'admin' }),
          logout: vi.fn().mockResolvedValue(),
        }
      }))

      renderWithProviders(<AdminDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
      })
    })
  })

  describe('Settings Management Integration', () => {
    it('updates settings successfully', async () => {
      const mockSettings = {
        id: 1,
        site_name: 'Dhivehinoos.net',
        site_description: 'Test site',
        default_article_status: 'draft',
        allow_comments: true,
        require_comment_approval: true,
        google_analytics_id: '',
      }

      const updatedSettings = {
        ...mockSettings,
        site_name: 'Updated Site Name',
        default_article_status: 'published',
      }

      settingsAPI.get.mockResolvedValue({ data: mockSettings })
      settingsAPI.update.mockResolvedValue({ data: updatedSettings })

      // Mock authenticated user
      vi.doMock('../services/auth', () => ({
        default: {
          checkAuthStatus: vi.fn().mockResolvedValue(true),
          getCurrentUser: vi.fn().mockReturnValue({ id: 1, username: 'admin' }),
          logout: vi.fn().mockResolvedValue(),
        }
      }))

      renderWithProviders(<AdminDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
      })

      // Navigate to settings tab
      const settingsTab = screen.getByText('Settings')
      fireEvent.click(settingsTab)

      await waitFor(() => {
        expect(screen.getByText('Site Settings')).toBeInTheDocument()
      })

      // Update site name
      const siteNameInput = screen.getByDisplayValue('Dhivehinoos.net')
      fireEvent.change(siteNameInput, { target: { value: 'Updated Site Name' } })

      // Save settings
      const saveButton = screen.getByText('Save Settings')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(settingsAPI.update).toHaveBeenCalledWith({
          ...mockSettings,
          site_name: 'Updated Site Name'
        })
      })
    })
  })

  describe('Article Management Integration', () => {
    it('creates new article successfully', async () => {
      const mockArticle = {
        id: 1,
        title: 'New Article',
        content: 'Article content',
        slug: 'new-article',
        status: 'draft',
        created_at: '2025-01-15T10:00:00Z',
      }

      articlesAPI.create.mockResolvedValue({ data: mockArticle })

      // Mock authenticated user
      vi.doMock('../services/auth', () => ({
        default: {
          checkAuthStatus: vi.fn().mockResolvedValue(true),
          getCurrentUser: vi.fn().mockReturnValue({ id: 1, username: 'admin' }),
          logout: vi.fn().mockResolvedValue(),
        }
      }))

      renderWithProviders(<AdminDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
      })

      // Navigate to articles tab
      const articlesTab = screen.getByText('Articles')
      fireEvent.click(articlesTab)

      await waitFor(() => {
        expect(screen.getByText('Article Management')).toBeInTheDocument()
      })

      // Click create article button
      const createButton = screen.getByText('Create Article')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Create New Article')).toBeInTheDocument()
      })

      // Fill article form
      const titleInput = screen.getByPlaceholderText(/article title/i)
      const contentInput = screen.getByPlaceholderText(/article content/i)

      fireEvent.change(titleInput, { target: { value: 'New Article' } })
      fireEvent.change(contentInput, { target: { value: 'Article content' } })

      // Submit form
      const submitButton = screen.getByText('Create Article')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(articlesAPI.create).toHaveBeenCalledWith({
          title: 'New Article',
          content: 'Article content',
          status: 'draft'
        })
      })
    })

    it('handles article creation errors', async () => {
      articlesAPI.create.mockRejectedValue(new Error('Article creation failed'))

      // Mock authenticated user
      vi.doMock('../services/auth', () => ({
        default: {
          checkAuthStatus: vi.fn().mockResolvedValue(true),
          getCurrentUser: vi.fn().mockReturnValue({ id: 1, username: 'admin' }),
          logout: vi.fn().mockResolvedValue(),
        }
      }))

      renderWithProviders(<AdminDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
      })

      // Navigate to articles tab
      const articlesTab = screen.getByText('Articles')
      fireEvent.click(articlesTab)

      await waitFor(() => {
        expect(screen.getByText('Article Management')).toBeInTheDocument()
      })

      // Click create article button
      const createButton = screen.getByText('Create Article')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Create New Article')).toBeInTheDocument()
      })

      // Fill article form
      const titleInput = screen.getByPlaceholderText(/article title/i)
      const contentInput = screen.getByPlaceholderText(/article content/i)

      fireEvent.change(titleInput, { target: { value: 'New Article' } })
      fireEvent.change(contentInput, { target: { value: 'Article content' } })

      // Submit form
      const submitButton = screen.getByText('Create Article')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to create article')).toBeInTheDocument()
      })
    })
  })

  describe('Ad Management Integration', () => {
    it('manages ads successfully', async () => {
      const mockAds = [
        {
          id: 1,
          title: 'Test Ad',
          image_url: 'https://example.com/ad.jpg',
          destination_url: 'https://example.com',
          placement: { id: 1, name: 'top_banner' },
          is_active: true,
        }
      ]

      const mockAdPlacements = [
        {
          id: 1,
          name: 'top_banner',
          description: 'Top banner placement',
          is_active: true,
          max_ads: 1
        }
      ]

      adsAPI.get.mockResolvedValue({ data: mockAds })

      // Mock authenticated user
      vi.doMock('../services/auth', () => ({
        default: {
          checkAuthStatus: vi.fn().mockResolvedValue(true),
          getCurrentUser: vi.fn().mockReturnValue({ id: 1, username: 'admin' }),
          logout: vi.fn().mockResolvedValue(),
        }
      }))

      renderWithProviders(<AdminDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
      })

      // Navigate to ads tab
      const adsTab = screen.getByText('Ads')
      fireEvent.click(adsTab)

      await waitFor(() => {
        expect(screen.getByText('Ad Management')).toBeInTheDocument()
      })

      // Check that ads are loaded
      await waitFor(() => {
        expect(screen.getByText('Test Ad')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('handles network errors gracefully', async () => {
      // Mock network error
      settingsAPI.get.mockRejectedValue(new Error('Network Error'))
      articlesAPI.getPublished.mockRejectedValue(new Error('Network Error'))
      adsAPI.get.mockRejectedValue(new Error('Network Error'))

      // Mock authenticated user
      vi.doMock('../services/auth', () => ({
        default: {
          checkAuthStatus: vi.fn().mockResolvedValue(true),
          getCurrentUser: vi.fn().mockReturnValue({ id: 1, username: 'admin' }),
          logout: vi.fn().mockResolvedValue(),
        }
      }))

      renderWithProviders(<AdminDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
      })

      // Should still render dashboard even with errors
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    it('handles authentication errors', async () => {
      // Mock auth error
      vi.doMock('../services/auth', () => ({
        default: {
          checkAuthStatus: vi.fn().mockRejectedValue(new Error('Auth Error')),
          getCurrentUser: vi.fn().mockReturnValue(null),
          logout: vi.fn().mockResolvedValue(),
        }
      }))

      renderWithProviders(<AdminDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Redirecting to login...')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Integration', () => {
    it('loads dashboard quickly', async () => {
      const mockSettings = { id: 1, site_name: 'Test Site' }
      const mockArticles = [{ id: 1, title: 'Test Article' }]
      const mockAds = [{ id: 1, title: 'Test Ad' }]

      settingsAPI.get.mockResolvedValue({ data: mockSettings })
      articlesAPI.getPublished.mockResolvedValue({ data: { results: mockArticles } })
      adsAPI.get.mockResolvedValue({ data: mockAds })

      // Mock authenticated user
      vi.doMock('../services/auth', () => ({
        default: {
          checkAuthStatus: vi.fn().mockResolvedValue(true),
          getCurrentUser: vi.fn().mockReturnValue({ id: 1, username: 'admin' }),
          logout: vi.fn().mockResolvedValue(),
        }
      }))

      const startTime = performance.now()
      renderWithProviders(<AdminDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
      })

      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(2000)
    })
  })
})

