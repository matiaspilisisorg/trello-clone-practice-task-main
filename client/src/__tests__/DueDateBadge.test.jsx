import { render, screen } from '@testing-library/react';
import DueDateBadge from '../components/DueDateBadge.jsx';

describe('DueDateBadge', () => {
  it('returns null when no date is provided', () => {
    const { container } = render(<DueDateBadge date={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a red badge when the date is in the past (overdue)', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);

    render(<DueDateBadge date={pastDate.toISOString()} />);

    const badge = screen.getByText(
      pastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    expect(badge.closest('span')).toHaveClass('bg-red-500');
    expect(badge.closest('span')).toHaveClass('text-white');
  });

  it('renders a yellow badge when the date is today', () => {
    const today = new Date();

    render(<DueDateBadge date={today.toISOString()} />);

    const formatted = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const badge = screen.getByText(formatted);
    expect(badge.closest('span')).toHaveClass('bg-yellow-400');
    expect(badge.closest('span')).toHaveClass('text-gray-900');
  });

  it('renders a grey badge when the date is in the future', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    render(<DueDateBadge date={futureDate.toISOString()} />);

    const formatted = futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const badge = screen.getByText(formatted);
    expect(badge.closest('span')).toHaveClass('bg-gray-200');
    expect(badge.closest('span')).toHaveClass('text-gray-700');
  });

  it('renders a red badge for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    render(<DueDateBadge date={yesterday.toISOString()} />);

    const formatted = yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const badge = screen.getByText(formatted);
    expect(badge.closest('span')).toHaveClass('bg-red-500');
  });

  it('renders a grey badge for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    render(<DueDateBadge date={tomorrow.toISOString()} />);

    const formatted = tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const badge = screen.getByText(formatted);
    expect(badge.closest('span')).toHaveClass('bg-gray-200');
  });

  it('displays the formatted date text', () => {
    const date = new Date(2025, 5, 15); // June 15, 2025

    render(<DueDateBadge date={date.toISOString()} />);

    expect(screen.getByText('Jun 15')).toBeInTheDocument();
  });

  it('contains a clock icon SVG', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const { container } = render(<DueDateBadge date={futureDate.toISOString()} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('w-3', 'h-3');
  });
});
