import { fetchCurrentUser, loginUser, logoutUser } from '../auth.client'
import { ACCESS_TOKEN_COOKIE } from '../token'

describe('auth.client', () => {
  const mockFetch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    document.cookie = 'access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    global.fetch = mockFetch as typeof fetch
  })

  it('logs in and stores a valid JWT in the browser cookie', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          accessToken: 'header.payload.signature',
        },
      }),
    })

    await loginUser({ identifier: 'mohit', password: 'secret123' })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
      }),
    )
    expect(document.cookie).toContain(`${ACCESS_TOKEN_COOKIE}=header.payload.signature`)
  })

  it('throws when login response has no token string', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    })

    await expect(loginUser({ identifier: 'mohit', password: 'secret123' })).rejects.toThrow(
      'Login succeeded but no access token was returned',
    )
  })

  it('throws when token is not a valid 3-part JWT', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { accessToken: 'not-a-jwt' } }),
    })

    await expect(loginUser({ identifier: 'mohit', password: 'secret123' })).rejects.toThrow(
      'Login succeeded but access token format was invalid',
    )
  })

  it('returns null when there is no access token cookie', async () => {
    await expect(fetchCurrentUser()).resolves.toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns null and clears cookie when /me responds with 401', async () => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=header.payload.signature; path=/`

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    })

    await expect(fetchCurrentUser()).resolves.toBeNull()
    expect(document.cookie).not.toContain(ACCESS_TOKEN_COOKIE)
  })

  it('parses the nested /me profile payload and returns the user', async () => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=header.payload.signature; path=/`

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

    await expect(fetchCurrentUser()).resolves.toEqual({
      id: 'a450d880-2bc6-4010-bc90-64a36c283b6e',
      username: 'mohit',
      email: 'mohit@example.com',
    })
  })

  it('clears the access token cookie on logout', () => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=header.payload.signature; path=/`

    logoutUser()

    expect(document.cookie).not.toContain(ACCESS_TOKEN_COOKIE)
  })
})
