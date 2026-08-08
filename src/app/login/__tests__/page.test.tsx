import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../page'

const push = jest.fn()
const refresh = jest.fn()
const loginUser = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => ({ get: () => '/blogs/new' }),
}))

jest.mock('@/lib/auth/auth.client', () => ({
  loginUser: (...args: unknown[]) => loginUser(...args),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('submits the login form and redirects to the callback URL', async () => {
    loginUser.mockResolvedValueOnce(undefined)

    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText(/username or email/i), 'mohit')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(loginUser).toHaveBeenCalledWith({
      identifier: 'mohit',
      password: 'secret123',
    })
    expect(push).toHaveBeenCalledWith('/blogs/new')
    expect(refresh).toHaveBeenCalledWith()
  })

  it('shows an error if the login request fails', async () => {
    loginUser.mockRejectedValueOnce(new Error('Invalid credentials'))

    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText(/username or email/i), 'mohit')
    await user.type(screen.getByLabelText(/password/i), 'badpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
  })
})
