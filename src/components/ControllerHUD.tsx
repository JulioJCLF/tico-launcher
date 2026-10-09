import React from 'react';
import type { ControllerType } from '../hooks/useGamepad';
import { ControllerPrompt } from './icons/PlayStationIcons';

interface ControllerHUDProps {
  controllerType: ControllerType;
  inModal: boolean;
}

export const ControllerHUD: React.FC<ControllerHUDProps> = ({
  controllerType,
  inModal,
}) => {
  const isPS = controllerType === 'playstation';

  if (inModal) {
    return (
      <footer className="relative z-30 flex items-center justify-center gap-5 px-8 py-4 bg-transparent">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]">
          <ControllerPrompt button="cross" isPlaystation={isPS} />
          <span className="text-xs font-medium text-zinc-300">Confirmar</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]">
          <ControllerPrompt button="circle" isPlaystation={isPS} />
          <span className="text-xs font-medium text-zinc-300">Fechar</span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative z-30 flex items-center justify-center gap-5 px-8 py-4 bg-transparent">
      {/* Cross - Play */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]">
        <ControllerPrompt button="cross" isPlaystation={isPS} />
        <span className="text-xs font-medium text-zinc-300">Jogar</span>
      </div>

      {/* Square - Details */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]">
        <ControllerPrompt button="square" isPlaystation={isPS} />
        <span className="text-xs font-medium text-zinc-300">Detalhes</span>
      </div>

      {/* Triangle - Favorite */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]">
        <ControllerPrompt button="triangle" isPlaystation={isPS} />
        <span className="text-xs font-medium text-zinc-300">Favorito</span>
      </div>

      {/* L1 / R1 - Switch Tab */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]">
        <ControllerPrompt button="l1" isPlaystation={isPS} />
        <span className="text-[10px] text-zinc-500 font-bold">/</span>
        <ControllerPrompt button="r1" isPlaystation={isPS} />
        <span className="text-xs font-medium text-zinc-300 ml-1">Alternar Sistema</span>
      </div>

      {/* Share / Back - Config */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]">
        <ControllerPrompt button="share" isPlaystation={isPS} />
        <span className="text-xs font-medium text-zinc-300">Config / BIOS</span>
      </div>
    </footer>
  );
};
