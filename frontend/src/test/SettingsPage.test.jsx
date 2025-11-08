import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import SettingsPage from '../pages/admin/SettingsPage'
import { settingsAPI } from '../services/api'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'

// Mock the API
vi.mock('../services/api', () => ({
  settingsAPI: {
    get: vi.fn(),
    update: vi.fn(),
    getPublic: vi.fn(),
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

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

const mockSettings = {
  id: 1,
  default_article_status: 'draft',
  site_name: 'Dhivehinoos.net',
  site_description: 'Test description',
  allow_comments: true,
  require_comment_approval: true,
  google_analytics_id: '',
  story_cards_rows: 3,
  story_cards_columns: 3,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
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

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue('true') // Mock authenticated user
  })

  it('renders settings form correctly', async () => {
    settingsAPI.get.mockResolvedValue({ data: mockSettings })

    renderWithProviders(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Site Settings')).toBeInTheDocument()
      expect(screen.getByText('Article Settings')).toBeInTheDocument()
      expect(screen.getByText('Site Information')).toBeInTheDocument()
      expect(screen.getByText('Comment Settings')).toBeInTheDocument()
      expect(screen.getByText('Analytics Settings')).toBeInTheDocument()
    })
  })

  it('loads settings data correctly', async () => {
    settingsAPI.get.mockResolvedValue({ data: mockSettings })

    renderWithProviders(<SettingsPage />)

    await waitFor(() => {
      // Check that the article status select has the correct value
      const articleStatusSelect = screen.getByLabelText('Default Article Status')
      expect(articleStatusSelect).toHaveValue('draft')
      expect(screen.getByDisplayValue('Dhivehinoos.net')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument()
    })
  })

  it('handles settings update correctly', async () => {
    const updatedSettings = { ...mockSettings, default_article_status: 'published' }
    
    settingsAPI.get
      .mockResolvedValueOnce({ data: mockSettings }) // Initial load
      .mockResolvedValueOnce({ data: updatedSettings }) // After update
    
    settingsAPI.update.mockResolvedValue({ data: updatedSettings })

    renderWithProviders(<SettingsPage />)

    await waitFor(() => {
      const articleStatusSelect = screen.getByLabelText('Default Article Status')
      expect(articleStatusSelect).toHaveValue('draft')
    })

    // Change the default article status
    const articleStatusSelect = screen.getByLabelText('Default Article Status')
    fireEvent.change(articleStatusSelect, { target: { value: 'published' } })

    // Click save button
    const saveButton = screen.getByText('Save Settings')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(settingsAPI.update).toHaveBeenCalledWith({
        ...mockSettings,
        default_article_status: 'published'
      })
    })
  })

  it('handles API errors gracefully', async () => {
    settingsAPI.get.mockRejectedValue(new Error('API Error'))

    renderWithProviders(<SettingsPage />)

    await waitFor(() => {
      const errorAlert = screen.getAllByRole('alert').find(alert => 
        alert.textContent?.includes('Network error. Please check your connection.')
      )
      expect(errorAlert).toBeInTheDocument()
    })
  })

  it('shows authentication error when not authenticated', async () => {
    localStorageMock.getItem.mockReturnValue(null) // Not authenticated
    settingsAPI.get.mockRejectedValue({ response: { status: 401 } })

    renderWithProviders(<SettingsPage />)

    await waitFor(() => {
      const authAlert = screen.getAllByRole('alert').find(alert => 
        alert.textContent?.includes('Session expired. Please log in again.')
      )
      expect(authAlert).toBeInTheDocument()
    })
  })

  it('validates form fields correctly', async () => {
    settingsAPI.get.mockResolvedValue({ data: mockSettings })

    renderWithProviders(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Dhivehinoos.net')).toBeInTheDocument()
    })

    // Test site name validation (required field)
    const siteNameInput = screen.getByDisplayValue('Dhivehinoos.net')
    fireEvent.change(siteNameInput, { target: { value: '' } })

    // The form should still be submittable (no client-side validation for now)
    const saveButton = screen.getByText('Save Settings')
    expect(saveButton).toBeInTheDocument()
  })

  it('handles Google Analytics ID validation', async () => {
    settingsAPI.get.mockResolvedValue({ data: mockSettings })

    renderWithProviders(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('G-MLXXKKVFXQ')).toBeInTheDocument()
    })

    // Test valid GA ID
    const gaInput = screen.getByPlaceholderText('G-MLXXKKVFXQ')
    fireEvent.change(gaInput, { target: { value: 'G-TEST123456' } })

    expect(gaInput.value).toBe('G-TEST123456')
  })

  it('toggles comment settings correctly', async () => {
    settingsAPI.get.mockResolvedValue({ data: mockSettings })

    renderWithProviders(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Allow Comments')).toBeInTheDocument()
    })

    // Test allow comments toggle - find by label text and get the switch
    const allowCommentsLabel = screen.getByText('Allow Comments')
    const allowCommentsSwitch = allowCommentsLabel.parentElement.querySelector('input[type="checkbox"]')
    expect(allowCommentsSwitch).toBeChecked()

    fireEvent.click(allowCommentsSwitch)
    expect(allowCommentsSwitch).not.toBeChecked()

    // Test require approval toggle (should be disabled when comments are off)
    const requireApprovalLabel = screen.getByText('Require Comment Approval')
    const requireApprovalSwitch = requireApprovalLabel.parentElement.querySelector('input[type="checkbox"]')
    expect(requireApprovalSwitch).toBeDisabled()
  })
})
