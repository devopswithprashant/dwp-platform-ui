import { render, screen, act } from '@testing-library/react';
import PrettyTime from './PrettyTime';

describe('PrettyTime', () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders "just now" for current timestamp', () => {
    const now = new Date();
    render(<PrettyTime timestamp={now.toISOString()} />);
    expect(
      screen.getByText(/less than a minute ago|just now/i)
    ).toBeInTheDocument();
  });

  it('renders correct time difference for past timestamp', () => {
    // 5 minutes ago
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    render(<PrettyTime timestamp={fiveMinutesAgo.toISOString()} />);
    expect(screen.getByText(/5 minutes ago/)).toBeInTheDocument();
  });

  it('updates the time every minute', async () => {
    jest.useFakeTimers();
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    render(<PrettyTime timestamp={oneMinuteAgo.toISOString()} />);
    expect(screen.getByText(/1 minute ago/)).toBeInTheDocument();

    // Advance 1 minute and wait for UI update
    await act(async () => {
      jest.advanceTimersByTime(60 * 1000);
    });

    expect(await screen.findByText(/2 minutes ago/)).toBeInTheDocument();
  });
});