import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthNav from '../AuthNav'

const push = jest.fn()
const refresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}))

describe('AuthNav', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    document.cookie = 'access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  it('renders login and signup links when no user is available', () => {
    render(<AuthNav initialUser={null} />)

    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeInTheDocument()
  })

  it('renders the username and logout action when the user is authenticated', () => {
    render(
      <AuthNav
        initialUser={{
          id: 'a450d880-2bc6-4010-bc90-64a36c283b6e',
          username: 'mohit',
          email: 'mohit@example.com',
        }}
      />,
    )

    expect(screen.getByText('mohit')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument()
  })

  it('clears the auth cookie and routes home when logout is clicked', async () => {
    document.cookie = 'access_token=header.payload.signature; path=/'

    const user = userEvent.setup()
    render(
      <AuthNav
        initialUser={{
          id: 'a450d880-2bc6-4010-bc90-64a36c283b6e',
          username: 'mohit',
          email: 'mohit@example.com',
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Logout' }))

    expect(push).toHaveBeenCalledWith('/')
    expect(refresh).toHaveBeenCalledWith()
    expect(document.cookie).not.toContain('access_token=header.payload.signature')
  })
})
