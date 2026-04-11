import { fetchBlogs, fetchBlogContent, createBlog, updateBlog, deleteBlog } from '../api'
import type { BlogMetadata, BlogContent, CreateBlogRequest, UpdateBlogRequest } from '../types'

// Mock fetch globally
global.fetch = jest.fn()

describe('Blog API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchBlogs', () => {
    it('should fetch array of blogs successfully', async () => {
      const mockBlogs: BlogMetadata[] = [
        {
          id: 1,
          title: 'Blog 1',
          slug: 'blog-1',
          status: 'published',
          createdAt: '2026-04-11T00:00:00Z',
        },
        {
          id: 2,
          title: 'Blog 2',
          slug: 'blog-2',
          status: 'draft',
          createdAt: '2026-04-11T01:00:00Z',
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlogs,
      })

      const result = await fetchBlogs()

      expect(result).toEqual(mockBlogs)
      expect(result).toHaveLength(2)
      expect(global.fetch).toHaveBeenCalledWith('/api/blogs')
    })

    it('should handle API response with content wrapper', async () => {
      const mockBlogs: BlogMetadata[] = [
        {
          id: 1,
          title: 'Blog 1',
          slug: 'blog-1',
          status: 'published',
          createdAt: '2026-04-11T00:00:00Z',
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: mockBlogs }),
      })

      const result = await fetchBlogs()

      expect(result).toEqual(mockBlogs)
      expect(result).toHaveLength(1)
    })

    it('should throw error when fetch fails', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      await expect(fetchBlogs()).rejects.toThrow('Failed to fetch blogs')
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      await expect(fetchBlogs()).rejects.toThrow('Network error')
    })

    it('should return empty array for empty response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const result = await fetchBlogs()

      expect(result).toEqual([])
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('fetchBlogContent', () => {
    it('should fetch blog content successfully', async () => {
      const mockContent: BlogContent = {
        postId: 1,
        content: '# Test Blog\n\nThis is test content.',
        format: 'MARKDOWN',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockContent,
      })

      const result = await fetchBlogContent(1)

      expect(result).toEqual(mockContent)
      expect(result.postId).toBe(1)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/blogs/1/content'
      )
    })

    it('should throw error when blog is not found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      await expect(fetchBlogContent(999)).rejects.toThrow('Blog not found')
    })

    it('should call correct endpoint with different blog IDs', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ postId: 5, content: '', format: 'MARKDOWN' }),
      })

      await fetchBlogContent(5)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/blogs/5/content'
      )
    })
  })

  describe('createBlog', () => {
    it('should create a blog successfully', async () => {
      const request: CreateBlogRequest = {
        title: 'New Blog',
        authorId: 1,
        markdown: '# New Blog\n\nContent here',
      }

      const mockResponse: BlogMetadata = {
        id: 3,
        title: 'New Blog',
        slug: 'new-blog',
        status: 'draft',
        createdAt: '2026-04-11T00:00:00Z',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await createBlog(request)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/blogs',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        })
      )
    })

    it('should throw error with custom message on create fail', async () => {
      const request: CreateBlogRequest = {
        title: 'New Blog',
        authorId: 1,
        markdown: '# Content',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Title already exists',
      })

      await expect(createBlog(request)).rejects.toThrow('Title already exists')
    })

    it('should throw fallback error on create fail with no message', async () => {
      const request: CreateBlogRequest = {
        title: 'New Blog',
        authorId: 1,
        markdown: '# Content',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => {
          throw new Error('Cannot read response')
        }
      })

      await expect(createBlog(request)).rejects.toThrow('Failed to create blog')
    })
  })

  describe('updateBlog', () => {
    it('should update a blog successfully', async () => {
      const request: UpdateBlogRequest = {
        title: 'Updated Blog',
        markdown: '# Updated\n\nNew content',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      })

      await updateBlog(1, request)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/blogs/1',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        })
      )
    })

    it('should throw error with custom message on update fail', async () => {
      const request: UpdateBlogRequest = {
        title: 'Updated',
        markdown: '# Content',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Unauthorized',
      })

      await expect(updateBlog(1, request)).rejects.toThrow('Unauthorized')
    })

    it('should throw fallback error on update fail with no message', async () => {
      const request: UpdateBlogRequest = {
        title: 'Updated',
        markdown: '# Content',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => {
          throw new Error('Cannot read response')
        }
      })

      await expect(updateBlog(1, request)).rejects.toThrow('Failed to update blog')
    })

    it('should call correct endpoint with different blog ID', async () => {
      const request: UpdateBlogRequest = {
        title: 'Update',
        markdown: '# Content',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      })

      await updateBlog(42, request)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/blogs/42',
        expect.any(Object)
      )
    })
  })

  describe('deleteBlog', () => {
    it('should delete a blog successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      })

      await deleteBlog(1)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/blogs/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('should throw error with custom message on delete fail', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Blog not found',
      })

      await expect(deleteBlog(999)).rejects.toThrow('Blog not found')
    })

    it('should throw fallback error on delete fail with no message', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => {
          throw new Error('Cannot read response')
        }
      })

      await expect(deleteBlog(1)).rejects.toThrow('Failed to delete blog')
    })

    it('should call correct endpoint with different blog ID', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      })

      await deleteBlog(42)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/blogs/42',
        expect.any(Object)
      )
    })
  })
})
