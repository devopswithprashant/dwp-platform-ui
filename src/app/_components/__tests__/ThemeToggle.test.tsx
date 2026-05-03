import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ThemeToggle from '../ThemeToggle'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset document attributes
    document.documentElement.removeAttribute('data-theme')
  })

  it('should render a button with accessibility label', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label')
  })

  it('should initialize with light theme from localStorage', () => {
    localStorage.setItem('theme', 'light')
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    
    waitFor(() => {
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
    })
  })

  it('should initialize with dark theme from localStorage', () => {
    localStorage.setItem('theme', 'dark')
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    
    waitFor(() => {
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
    })
  })

  it('should toggle theme from light to dark', async () => {
    localStorage.setItem('theme', 'light')
    render(<ThemeToggle />)
    const button = screen.getByRole('button')

    fireEvent.click(button)

    await waitFor(() => {
      expect(localStorage.getItem('theme')).toBe('dark')
    })
  })

  it('should toggle theme from dark to light', async () => {
    localStorage.setItem('theme', 'dark')
    render(<ThemeToggle />)
    const button = screen.getByRole('button')

    fireEvent.click(button)

    await waitFor(() => {
      expect(localStorage.getItem('theme')).toBe('light')
    })
  })

  it('should update document theme attribute on toggle', async () => {
    localStorage.setItem('theme', 'light')
    render(<ThemeToggle />)
    const button = screen.getByRole('button')

    fireEvent.click(button)

    // After toggle, the document should have theme updated
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark')
    })
  })

  it('should have proper CSS classes for styling', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass('inline-flex')
    expect(button).toHaveClass('h-9')
    expect(button).toHaveClass('w-9')
    expect(button).toHaveClass('rounded-full')
    expect(button).toHaveClass('border')
  })

  it('should render without prop defaults', () => {
    const { container } = render(<ThemeToggle />)
    expect(container.firstChild).toBeTruthy()
  })

  it('should have correct button type', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'button')
  })

  it('should handle multiple toggled clicks correctly', async () => {
    localStorage.setItem('theme', 'light')
    render(<ThemeToggle />)
    const button = screen.getByRole('button')

    // First toggle
    fireEvent.click(button)
    await waitFor(() => {
      expect(localStorage.getItem('theme')).toBe('dark')
    })

    // Second toggle
    fireEvent.click(button)
    await waitFor(() => {
      expect(localStorage.getItem('theme')).toBe('light')
    })
  })

  it('should use system preference when no localStorage value exists', () => {
    // Mock system preference for dark mode
    ;(window.matchMedia as jest.Mock).mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))
    
    render(<ThemeToggle />)
    const button = screen.getByRole('button')

    // Button should reflect dark mode preference
    waitFor(() => {
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
    })
  })
})
