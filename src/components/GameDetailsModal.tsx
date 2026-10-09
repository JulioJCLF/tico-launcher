import React, { useState, useEffect } from 'react';
import type { GameItem } from '../data/sampleGames';
import type { ControllerType } from '../hooks/useGamepad';
import { Play, Star, X, HardDrive, FolderOpen, Gamepad2 } from 'lucide-react';
import { PSCross, PSTriangle, ControllerPrompt } from './icons/PlayStationIcons';
import { getFallbackCover } from '../services/emulatorService';

interface GameDetailsModalProps {
  game: GameItem;
  controllerType: ControllerType;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onLaunch: () => void;
  onClose: () => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  game,
  controllerType,
  isFavorite,
  onToggleFavorite,
  onLaunch,
  onClose,
}) => {
  const fallback = getFallbackCover(game.platform);
  const [imgSrc, setImgSrc] = useState<string>(game.cover_url || fallback);

  useEffect(() => {
    setImgSrc(game.cover_url || fallback);
  }, [game.cover_url, fallback]);

  const isPS = controllerType === 'playstation';

  const getEmulatorName = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'ps1':
        return 'DuckStation (Apple Silicon / Metal)';
      case 'ps2':
        return 'PCSX2 (Metal Native macOS)';
      case 'ps3':
        return 'RPCS3 (MoltenVK / Metal)';
      case 'switch':
        return 'Ryujinx (Nintendo Switch)';
      case 'snes':
        return 'Snes9x (Super Nintendo)';
      case 'nes':
        return 'Mesen / RetroArch (NES)';
      case 'gba':
        return 'mGBA (Game Boy Advance)';
      case 'gbc':
        return 'mGBA (Game Boy Color)';
      case 'gb':
        return 'mGBA (Game Boy)';
      default:
        return 'Emulador Padrão';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xl p-6 animate-fadeIn">
      <div className="relative w-full max-w-xl bg-zinc-900/85 backdrop-blur-3xl border border-white/15 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-xl border border-white/10 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Backdrop */}
        <div className="relative h-52 w-full overflow-hidden bg-black/40">
          <img
            src={imgSrc}
            alt={game.title}
            className="w-full h-full object-cover opacity-35 filter blur-2xl scale-125"
            onError={() => {
              if (fallback && imgSrc !== fallback) setImgSrc(fallback);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-transparent to-transparent" />

          {/* Floating Cover Art */}
          <div className="absolute bottom-5 left-7 flex items-end gap-4">
            <img
              src={imgSrc}
              alt={game.title}
              className="w-24 h-34 object-cover rounded-2xl shadow-2xl border border-white/20"
              onError={() => {
                if (fallback && imgSrc !== fallback) setImgSrc(fallback);
              }}
            />
            <div className="mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-semibold backdrop-blur-xl border border-white/15">
                {game.platform.toUpperCase()}
              </span>
              <h3 className="text-xl font-bold text-white leading-tight mt-1.5 drop-shadow-sm">
                {game.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Body Info */}
        <div className="p-7 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5">
              <span className="text-zinc-400 font-medium block mb-1">Emulador Alvo</span>
              <div className="flex items-center gap-2 font-semibold text-zinc-200">
                <Gamepad2 className="w-4 h-4 opacity-80" />
                <span>{getEmulatorName(game.platform)}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5">
              <span className="text-zinc-400 font-medium block mb-1">Tamanho do Arquivo</span>
              <div className="flex items-center gap-2 font-semibold text-zinc-200">
                <HardDrive className="w-4 h-4 opacity-80" />
                <span>{game.file_size || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5 text-xs">
            <span className="text-zinc-400 font-medium block mb-1">Localização</span>
            <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-300 break-all">
              <FolderOpen className="w-4 h-4 opacity-70 flex-shrink-0" />
              <span>{game.path || '[Título Demo - configure a pasta em Configurações]'}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onLaunch}
              className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-5 h-5 rounded-full bg-zinc-900/10 flex items-center justify-center text-[10px] font-bold text-zinc-800">
                {isPS ? (
                  <PSCross size={11} colored={false} className="text-zinc-900" />
                ) : (
                  'A'
                )}
              </div>
              <Play className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950" />
              <span>JOGAR</span>
            </button>

            <button
              onClick={onToggleFavorite}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-full border text-xs font-medium cursor-pointer transition-all ${
                isFavorite
                  ? 'bg-amber-400/15 border-amber-400/30 text-amber-300'
                  : 'bg-white/10 hover:bg-white/15 border-white/10 text-white/90'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/80">
                {isPS ? (
                  <PSTriangle size={11} colored={true} />
                ) : (
                  'Y'
                )}
              </div>
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-300' : ''}`} />
              <span>{isFavorite ? 'Favorito' : 'Favoritar'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-zinc-400 font-medium">
          <div className="flex items-center gap-2">
            <span>Pressione</span>
            <ControllerPrompt button="circle" isPlaystation={isPS} />
            <span>para voltar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
