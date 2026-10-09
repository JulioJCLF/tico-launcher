import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameCard } from '../components/GameCard';
import type { GameItem } from '../data/sampleGames';

const mockGame: GameItem = {
  id: 'ps2-god-of-war',
  title: 'God of War II',
  platform: 'ps2',
  cover_url: 'https://example.com/gow2.jpg',
  year: '2007',
  genre: 'Action-Adventure',
  file_size: '7.9 GB',
  path: '/mock/path/gow2.iso',
  isDemo: false,
};

describe('GameCard', () => {
  it('renders game title and platform badge', () => {
    render(
      <GameCard
        game={mockGame}
        isSelected={false}
        isFavorite={false}
        onClick={() => {}}
      />
    );

    expect(screen.getByText('God of War II')).toBeInTheDocument();
    expect(screen.getByText('PS2')).toBeInTheDocument();
  });

  it('triggers onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <GameCard
        game={mockGame}
        isSelected={false}
        isFavorite={false}
        onClick={handleClick}
      />
    );

    const card = screen.getByText('God of War II');
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies selected focus ring styling when isSelected is true', () => {
    const { container } = render(
      <GameCard
        game={mockGame}
        isSelected={true}
        isFavorite={false}
        onClick={() => {}}
      />
    );

    const cardContainer = container.querySelector('.ring-2.ring-white');
    expect(cardContainer).toBeInTheDocument();
  });

  it('shows demo badge when isDemo is true', () => {
    const demoGame = { ...mockGame, isDemo: true };
    render(
      <GameCard
        game={demoGame}
        isSelected={false}
        isFavorite={false}
        onClick={() => {}}
      />
    );

    expect(screen.getByText('Demo')).toBeInTheDocument();
  });
});
