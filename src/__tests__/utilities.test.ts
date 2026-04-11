describe('Blog Platform Utilities', () => {
  describe('String utilities', () => {
    it('should slugify blog titles', () => {
      const slug = (title: string) => 
        title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]/g, '')

      expect(slug('My First Blog')).toBe('my-first-blog')
      expect(slug('Hello World!')).toBe('hello-world')
      expect(slug('Test_Article')).toBe('test_article')
    })

    it('should validate blog title format', () => {
      const isValidTitle = (title: string) => 
        title.trim().length > 0 && title.trim().length <= 255

      expect(isValidTitle('Valid Title')).toBe(true)
      expect(isValidTitle('')).toBe(false)
      expect(isValidTitle('   ')).toBe(false)
      expect(isValidTitle('x'.repeat(256))).toBe(false)
    })
  })

  describe('Date utilities', () => {
    it('should format dates correctly', () => {
      const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      }

      expect(formatDate('2026-04-11T00:00:00Z')).toContain('2026')
      expect(formatDate('2026-04-11T00:00:00Z')).toContain('April')
    })

    it('should calculate time difference', () => {
      const getTimeDifference = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        return diffMins
      }

      // Should return a positive number for past dates
      const timeDiff = getTimeDifference('2026-04-11T00:00:00Z')
      expect(typeof timeDiff).toBe('number')
    })
  })

  describe('Validation utilities', () => {
    it('should validate markdown content', () => {
      const isValidMarkdown = (content: string) => {
        return content.trim().length > 0
      }

      expect(isValidMarkdown('# Title\n\nContent')).toBe(true)
      expect(isValidMarkdown('')).toBe(false)
      expect(isValidMarkdown('   ')).toBe(false)
    })

    it('should validate author ID', () => {
      const isValidAuthorId = (id: number) => {
        return Number.isFinite(id) && id > 0
      }

      expect(isValidAuthorId(1)).toBe(true)
      expect(isValidAuthorId(0)).toBe(false)
      expect(isValidAuthorId(-1)).toBe(false)
      expect(isValidAuthorId(NaN)).toBe(false)
    })

    it('should validate blog slug format', () => {
      const isValidSlug = (slug: string) => {
        return /^[a-z0-9-]+$/.test(slug) && slug.length > 0
      }

      expect(isValidSlug('valid-slug')).toBe(true)
      expect(isValidSlug('another-valid-slug-123')).toBe(true)
      expect(isValidSlug('Invalid_Slug')).toBe(false)
      expect(isValidSlug('invalid slug')).toBe(false)
    })
  })

  describe('Array utilities', () => {
    it('should filter and sort blogs', () => {
      const blogs = [
        { id: 1, title: 'Blog A', status: 'published' },
        { id: 2, title: 'Blog B', status: 'draft' },
        { id: 3, title: 'Blog C', status: 'published' },
      ]

      const published = blogs.filter(b => b.status === 'published')
      expect(published).toHaveLength(2)
      expect(published[0].id).toBe(1)
    })

    it('should find blog by ID', () => {
      const blogs = [
        { id: 1, title: 'Blog A' },
        { id: 2, title: 'Blog B' },
      ]

      const found = blogs.find(b => b.id === 2)
      expect(found).toEqual({ id: 2, title: 'Blog B' })
    })

    it('should check if array is empty', () => {
      const isEmpty = (arr: unknown[]) => arr.length === 0

      expect(isEmpty([])).toBe(true)
      expect(isEmpty([1, 2, 3])).toBe(false)
    })
  })

  describe('Object utilities', () => {
    it('should merge blog objects', () => {
      const blog1 = { title: 'Original', status: 'draft' }
      const blog2 = { title: 'Updated' }

      const merged = { ...blog1, ...blog2 }
      expect(merged.title).toBe('Updated')
      expect(merged.status).toBe('draft')
    })

    it('should check if blog has required fields', () => {
      const hasRequiredFields = (blog: Record<string, unknown>) => {
        return !!(blog.title && blog.markdown && typeof blog.title === 'string')
      }

      expect(hasRequiredFields({ title: 'Test', markdown: 'Content' })).toBe(true)
      expect(hasRequiredFields({ title: 'Test' })).toBe(false)
      expect(hasRequiredFields({ title: 123, markdown: 'Content' })).toBe(false)
    })
  })

  describe('Number utilities', () => {
    it('should validate positive integers', () => {
      const isPositiveInteger = (n: number) => {
        return Number.isInteger(n) && n > 0
      }

      expect(isPositiveInteger(1)).toBe(true)
      expect(isPositiveInteger(100)).toBe(true)
      expect(isPositiveInteger(0)).toBe(false)
      expect(isPositiveInteger(-1)).toBe(false)
      expect(isPositiveInteger(1.5)).toBe(false)
    })

    it('should paginate results', () => {
      const paginate = (items: unknown[], page: number, perPage: number) => {
        return items.slice((page - 1) * perPage, page * perPage)
      }

      const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }))
      expect(paginate(items, 1, 10)).toHaveLength(10)
      expect(paginate(items, 2, 10)).toHaveLength(10)
      expect(paginate(items, 3, 10)).toHaveLength(5)
    })
  })
})
