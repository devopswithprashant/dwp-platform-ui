import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Blogs from './Blogs';

test('renders blog list', async () => {
  render(
    <BrowserRouter>
      <Blogs />
    </BrowserRouter>
  );

  // Check loading state
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Wait for data load
  await waitFor(() => {
    expect(screen.getByText(/test blog/i)).toBeInTheDocument();
    expect(screen.getByText(/test author/i)).toBeInTheDocument();
  });
});

test('shows error message when fetch fails', async () => {
  server.use(
    rest.get('http://localhost:8080/api/blogs', (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );

  render(
    <BrowserRouter>
      <Blogs />
    </BrowserRouter>
  );

  await waitFor(() => {
    expect(screen.getByText(/error fetching blogs/i)).toBeInTheDocument();
  });
});