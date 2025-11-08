import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider, useAuth, ProtectedRoute } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import authService from '../services/auth'

// Mock the auth service
vi.mock('../services/auth', () => ({
  default: {
    checkAuthStatus: vi.fn(),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Test component that uses auth context
const TestComponent = () => {
  const { isAuthenticated, user, loading, login, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading...' : 'Not Loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user">{user ? user.username : 'No User'}</div>
      <button onClick={() => login('testuser', 'password')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  )
}

const renderWithProviders = (component) => {
  return render(
    <HelmetProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            {component}
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </HelmetProvider>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Initial State', () => {
    it('starts with loading state', () => {
      authService.checkAuthStatus.mockImplementation(() => new Promise(() => {})) // Never resolves
      
      renderWithProviders(<TestComponent />)
      
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading...')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
      expect(screen.getByTestId('user')).toHaveTextContent('No User')
    })

    it('initializes with cached auth data', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
      localStorageMock.getItem
        .mockReturnValueOnce('true') // isAuthenticated
        .mockReturnValueOnce(JSON.stringify(mockUser)) // user
      
      authService.checkAuthStatus.mockResolvedValue(true)
      authService.getCurrentUser.mockReturnValue(mockUser)

      renderWithProviders(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
        expect(screen.getByTestId('user')).toHaveTextContent('testuser')
      })
    })

    it('verifies auth status with backend', async () => {
      authService.checkAuthStatus.mockResolvedValue(false)

      renderWithProviders(<TestComponent />)

      await waitFor(() => {
        expect(authService.checkAuthStatus).toHaveBeenCalled()
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
      })
    })
  })

  describe('Login Functionality', () => {
    it('handles successful login', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
      
      authService.checkAuthStatus.mockResolvedValue(false)
      authService.login.mockResolvedValue({ success: true, user: mockUser })

      renderWithProviders(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      const loginButton = screen.getByText('Login')
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith('testuser', 'password')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
        expect(screen.getByTestId('user')).toHaveTextContent('testuser')
      })
    })

    it('handles failed login', async () => {
      authService.checkAuthStatus.mockResolvedValue(false)
      authService.login.mockResolvedValue({ success: false, error: 'Invalid credentials' })

      renderWithProviders(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      const loginButton = screen.getByText('Login')
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith('testuser', 'password')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
      })
    })

    it('handles login error', async () => {
      authService.checkAuthStatus.mockResolvedValue(false)
      authService.login.mockRejectedValue(new Error('Network error'))

      renderWithProviders(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      const loginButton = screen.getByText('Login')
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith('testuser', 'password')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
      })
    })
  })

  describe('Logout Functionality', () => {
    it('handles logout successfully', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
      
      authService.checkAuthStatus.mockResolvedValue(true)
      authService.getCurrentUser.mockReturnValue(mockUser)
      authService.logout.mockResolvedValue()

      renderWithProviders(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
      })

      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled()
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
        expect(screen.getByTestId('user')).toHaveTextContent('No User')
      })
    })

    it('handles logout error gracefully', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
      
      authService.checkAuthStatus.mockResolvedValue(true)
      authService.getCurrentUser.mockReturnValue(mockUser)
      authService.logout.mockRejectedValue(new Error('Logout failed'))

      renderWithProviders(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
      })

      const logoutButton = screen.getByText('Logout')
      fireEvent.click(logoutButton)

      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled()
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
      })
    })
  })

  describe('Auth Status Check', () => {
    it('handles auth check error', async () => {
      authService.checkAuthStatus.mockRejectedValue(new Error('Auth check failed'))

      renderWithProviders(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
      })
    })

    it('clears stale auth data on failed check', async () => {
      localStorageMock.getItem
        .mockReturnValueOnce('true') // isAuthenticated
        .mockReturnValueOnce(JSON.stringify({ id: 1, username: 'testuser' })) // user
      
      authService.checkAuthStatus.mockResolvedValue(false)

      renderWithProviders(<TestComponent />)

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('isAuthenticated')
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
      })
    })
  })

  describe('Protected Route', () => {
    it('renders children when authenticated', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
      
      authService.checkAuthStatus.mockResolvedValue(true)
      authService.getCurrentUser.mockReturnValue(mockUser)

      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      })
    })

    it('shows loading when checking auth', () => {
      authService.checkAuthStatus.mockImplementation(() => new Promise(() => {})) // Never resolves

      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('shows redirect message when not authenticated', async () => {
      authService.checkAuthStatus.mockResolvedValue(false)

      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(screen.getByText('Redirecting to login...')).toBeInTheDocument()
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles missing context gracefully', () => {
      const TestComponentWithoutProvider = () => {
        try {
          useAuth()
          return <div>Should not render</div>
        } catch (error) {
          return <div>Error: {error.message}</div>
        }
      }

      render(
        <BrowserRouter>
          <TestComponentWithoutProvider />
        </BrowserRouter>
      )

      expect(screen.getByText('Error: useAuth must be used within an AuthProvider')).toBeInTheDocument()
    })

    it('handles localStorage errors', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      authService.checkAuthStatus.mockResolvedValue(false)

      renderWithProviders(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
      })
    })
  })

  describe('Performance', () => {
    it('renders quickly', async () => {
      authService.checkAuthStatus.mockResolvedValue(false)

      const startTime = performance.now()
      renderWithProviders(<TestComponent />)
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(1000)
    })

    it('handles rapid auth state changes', async () => {
      authService.checkAuthStatus.mockResolvedValue(false)
      authService.login.mockResolvedValue({ success: true, user: { id: 1, username: 'testuser' } })
      authService.logout.mockResolvedValue()

      renderWithProviders(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      })

      // Rapidly login and logout
      const loginButton = screen.getByText('Login')
      const logoutButton = screen.getByText('Logout')

      fireEvent.click(loginButton)
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
      })

      fireEvent.click(logoutButton)
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
      })
    })
  })
})

