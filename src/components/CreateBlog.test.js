import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateBlog from './CreateBlog';

test('submits blog form', async () => {
  const mockNavigate = jest.fn();
  jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
  }));

  render(<CreateBlog />);

  // Fill form
  fireEvent.change(screen.getByLabelText(/title/i), {
    target: { value: 'New Blog' }
  });
  fireEvent.change(screen.getByLabelText(/content/i), {
    target: { value: 'New Content' }
  });
  fireEvent.change(screen.getByLabelText(/author/i), {
    target: { value: 'New Author' }
  });

  // Submit form
  fireEvent.click(screen.getByText(/publish blog/i));

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/blogs');
  });
});