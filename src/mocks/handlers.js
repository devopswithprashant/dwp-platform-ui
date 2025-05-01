import { rest } from 'msw';

export const handlers = [
  // Get all blogs
  rest.get('http://localhost:8080/api/blogs', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 1,
          title: 'Test Blog',
          content: 'Test content',
          author: 'Test Author',
          createDate: '2024-01-01T00:00:00.000Z',
          lastModifiedDate: '2024-01-01T00:00:00.000Z'
        }
      ])
    );
  }),

  // Create blog
  rest.post('http://localhost:8080/api/blogs', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({ ...req.body, id: 2 })
    );
  }),

  // Update blog
  rest.put('http://localhost:8080/api/blogs/:id', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({ ...req.body, id: 1 })
    );
  }),

  // Delete blog
  rest.delete('http://localhost:8080/api/blogs/1', (req, res, ctx) => {
    return res(ctx.status(204));
  })
];