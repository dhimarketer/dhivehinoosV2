import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import AdPlacementMap from '../components/AdPlacementMap'
import { adsAPI } from '../services/api'

// Mock the API
vi.mock('../services/api', () => ({
  adsAPI: {
    update: vi.fn(),
  }
}))

const mockAds = [
  {
    id: 1,
    title: 'Test Ad 1',
    image_url: 'https://example.com/image1.jpg',
    destination_url: 'https://example.com',
    placement: { id: 1, name: 'top_banner' },
    is_active: true,
    start_date: '2025-01-01T00:00:00Z',
    end_date: '2025-12-31T23:59:59Z'
  },
  {
    id: 2,
    title: 'Test Ad 2',
    image_url: null,
    destination_url: null,
    placement: null,
    is_active: true,
    start_date: '2025-01-01T00:00:00Z',
    end_date: null
  }
]

const mockAdPlacements = [
  {
    id: 1,
    name: 'top_banner',
    description: 'Top banner placement',
    is_active: true,
    max_ads: 1
  },
  {
    id: 2,
    name: 'sidebar',
    description: 'Sidebar placement',
    is_active: true,
    max_ads: 2
  }
]

const renderWithProviders = (component) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  )
}

describe('AdPlacementMap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders ad placement map correctly', () => {
    renderWithProviders(
      <AdPlacementMap 
        ads={mockAds} 
        adPlacements={mockAdPlacements}
        onAdUpdate={vi.fn()}
        onRefresh={vi.fn()}
      />
    )

    expect(screen.getByText('Ad Placement Map')).toBeInTheDocument()
    expect(screen.getByText('Website Layout Preview')).toBeInTheDocument()
    expect(screen.getByText('Top Banner')).toBeInTheDocument()
    expect(screen.getByText('Sidebar')).toBeInTheDocument()
  })

  it('displays unplaced ads correctly', () => {
    renderWithProviders(
      <AdPlacementMap 
        ads={mockAds} 
        adPlacements={mockAdPlacements}
        onAdUpdate={vi.fn()}
        onRefresh={vi.fn()}
      />
    )

    expect(screen.getByText('📦 Unplaced Ads (1)')).toBeInTheDocument()
    expect(screen.getByText('Test Ad 2')).toBeInTheDocument()
  })

  it('displays placed ads in correct zones', () => {
    renderWithProviders(
      <AdPlacementMap 
        ads={mockAds} 
        adPlacements={mockAdPlacements}
        onAdUpdate={vi.fn()}
        onRefresh={vi.fn()}
      />
    )

    expect(screen.getByText('Test Ad 1')).toBeInTheDocument()
    expect(screen.getByText('1 ad')).toBeInTheDocument()
  })

  it('handles drag and drop functionality', async () => {
    const mockOnRefresh = vi.fn()
    adsAPI.update.mockResolvedValue({ data: {} })

    renderWithProviders(
      <AdPlacementMap 
        ads={mockAds} 
        adPlacements={mockAdPlacements}
        onAdUpdate={vi.fn()}
        onRefresh={mockOnRefresh}
      />
    )

    // Find the unplaced ad
    const unplacedAd = screen.getByText('Test Ad 2')
    expect(unplacedAd).toBeInTheDocument()

    // Find a drop zone
    const dropZone = screen.getByText('Drop ads here')
    expect(dropZone).toBeInTheDocument()

    // Simulate drag and drop
    fireEvent.dragStart(unplacedAd)
    fireEvent.dragOver(dropZone)
    fireEvent.drop(dropZone)

    // Note: The actual drag and drop testing would require more complex setup
    // This is a basic test to ensure the component renders and handles events
  })

  it('calls onAdUpdate when edit button is clicked', () => {
    const mockOnAdUpdate = vi.fn()

    renderWithProviders(
      <AdPlacementMap 
        ads={mockAds} 
        adPlacements={mockAdPlacements}
        onAdUpdate={mockOnAdUpdate}
        onRefresh={vi.fn()}
      />
    )

    // Find edit buttons (they should be present for each ad)
    const editButtons = screen.getAllByLabelText('Edit ad')
    expect(editButtons.length).toBeGreaterThan(0)

    // Click the first edit button
    fireEvent.click(editButtons[0])

    expect(mockOnAdUpdate).toHaveBeenCalledWith(mockAds[0])
  })

  it('handles empty ads list', () => {
    renderWithProviders(
      <AdPlacementMap 
        ads={[]} 
        adPlacements={mockAdPlacements}
        onAdUpdate={vi.fn()}
        onRefresh={vi.fn()}
      />
    )

    expect(screen.getByText('Ad Placement Map')).toBeInTheDocument()
    expect(screen.queryByText('Unplaced Ads')).not.toBeInTheDocument()
  })

  it('displays correct ad counts', () => {
    renderWithProviders(
      <AdPlacementMap 
        ads={mockAds} 
        adPlacements={mockAdPlacements}
        onAdUpdate={vi.fn()}
        onRefresh={vi.fn()}
      />
    )

    expect(screen.getByText('📦 Unplaced Ads (1)')).toBeInTheDocument()
    expect(screen.getByText('1 ads placed')).toBeInTheDocument()
  })

  it('shows usage instructions', () => {
    renderWithProviders(
      <AdPlacementMap 
        ads={mockAds} 
        adPlacements={mockAdPlacements}
        onAdUpdate={vi.fn()}
        onRefresh={vi.fn()}
      />
    )

    expect(screen.getByText('How to use the Ad Placement Map:')).toBeInTheDocument()
    expect(screen.getByText(/Drag & Drop:/)).toBeInTheDocument()
    expect(screen.getByText(/Edit:/)).toBeInTheDocument()
    expect(screen.getByText(/Remove:/)).toBeInTheDocument()
  })
})
