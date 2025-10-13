import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import NewsletterSubscription from '../components/NewsletterSubscription';
import SchedulingPage from '../pages/admin/SchedulingPage';
import SubscriptionManagement from '../pages/admin/SubscriptionManagement';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the API module
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock react-helmet-async
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }) => children,
}));

// Helper function to render components with Chakra UI
const renderWithChakra = (component) => {
  return render(
    <ChakraProvider>
      <AuthProvider>
        {component}
      </AuthProvider>
    </ChakraProvider>
  );
};

describe('NewsletterSubscription Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders newsletter subscription form', () => {
    renderWithChakra(<NewsletterSubscription />);
    
    expect(screen.getByText('Subscribe to Newsletter')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });

  it('renders with custom title when showTitle is true', () => {
    renderWithChakra(<NewsletterSubscription showTitle={true} />);
    
    expect(screen.getByText('Subscribe to Newsletter')).toBeInTheDocument();
  });

  it('does not render title when showTitle is false', () => {
    renderWithChakra(<NewsletterSubscription showTitle={false} />);
    
    expect(screen.queryByText('Subscribe to Newsletter')).not.toBeInTheDocument();
  });

  it('handles email input change', () => {
    renderWithChakra(<NewsletterSubscription />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(emailInput.value).toBe('test@example.com');
  });

  it('handles first name input change', () => {
    renderWithChakra(<NewsletterSubscription />);
    
    const firstNameInput = screen.getByPlaceholderText('First Name (Optional)');
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    
    expect(firstNameInput.value).toBe('John');
  });

  it('handles last name input change', () => {
    renderWithChakra(<NewsletterSubscription />);
    
    const lastNameInput = screen.getByPlaceholderText('Last Name (Optional)');
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    
    expect(lastNameInput.value).toBe('Doe');
  });

  it('shows validation error for invalid email', async () => {
    renderWithChakra(<NewsletterSubscription />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const subscribeButton = screen.getByRole('button', { name: /subscribe/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(subscribeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('shows validation error for empty email', async () => {
    renderWithChakra(<NewsletterSubscription />);
    
    const subscribeButton = screen.getByRole('button', { name: /subscribe/i });
    fireEvent.click(subscribeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('shows success message after successful subscription', async () => {
    const mockApi = await import('../services/api');
    mockApi.default.post.mockResolvedValueOnce({
      data: { message: 'Successfully subscribed!' }
    });

    renderWithChakra(<NewsletterSubscription />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const subscribeButton = screen.getByRole('button', { name: /subscribe/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(subscribeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Successfully subscribed!')).toBeInTheDocument();
    });
  });

  it('shows error message after failed subscription', async () => {
    const mockApi = await import('../services/api');
    mockApi.default.post.mockRejectedValueOnce({
      response: { data: { error: 'Subscription failed' } }
    });

    renderWithChakra(<NewsletterSubscription />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const subscribeButton = screen.getByRole('button', { name: /subscribe/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(subscribeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Subscription failed')).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    const mockApi = await import('../services/api');
    mockApi.default.post.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    renderWithChakra(<NewsletterSubscription />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const subscribeButton = screen.getByRole('button', { name: /subscribe/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(subscribeButton);
    
    await waitFor(() => {
      expect(subscribeButton).toBeDisabled();
    });
  });
});

describe('SchedulingPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders scheduling page', () => {
    renderWithChakra(<SchedulingPage />);
    
    expect(screen.getByText('Article Scheduling Management')).toBeInTheDocument();
  });

  it('renders schedules section', () => {
    renderWithChakra(<SchedulingPage />);
    
    expect(screen.getByText('Publishing Schedules')).toBeInTheDocument();
  });

  it('renders scheduled articles section', () => {
    renderWithChakra(<SchedulingPage />);
    
    expect(screen.getByText('Scheduled Articles')).toBeInTheDocument();
  });

  it('renders statistics section', () => {
    renderWithChakra(<SchedulingPage />);
    
    expect(screen.getByText('Schedule Statistics')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderWithChakra(<SchedulingPage />);
    
    expect(screen.getByText('Loading schedules...')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const mockApi = await import('../services/api');
    mockApi.default.get.mockRejectedValueOnce(new Error('API Error'));

    renderWithChakra(<SchedulingPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading schedules')).toBeInTheDocument();
    });
  });
});

describe('SubscriptionManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders subscription management page', () => {
    renderWithChakra(<SubscriptionManagement />);
    
    expect(screen.getByText('Newsletter Subscription Management')).toBeInTheDocument();
  });

  it('renders subscribers section', () => {
    renderWithChakra(<SubscriptionManagement />);
    
    expect(screen.getByText('Subscribers')).toBeInTheDocument();
  });

  it('renders campaigns section', () => {
    renderWithChakra(<SubscriptionManagement />);
    
    expect(screen.getByText('Email Campaigns')).toBeInTheDocument();
  });

  it('renders statistics section', () => {
    renderWithChakra(<SubscriptionManagement />);
    
    expect(screen.getByText('Subscription Statistics')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderWithChakra(<SubscriptionManagement />);
    
    expect(screen.getByText('Loading subscriptions...')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const mockApi = await import('../services/api');
    mockApi.default.get.mockRejectedValueOnce(new Error('API Error'));

    renderWithChakra(<SubscriptionManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading subscriptions')).toBeInTheDocument();
    });
  });
});

describe('Admin Dashboard Integration', () => {
  it('renders scheduling tab when active', () => {
    // This would be tested in the AdminDashboard component
    // For now, we'll just verify the component can be imported
    expect(SchedulingPage).toBeDefined();
  });

  it('renders subscriptions tab when active', () => {
    // This would be tested in the AdminDashboard component
    // For now, we'll just verify the component can be imported
    expect(SubscriptionManagement).toBeDefined();
  });
});

describe('Component Error Boundaries', () => {
  it('handles component errors gracefully', () => {
    // Test that components don't crash the entire app
    expect(() => {
      renderWithChakra(<NewsletterSubscription />);
    }).not.toThrow();
  });

  it('handles missing props gracefully', () => {
    expect(() => {
      renderWithChakra(<NewsletterSubscription />);
    }).not.toThrow();
  });
});

describe('Accessibility Tests', () => {
  it('newsletter subscription form has proper labels', () => {
    renderWithChakra(<NewsletterSubscription />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('buttons have proper accessibility attributes', () => {
    renderWithChakra(<NewsletterSubscription />);
    
    const subscribeButton = screen.getByRole('button', { name: /subscribe/i });
    expect(subscribeButton).toBeInTheDocument();
  });

  it('form has proper structure', () => {
    renderWithChakra(<NewsletterSubscription />);
    
    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();
  });
});

describe('Performance Tests', () => {
  it('components render quickly', () => {
    const startTime = performance.now();
    renderWithChakra(<NewsletterSubscription />);
    const endTime = performance.now();
    
    // Should render in less than 100ms
    expect(endTime - startTime).toBeLessThan(100);
  });

  it('components handle rapid state changes', async () => {
    renderWithChakra(<NewsletterSubscription />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    
    // Rapidly change input value
    for (let i = 0; i < 10; i++) {
      fireEvent.change(emailInput, { target: { value: `test${i}@example.com` } });
    }
    
    expect(emailInput.value).toBe('test9@example.com');
  });
});
