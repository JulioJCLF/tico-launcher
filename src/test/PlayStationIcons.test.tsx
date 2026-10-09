import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  PSCross,
  PSCircle,
  PSSquare,
  PSTriangle,
  PSButtonBadge,
  ControllerPrompt,
} from '../components/icons/PlayStationIcons';

describe('PlayStationIcons', () => {
  it('renders Cross icon correctly', () => {
    render(<PSCross />);
    const icon = screen.getByTestId('ps-icon-cross');
    expect(icon).toBeInTheDocument();
    expect(icon.tagName.toLowerCase()).toBe('svg');
  });

  it('renders Circle icon correctly', () => {
    render(<PSCircle />);
    const icon = screen.getByTestId('ps-icon-circle');
    expect(icon).toBeInTheDocument();
    expect(icon.tagName.toLowerCase()).toBe('svg');
  });

  it('renders Square icon correctly', () => {
    render(<PSSquare />);
    const icon = screen.getByTestId('ps-icon-square');
    expect(icon).toBeInTheDocument();
    expect(icon.tagName.toLowerCase()).toBe('svg');
  });

  it('renders Triangle icon correctly', () => {
    render(<PSTriangle />);
    const icon = screen.getByTestId('ps-icon-triangle');
    expect(icon).toBeInTheDocument();
    expect(icon.tagName.toLowerCase()).toBe('svg');
  });

  it('renders PSButtonBadge with proper wrapper', () => {
    render(<PSButtonBadge type="cross" />);
    const badge = screen.getByTestId('ps-badge-cross');
    expect(badge).toBeInTheDocument();
    expect(badge.querySelector('svg')).toBeInTheDocument();
  });

  it('renders ControllerPrompt in PlayStation mode with vector badge', () => {
    render(<ControllerPrompt button="square" isPlaystation={true} />);
    const badge = screen.getByTestId('ps-badge-square');
    expect(badge).toBeInTheDocument();
    expect(badge.querySelector('svg')).toBeInTheDocument();
  });

  it('renders ControllerPrompt in Xbox mode with letter fallback', () => {
    render(<ControllerPrompt button="square" isPlaystation={false} />);
    const badge = screen.getByTestId('xbox-badge-square');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toBe('X');
  });

  it('renders shoulder button labels correctly', () => {
    render(<ControllerPrompt button="l1" isPlaystation={true} />);
    expect(screen.getByText('L1')).toBeInTheDocument();

    render(<ControllerPrompt button="l1" isPlaystation={false} />);
    expect(screen.getByText('LB')).toBeInTheDocument();
  });
});
