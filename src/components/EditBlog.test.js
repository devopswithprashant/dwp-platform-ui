import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditBlog from './EditBlog';

// Mock hooks and axios
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('axios');

describe('EditBlog Component', () => {
  const mockNavigate = jest.fn();
  const mockBlog = {
    id: 1,
    title: 'Test Blog',
    content: 'Original Content',
    author: 'Test Author',
    createDate: '2024-01-01T00:00:00.000Z',
    lastModifiedDate: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    useParams.mockReturnValue({ id: '1' });
    useNavigate.mockReturnValue(mockNavigate);
    axios.get.mockResolvedValue({ data: mockBlog });
    axios.put.mockResolvedValue({ data: { ...mockBlog, title: 'Updated Blog' } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders edit form with existing data', async () => {
    render(<EditBlog />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Blog')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Original Content')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Author')).toBeInTheDocument();
    });
  });

  test('updates blog on form submission', async () => {
    render(<EditBlog />);

    await waitFor(async () => {
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Updated Blog' } });
      fireEvent.click(screen.getByText(/update blog/i));
    });

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:8080/api/blogs/1',
        expect.objectContaining({
          title: 'Updated Blog',
          content: 'Original Content',
          author: 'Test Author'
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/blogs/1');
    });
  });

  test('shows error when update fails', async () => {
    axios.put.mockRejectedValue(new Error('Update failed'));
    render(<EditBlog />);

    await waitFor(async () => {
      fireEvent.click(screen.getByText(/update blog/i));
    });

    expect(await screen.findByText(/failed to update blog/i)).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    render(<EditBlog />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(<EditBlog />);
    
    await waitFor(async () => {
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: '' } });
      fireEvent.click(screen.getByText(/update blog/i));
      expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    });
  });
});