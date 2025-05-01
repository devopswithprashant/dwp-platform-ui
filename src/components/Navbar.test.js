import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';

test('renders navigation links', () => {
  render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  );

  expect(screen.getByText(/home/i)).toBeInTheDocument();
  expect(screen.getByText(/blogs/i)).toBeInTheDocument();
  expect(screen.getByText(/create/i)).toBeInTheDocument();
});