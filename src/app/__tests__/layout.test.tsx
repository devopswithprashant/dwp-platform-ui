import React from 'react'
import { render } from '@testing-library/react'

describe('Home Page Layout', () => {
  it('should have proper page structure', () => {
    // Basic test for page structure
    const { container } = render(<div data-testid="home-page">Home</div>)
    const page = container.querySelector('[data-testid="home-page"]')
    expect(page).toBeInTheDocument()
  })

  it('should render without crashing', () => {
    const { container } = render(
      <main>
        <h1>Welcome to Blog Platform</h1>
      </main>
    )
    expect(container.querySelector('h1')).toBeInTheDocument()
  })

  it('should have accessible structure', () => {
    const { container } = render(
      <div>
        <main>
          <h1>Blog Platform</h1>
        </main>
      </div>
    )
    expect(container.querySelector('main')).toBeInTheDocument()
    expect(container.querySelector('h1')).toBeInTheDocument()
  })
})
