import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameDetailsModal } from '../components/GameDetailsModal';
import type { GameItem } from '../data/sampleGames';

const mockGame: GameItem = {
  id: 'ps2-shadow-colossus',
  title: 'Shadow of the Colossus',
  platform: 'ps2',
  cover_url: 'https://example.com/sotc.jpg',
  year: '2005',
  genre: 'Action-Adventure',
  file_size: '3.8 GB',
  path: '/mock/path/sotc.iso',
  isDemo: false,
};

describe('GameDetailsModal', () => {
  it('renders game title and emulator info for PS2', () => {
    render(
      <GameDetailsModal
        game={mockGame}
        controllerType="playstation"
        isFavorite={false}
        onToggleFavorite={() => {}}
        onLaunch={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Shadow of the Colossus')).toBeInTheDocument();
    expect(screen.getByText(/PCSX2/)).toBeInTheDocument();
    expect(screen.getByText('3.8 GB')).toBeInTheDocument();
  });

  it('triggers onToggleFavorite when favorite button clicked', async () => {
    const handleToggle = vi.fn();
    const user = userEvent.setup();

    render(
      <GameDetailsModal
        game={mockGame}
        controllerType="playstation"
        isFavorite={false}
        onToggleFavorite={handleToggle}
        onLaunch={() => {}}
        onClose={() => {}}
      />
    );

    const favBtn = screen.getByRole('button', { name: /favorit/i });
    await user.click(favBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when close button clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    const { container } = render(
      <GameDetailsModal
        game={mockGame}
        controllerType="playstation"
        isFavorite={false}
        onToggleFavorite={() => {}}
        onLaunch={() => {}}
        onClose={handleClose}
      />
    );

    // The X icon close button in modal header
    const closeBtn = container.querySelector('button.absolute.top-5.right-5');
    expect(closeBtn).toBeInTheDocument();
    if (closeBtn) {
      await user.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    }
  });
});
