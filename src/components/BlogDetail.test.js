import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BlogDetail from './BlogDetail';

test('displays blog details', async () => {
  render(
    <BrowserRouter>
      <BlogDetail />
    </BrowserRouter>
  );

  await waitFor(() => {
    expect(screen.getByText(/test blog/i)).toBeInTheDocument();
    expect(screen.getByText(/test content/i)).toBeInTheDocument();
  });
});

test('handles delete button click', async () => {
  const mockNavigate = jest.fn();
  jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
  }));

  render(
    <BrowserRouter>
      <BlogDetail />
    </BrowserRouter>
  );

  fireEvent.click(screen.getByText(/delete blog/i));
  
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/blogs');
  });
});