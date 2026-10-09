import React from 'react';
import type { GameItem } from '../data/sampleGames';
import type { ControllerType } from '../hooks/useGamepad';
import { Play, Info, HardDrive, Calendar, Tag } from 'lucide-react';
import { PSCross, ControllerPrompt } from './icons/PlayStationIcons';

interface HeroDetailsProps {
  game: GameItem | null;
  controllerType: ControllerType;
  onLaunch: () => void;
  onOpenDetails: () => void;
  isLaunching: boolean;
  statusMessage: string | null;
}

export const HeroDetails: React.FC<HeroDetailsProps> = ({
  game,
  controllerType,
  onLaunch,
  onOpenDetails,
  isLaunching,
  statusMessage,
}) => {
  if (!game) {
    return (
      <div className="relative z-10 flex-1 flex items-center justify-center text-zinc-500 font-medium text-sm">
        Nenhum jogo selecionado
      </div>
    );
  }

  const isPS = controllerType === 'playstation';

  const getPlatformLabel = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'ps1':
        return 'PlayStation';
      case 'ps2':
        return 'PlayStation 2';
      case 'ps3':
        return 'PlayStation 3';
      case 'switch':
        return 'Nintendo Switch';
      case 'snes':
        return 'Super Nintendo (SNES)';
      case 'nes':
        return 'Nintendo (NES)';
      case 'gba':
        return 'Game Boy Advance';
      case 'gbc':
        return 'Game Boy Color';
      case 'gb':
        return 'Game Boy';
      default:
        return platform.toUpperCase();
    }
  };

  return (
    <div className="relative z-10 px-14 pt-6 pb-2 flex flex-col justify-end min-h-[300px]">
      {/* Soft Ambient Artwork Glow (Apple TV Style) */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center transition-all duration-700 ease-out opacity-20 filter blur-3xl scale-125 pointer-events-none"
        style={{ backgroundImage: `url(${game.cover_url})` }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/70 to-transparent pointer-events-none" />

      {/* Metadata Pills */}
      <div className="flex items-center gap-2 mb-3">
        <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/10 text-xs font-semibold backdrop-blur-xl">
          {getPlatformLabel(game.platform)}
        </span>

        {game.year && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 backdrop-blur-xl">
            <Calendar className="w-3.5 h-3.5 opacity-60" />
            <span>{game.year}</span>
          </div>
        )}

        {game.genre && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 backdrop-blur-xl">
            <Tag className="w-3.5 h-3.5 opacity-60" />
            <span>{game.genre}</span>
          </div>
        )}

        {game.file_size && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 backdrop-blur-xl">
            <HardDrive className="w-3.5 h-3.5 opacity-60" />
            <span>{game.file_size}</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h2 className="text-3xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-sm mb-5 max-w-3xl line-clamp-2">
        {game.title}
      </h2>

      {/* Apple-style Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Play Button - Solid White Apple Pill */}
        <button
          onClick={onLaunch}
          disabled={isLaunching}
          className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-sm shadow-xl shadow-black/20 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="w-5 h-5 rounded-full bg-zinc-900/10 flex items-center justify-center text-xs font-bold text-zinc-800">
            {isPS ? (
              <PSCross size={11} colored={false} className="text-zinc-900" />
            ) : (
              'A'
            )}
          </div>
          <Play className="w-4 h-4 fill-zinc-950 text-zinc-950" />
          <span>{isLaunching ? 'Iniciando...' : 'Jogar'}</span>
        </button>

        {/* Details Button - Frosted Glass Pill */}
        <button
          onClick={onOpenDetails}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 hover:text-white font-medium text-sm backdrop-blur-2xl border border-white/15 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <ControllerPrompt button="square" isPlaystation={isPS} />
          <Info className="w-4 h-4 opacity-80" />
          <span>Detalhes</span>
        </button>

        {/* Status notification */}
        {statusMessage && (
          <div className="px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-2xl border border-white/15 text-zinc-200 text-xs font-medium animate-fadeIn">
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};
