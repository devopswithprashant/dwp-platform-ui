import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterPage from '../page'

const push = jest.fn()
const refresh = jest.fn()
const registerUser = jest.fn()
const loginUser = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}))

jest.mock('@/lib/auth/auth.client', () => ({
  registerUser: (...args: unknown[]) => registerUser(...args),
  loginUser: (...args: unknown[]) => loginUser(...args),
}))

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('registers and then logs the user in', async () => {
    registerUser.mockResolvedValueOnce(undefined)
    loginUser.mockResolvedValueOnce(undefined)

    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/username/i), 'rohit')
    await user.type(screen.getByLabelText(/email/i), 'rohit@example.com')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(registerUser).toHaveBeenCalledWith({
      username: 'rohit',
      email: 'rohit@example.com',
      password: 'secret123',
    })
    expect(loginUser).toHaveBeenCalledWith({
      identifier: 'rohit',
      password: 'secret123',
    })
    expect(push).toHaveBeenCalledWith('/')
    expect(refresh).toHaveBeenCalledWith()
  })

  it('shows an error when registration fails', async () => {
    registerUser.mockRejectedValueOnce(new Error('Email already exists'))

    const user = userEvent.setup()
    render(<RegisterPage />)

    await user.type(screen.getByLabelText(/username/i), 'rohit')
    await user.type(screen.getByLabelText(/email/i), 'rohit@example.com')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(await screen.findByText('Email already exists')).toBeInTheDocument()
  })
})
