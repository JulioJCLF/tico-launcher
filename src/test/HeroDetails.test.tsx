import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroDetails } from '../components/HeroDetails';
import type { GameItem } from '../data/sampleGames';

const mockGame: GameItem = {
  id: 'ps1-crash-bandicoot',
  title: 'Crash Bandicoot 3: Warped',
  platform: 'ps1',
  cover_url: 'https://example.com/crash3.jpg',
  year: '1998',
  genre: 'Platformer',
  file_size: '480 MB',
  path: '/mock/path/crash3.iso',
  isDemo: false,
};

describe('HeroDetails', () => {
  it('renders game title and platform label', () => {
    render(
      <HeroDetails
        game={mockGame}
        controllerType="playstation"
        onLaunch={() => {}}
        onOpenDetails={() => {}}
        isLaunching={false}
        statusMessage={null}
      />
    );

    expect(screen.getByText('Crash Bandicoot 3: Warped')).toBeInTheDocument();
    expect(screen.getByText('PlayStation')).toBeInTheDocument();
    expect(screen.getByText('1998')).toBeInTheDocument();
    expect(screen.getByText('Platformer')).toBeInTheDocument();
  });

  it('triggers onLaunch when Play button is clicked', async () => {
    const handleLaunch = vi.fn();
    const user = userEvent.setup();

    render(
      <HeroDetails
        game={mockGame}
        controllerType="playstation"
        onLaunch={handleLaunch}
        onOpenDetails={() => {}}
        isLaunching={false}
        statusMessage={null}
      />
    );

    const playBtn = screen.getByRole('button', { name: /jogar/i });
    await user.click(playBtn);
    expect(handleLaunch).toHaveBeenCalledTimes(1);
  });

  it('triggers onOpenDetails when Details button is clicked', async () => {
    const handleDetails = vi.fn();
    const user = userEvent.setup();

    render(
      <HeroDetails
        game={mockGame}
        controllerType="playstation"
        onLaunch={() => {}}
        onOpenDetails={handleDetails}
        isLaunching={false}
        statusMessage={null}
      />
    );

    const detailsBtn = screen.getByRole('button', { name: /detalhes/i });
    await user.click(detailsBtn);
    expect(handleDetails).toHaveBeenCalledTimes(1);
  });

  it('displays notification message when statusMessage is provided', () => {
    render(
      <HeroDetails
        game={mockGame}
        controllerType="playstation"
        onLaunch={() => {}}
        onOpenDetails={() => {}}
        isLaunching={false}
        statusMessage="Iniciando emulador..."
      />
    );

    expect(screen.getByText('Iniciando emulador...')).toBeInTheDocument();
  });

  it('correctly labels Nintendo platforms including Switch and SNES', () => {
    const marioSwitch: GameItem = {
      id: 'switch-mario-odyssey',
      title: 'Super Mario Odyssey',
      platform: 'switch',
      cover_url: 'https://example.com/smo.jpg',
      path: '/mock/smo.nsp',
      isDemo: true,
    };

    const { rerender } = render(
      <HeroDetails
        game={marioSwitch}
        controllerType="playstation"
        onLaunch={() => {}}
        onOpenDetails={() => {}}
        isLaunching={false}
        statusMessage={null}
      />
    );

    expect(screen.getByText('Nintendo Switch')).toBeInTheDocument();

    const marioSnes: GameItem = {
      id: 'snes-smw',
      title: 'Super Mario World',
      platform: 'snes',
      cover_url: 'https://example.com/smw.jpg',
      path: '/mock/smw.sfc',
      isDemo: true,
    };

    rerender(
      <HeroDetails
        game={marioSnes}
        controllerType="playstation"
        onLaunch={() => {}}
        onOpenDetails={() => {}}
        isLaunching={false}
        statusMessage={null}
      />
    );

    expect(screen.getByText('Super Nintendo (SNES)')).toBeInTheDocument();
  });
});
