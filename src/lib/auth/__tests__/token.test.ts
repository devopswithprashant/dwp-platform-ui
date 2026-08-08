import {
  ACCESS_TOKEN_COOKIE,
  clearAccessTokenCookie,
  getAccessTokenFromCookieHeader,
  getClientAccessToken,
  setAccessTokenCookie,
} from '../token'

describe('auth.token', () => {
  beforeEach(() => {
    document.cookie = 'access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  it('reads the access token from a cookie header', () => {
    const token = 'header.payload.signature'
    const cookieHeader = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}; other=value`

    expect(getAccessTokenFromCookieHeader(cookieHeader)).toBe(token)
  })

  it('returns null when the access token cookie is absent', () => {
    expect(getAccessTokenFromCookieHeader(undefined)).toBeNull()
    expect(getAccessTokenFromCookieHeader('theme=dark')).toBeNull()
  })

  it('stores and reads the token from document.cookie', () => {
    setAccessTokenCookie('header.payload.signature')

    expect(getClientAccessToken()).toBe('header.payload.signature')
  })

  it('clears the token cookie', () => {
    setAccessTokenCookie('header.payload.signature')
    clearAccessTokenCookie()

    expect(getClientAccessToken()).toBeNull()
  })
})
