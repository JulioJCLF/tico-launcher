import React from 'react';
import type { GameItem } from '../data/sampleGames';
import { Star } from 'lucide-react';

interface GameCardProps {
  game: GameItem;
  isSelected: boolean;
  isFavorite: boolean;
  onClick: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  isSelected,
  isFavorite,
  onClick,
}) => {
  const getPlatformLabel = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'ps1':
        return 'PS1';
      case 'ps2':
        return 'PS2';
      case 'ps3':
        return 'PS3';
      default:
        return platform.toUpperCase();
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex-shrink-0 cursor-pointer transition-all duration-300 ease-out select-none ${
        isSelected
          ? '-translate-y-3 scale-105 z-20'
          : 'scale-95 opacity-70 hover:opacity-100 hover:scale-100 z-10'
      }`}
      style={{
        width: '185px',
        height: '265px',
      }}
    >
      {/* Card Body - Apple Continuous Curvature */}
      <div
        className={`w-full h-full rounded-3xl overflow-hidden relative transition-all duration-300 bg-zinc-900/80 ${
          isSelected
            ? 'ring-2 ring-white shadow-[0_28px_50px_-10px_rgba(0,0,0,0.75)]'
            : 'border border-white/10 shadow-lg'
        }`}
      >
        {/* Cover Art */}
        <img
          src={game.cover_url}
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Subtle Bottom Ambient Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3.5 pointer-events-none">
          <span className="text-xs font-semibold text-white/95 line-clamp-2 leading-tight drop-shadow-sm">
            {game.title}
          </span>
        </div>

        {/* Top Badges (Frosted Glass Pills) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider bg-black/45 backdrop-blur-xl border border-white/20 text-white shadow-sm">
            {getPlatformLabel(game.platform)}
          </span>
          {game.isDemo && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/20 backdrop-blur-xl border border-white/20 text-white/90 shadow-sm">
              Demo
            </span>
          )}
        </div>

        {/* Favorite Icon (Frosted Glass) */}
        {isFavorite && (
          <div className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 text-amber-300 shadow-sm">
            <Star className="w-3 h-3 fill-amber-300" />
          </div>
        )}
      </div>
    </div>
  );
};
