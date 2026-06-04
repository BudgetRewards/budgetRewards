import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import { ConfigApp } from '../ConfigApp';

beforeEach(() => localStorage.clear());

describe('ConfigApp', () => {
  test('renders heading and all catalogue categories', () => {
    render(<ConfigApp />);
    expect(screen.getByText(/RootedRewards Config/)).toBeInTheDocument();
    expect(screen.getByText('Contract & Lifecycle')).toBeInTheDocument();
    expect(screen.getByText('App & Data')).toBeInTheDocument();
    expect(screen.getByText('Harvest Hours')).toBeInTheDocument();
    expect(screen.getByText('Energiegedrag')).toBeInTheDocument();
    expect(screen.getByText('Multi-product')).toBeInTheDocument();
  });

  test('renders catalogue item names', () => {
    render(<ConfigApp />);
    expect(screen.getByText('Welkomstbonus')).toBeInTheDocument();
    expect(screen.getByText('Contract verlengd (1 jaar)')).toBeInTheDocument();
    expect(screen.getByText('App geactiveerd')).toBeInTheDocument();
    expect(screen.getByText('Remote uitlezing aangezet')).toBeInTheDocument();
  });

  test('toggling a toggle writes to localStorage', () => {
    render(<ConfigApp />);
    const toggles = screen.getAllByRole('button', { name: /Aan|Uit/ });
    fireEvent.click(toggles[0]);
    const saved = localStorage.getItem('rr-config');
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(Array.isArray(parsed.catalogue)).toBe(true);
  });

  test('Reset button clears localStorage', () => {
    localStorage.setItem('rr-config', JSON.stringify({ catalogue: [] }));
    render(<ConfigApp />);
    fireEvent.click(screen.getByText('Reset'));
    expect(localStorage.getItem('rr-config')).toBeNull();
  });

  test('shows balance in sticky header', () => {
    render(<ConfigApp />);
    expect(screen.getByText(/seeds/)).toBeInTheDocument();
  });
});
