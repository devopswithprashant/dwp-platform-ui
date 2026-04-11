import type {
  BlogMetadata,
  BlogContent,
  CreateBlogRequest,
  UpdateBlogRequest,
} from '../types'

describe('Blog Types', () => {
  it('should create a valid BlogMetadata object', () => {
    const blog: BlogMetadata = {
      id: 1,
      title: 'Test Blog',
      slug: 'test-blog',
      status: 'published',
      createdAt: '2026-04-11T00:00:00Z',
      publishedAt: '2026-04-11T00:00:00Z',
    }

    expect(blog.id).toBe(1)
    expect(blog.title).toBe('Test Blog')
    expect(blog.slug).toBe('test-blog')
    expect(blog.status).toBe('published')
  })

  it('should create a BlogMetadata without publishedAt', () => {
    const blog: BlogMetadata = {
      id: 2,
      title: 'Draft Blog',
      slug: 'draft-blog',
      status: 'draft',
      createdAt: '2026-04-11T00:00:00Z',
    }

    expect(blog.publishedAt).toBeUndefined()
  })

  it('should create a valid BlogContent object', () => {
    const content: BlogContent = {
      postId: 1,
      content: '# Hello World\n\nThis is a test blog post.',
      format: 'MARKDOWN',
    }

    expect(content.postId).toBe(1)
    expect(content.format).toBe('MARKDOWN')
    expect(content.content).toContain('# Hello World')
  })

  it('should create a valid CreateBlogRequest', () => {
    const request: CreateBlogRequest = {
      title: 'New Blog',
      authorId: 1,
      markdown: '# New Blog\n\nContent here',
    }

    expect(request.title).toBe('New Blog')
    expect(request.authorId).toBe(1)
    expect(request.markdown).toContain('# New Blog')
  })

  it('should create a valid UpdateBlogRequest', () => {
    const request: UpdateBlogRequest = {
      title: 'Updated Blog',
      markdown: '# Updated Content',
    }

    expect(request.title).toBe('Updated Blog')
    expect(request.markdown).toBe('# Updated Content')
  })
})
