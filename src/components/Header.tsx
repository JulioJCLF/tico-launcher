import React, { useEffect, useState } from 'react';
import { Gamepad2, Volume2, VolumeX, Settings as SettingsIcon } from 'lucide-react';
import type { ControllerType } from '../hooks/useGamepad';
import type { PlatformType } from '../data/sampleGames';

export type TabType = 'all' | PlatformType;

interface HeaderProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  controllerConnected: boolean;
  controllerName: string;
  controllerType: ControllerType;
  gameCount: number;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  controllerConnected,
  controllerName,
  controllerType,
  gameCount,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'all', label: 'Todos' },
    { id: 'switch', label: 'Switch' },
    { id: 'snes', label: 'SNES' },
    { id: 'nes', label: 'NES' },
    { id: 'gba', label: 'GBA' },
    { id: 'gbc', label: 'GBC' },
    { id: 'gb', label: 'Game Boy' },
    { id: 'ps1', label: 'PlayStation' },
    { id: 'ps2', label: 'PS2' },
    { id: 'ps3', label: 'PS3' },
  ];

  const isPS = controllerType === 'playstation';

  return (
    <header
      data-tauri-drag-region
      className="relative z-30 flex items-center justify-between px-10 py-5 bg-transparent gap-4"
    >
      {/* Brand */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center shadow-sm">
          <span className="font-semibold text-white text-sm tracking-tight">T</span>
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white/90">Tico</h1>
          <p className="text-[11px] text-zinc-400 font-medium">
            {gameCount} {gameCount === 1 ? 'jogo' : 'jogos'}
          </p>
        </div>
      </div>

      {/* Apple-style Segmented Control */}
      <div className="flex items-center gap-2 max-w-xl xl:max-w-3xl overflow-hidden">
        <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-zinc-400 flex-shrink-0">
          {isPS ? 'L1' : 'LB'}
        </span>

        <div className="flex items-center gap-1 p-1 bg-white/[0.07] backdrop-blur-2xl rounded-full border border-white/10 shadow-inner overflow-x-auto no-scrollbar scroll-smooth">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer flex-shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-zinc-950 font-semibold shadow-sm scale-100'
                    : 'text-zinc-400 hover:text-white font-medium hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-zinc-400 flex-shrink-0">
          {isPS ? 'R1' : 'RB'}
        </span>
      </div>

      {/* Status & Controls */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Gamepad Badge */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium backdrop-blur-xl transition-all ${
            controllerConnected
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-white/5 border-white/10 text-zinc-400'
          }`}
          title={controllerConnected ? `Conectado: ${controllerName}` : 'Nenhum controle detectado'}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {controllerConnected ? (isPS ? 'DualShock / PS4' : 'Xbox Controller') : 'Sem Controle'}
          </span>
        </div>

        {/* Mute/Sound Toggle */}
        <button
          onClick={onToggleSound}
          className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white backdrop-blur-xl border border-white/10 transition-all cursor-pointer"
          title={soundEnabled ? 'Silenciar Efeitos' : 'Ativar Sons'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
        </button>

        {/* Clock */}
        <div className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium backdrop-blur-xl">
          {time}
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white backdrop-blur-xl border border-white/10 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          title="Configurações & Pastas"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
