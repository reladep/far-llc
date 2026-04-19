import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FirmRow from '@/components/dashboard/FirmRow';
import type { FirmRowData } from '@/components/dashboard/FirmRow';

// Minimal mock for next/link — renders as <a>
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const baseFirm: FirmRowData = {
  crd: 12345,
  name: 'ACME Wealth Management LLC',
  displayName: 'Acme Wealth',
  city: 'New York',
  state: 'NY',
  aum: '$1.2B',
  visorScore: 75,
};

describe('FirmRow', () => {
  it('renders the display name when available', () => {
    render(<FirmRow firm={baseFirm} />);
    expect(screen.getByText('Acme Wealth')).toBeInTheDocument();
  });

  it('falls back to legal name when no displayName', () => {
    const firm = { ...baseFirm, displayName: undefined };
    render(<FirmRow firm={firm} />);
    expect(screen.getByText('ACME Wealth Management LLC')).toBeInTheDocument();
  });

  it('links to the correct firm profile page', () => {
    render(<FirmRow firm={baseFirm} />);
    const link = screen.getByRole('link', { name: 'Acme Wealth' });
    expect(link).toHaveAttribute('href', '/firm/12345');
  });

  it('displays location as "City, State"', () => {
    render(<FirmRow firm={baseFirm} />);
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
  });

  it('displays AUM', () => {
    render(<FirmRow firm={baseFirm} />);
    expect(screen.getByText('$1.2B AUM')).toBeInTheDocument();
  });

  it('omits location when city and state are null', () => {
    const firm = { ...baseFirm, city: null, state: null };
    render(<FirmRow firm={firm} />);
    expect(screen.queryByText(',')).not.toBeInTheDocument();
  });

  it('renders only state when city is null', () => {
    const firm = { ...baseFirm, city: null, state: 'CA' };
    render(<FirmRow firm={firm} />);
    expect(screen.getByText('CA')).toBeInTheDocument();
  });

  it('omits AUM when empty string', () => {
    const firm = { ...baseFirm, aum: '' };
    render(<FirmRow firm={firm} />);
    expect(screen.queryByText('AUM')).not.toBeInTheDocument();
  });

  it('renders score ring with correct numeric value', () => {
    render(<FirmRow firm={baseFirm} />);
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('renders green color for score >= 70', () => {
    render(<FirmRow firm={{ ...baseFirm, visorScore: 70 }} />);
    const scoreLabel = screen.getByText('70');
    expect(scoreLabel).toHaveStyle({ color: '#2DBD74' });
  });

  it('renders amber color for score 50–69', () => {
    render(<FirmRow firm={{ ...baseFirm, visorScore: 55 }} />);
    const scoreLabel = screen.getByText('55');
    expect(scoreLabel).toHaveStyle({ color: '#F59E0B' });
  });

  it('renders red color for score < 50', () => {
    render(<FirmRow firm={{ ...baseFirm, visorScore: 30 }} />);
    const scoreLabel = screen.getByText('30');
    expect(scoreLabel).toHaveStyle({ color: '#EF4444' });
  });

  it('renders "—" when score is null', () => {
    const firm = { ...baseFirm, visorScore: null };
    render(<FirmRow firm={firm} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('clamps score to 0–100 range', () => {
    render(<FirmRow firm={{ ...baseFirm, visorScore: 150 }} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<FirmRow firm={baseFirm} className="do-recent-row" />);
    const row = container.querySelector('.fr-row');
    expect(row).toHaveClass('do-recent-row');
  });

  it('renders leading and trailing content', () => {
    render(
      <FirmRow
        firm={baseFirm}
        leading={<span data-testid="lead">✓</span>}
        trailing={<span data-testid="trail">88%</span>}
      />
    );
    expect(screen.getByTestId('lead')).toBeInTheDocument();
    expect(screen.getByTestId('trail')).toBeInTheDocument();
  });
});
