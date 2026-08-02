import { getAuthUser, isAuthenticated } from '../auth.server'
import { ACCESS_TOKEN_COOKIE } from '../token'

const mockCookies = jest.fn()
const mockFetch = jest.fn()

jest.mock('next/headers', () => ({
  cookies: () => mockCookies(),
}))

describe('auth.server', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = mockFetch as typeof fetch
  })

  it('returns null when no access token cookie is present', async () => {
    mockCookies.mockResolvedValue({
      get: () => undefined,
    })

    await expect(getAuthUser()).resolves.toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns the parsed user when /me responds with a nested profile payload', async () => {
    mockCookies.mockResolvedValue({
      get: () => ({ value: 'header.payload.signature' }),
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 42,
          username: 'mohit',
          email: 'mohit@example.com',
        },
      }),
    })

    await expect(getAuthUser()).resolves.toEqual({
      id: 42,
      username: 'mohit',
      email: 'mohit@example.com',
    })
  })

  it('returns false from isAuthenticated when the user is not resolved', async () => {
    mockCookies.mockResolvedValue({
      get: () => undefined,
    })

    await expect(isAuthenticated()).resolves.toBe(false)
  })

  it('returns true when the user resolves successfully', async () => {
    mockCookies.mockResolvedValue({
      get: () => ({ value: 'header.payload.signature' }),
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: 'a450d880-2bc6-4010-bc90-64a36c283b6e',
          username: 'mohit',
          email: 'mohit@example.com',
        },
      }),
    })

    await expect(isAuthenticated()).resolves.toBe(true)
  })

  it('passes the bearer token through to the auth /me endpoint', async () => {
    mockCookies.mockResolvedValue({
      get: () => ({ value: 'header.payload.signature' }),
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 7, username: 'mohit', email: 'mohit@example.com' } }),
    })

    await getAuthUser()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/me'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer header.payload.signature' },
        cache: 'no-store',
      }),
    )
    expect(ACCESS_TOKEN_COOKIE).toBe('access_token')
  })
})
