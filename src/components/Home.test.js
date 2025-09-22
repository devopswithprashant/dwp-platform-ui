import Home from './Home';
import { render, screen } from '@testing-library/react';

describe('Home Component', () => {
  it('renders the heading prop', () => {
    render(<Home heading="Test Heading" />);
    const headingElement = screen.getByText(/Test Heading/i);
    expect(headingElement).toBeInTheDocument();
  })
})