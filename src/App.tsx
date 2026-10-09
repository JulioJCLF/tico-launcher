import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SAMPLE_GAMES } from './data/sampleGames';
import type { GameItem } from './data/sampleGames';
import { useGamepad } from './hooks/useGamepad';
import { sfx } from './utils/sfx';
import { Header, type TabType } from './components/Header';
import { HeroDetails } from './components/HeroDetails';
import { GameCard } from './components/GameCard';
import { ControllerHUD } from './components/ControllerHUD';
import { SettingsModal } from './components/SettingsModal';
import { GameDetailsModal } from './components/GameDetailsModal';
import type { AppConfig, EmulatorStatus } from './services/emulatorService';
import {
  fetchConfig,
  saveAppConfig,
  scanLocalRoms,
  checkEmulators,
  launchGameRom,
  scrapeAllCovers,
} from './services/emulatorService';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [localGames, setLocalGames] = useState<GameItem[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);

  const [config, setConfig] = useState<AppConfig>({
    ps1_rom_dir: '~/Games/ROMs/PS1',
    ps2_rom_dir: '~/Games/ROMs/PS2',
    ps3_rom_dir: '~/Games/ROMs/PS3',
    switch_rom_dir: '~/Games/ROMs/Switch',
    snes_rom_dir: '~/Games/ROMs/SNES',
    nes_rom_dir: '~/Games/ROMs/NES',
    gba_rom_dir: '~/Games/ROMs/GBA',
    gbc_rom_dir: '~/Games/ROMs/GBC',
    gb_rom_dir: '~/Games/ROMs/GB',
    favorites: [],
    recent_games: [],
  });

  const [emulatorStatus, setEmulatorStatus] = useState<EmulatorStatus>({
    ps1_installed: false,
    ps1_path: '/Applications/DuckStation.app',
    ps2_installed: false,
    ps2_path: '/Applications/PCSX2.app',
    ps3_installed: false,
    ps3_path: '/Applications/RPCS3.app',
    switch_installed: false,
    switch_path: '/Applications/Ryujinx.app',
    snes_installed: false,
    snes_path: '/Applications/Snes9x.app',
    nes_installed: false,
    nes_path: '/Applications/Mesen.app',
    mgba_installed: false,
    mgba_path: '/Applications/mGBA.app',
  });

  const carouselRef = useRef<HTMLDivElement>(null);

  // Combine local scanned games with sample games if local is empty
  const allGames = useMemo(() => {
    if (localGames.length > 0) {
      return localGames;
    }
    return SAMPLE_GAMES;
  }, [localGames]);

  // Filter games based on current active tab
  const filteredGames = useMemo(() => {
    if (activeTab === 'all') return allGames;
    return allGames.filter((g) => g.platform.toLowerCase() === activeTab);
  }, [allGames, activeTab]);

  // Safely clamp selected index
  const safeIndex = Math.min(Math.max(0, selectedIndex), Math.max(0, filteredGames.length - 1));
  const selectedGame = filteredGames[safeIndex] || null;

  const showNotification = useCallback((msg: string, duration = 3500) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, duration);
  }, []);

  // Scan ROMs from directories
  const scanAllFolders = useCallback(async (currentConfig: AppConfig) => {
    showNotification('Escaneando pastas de ROMs...');
    try {
      const [ps1, ps2, ps3, sw, snes, nes, gba, gbc, gb] = await Promise.all([
        scanLocalRoms('ps1', currentConfig.ps1_rom_dir),
        scanLocalRoms('ps2', currentConfig.ps2_rom_dir),
        scanLocalRoms('ps3', currentConfig.ps3_rom_dir),
        scanLocalRoms('switch', currentConfig.switch_rom_dir),
        scanLocalRoms('snes', currentConfig.snes_rom_dir),
        scanLocalRoms('nes', currentConfig.nes_rom_dir),
        scanLocalRoms('gba', currentConfig.gba_rom_dir),
        scanLocalRoms('gbc', currentConfig.gbc_rom_dir),
        scanLocalRoms('gb', currentConfig.gb_rom_dir),
      ]);
      const combined = [...ps1, ...ps2, ...ps3, ...sw, ...snes, ...nes, ...gba, ...gbc, ...gb];
      if (combined.length > 0) {
        setLocalGames(combined);
        showNotification(`✓ ${combined.length} jogos encontrados nas suas pastas!`);
      } else {
        setLocalGames([]);
        showNotification('Nenhuma ROM encontrada nas pastas configuradas. Exibindo jogos de demonstração.');
      }
    } catch {
      showNotification('Erro ao escanear pastas.');
    }
  }, [showNotification]);

  const handleScrapeCovers = useCallback(async () => {
    setIsScraping(true);
    setScrapeMessage(null);
    showNotification('Buscando e baixando capas no repositório Libretro...');
    try {
      const res = await scrapeAllCovers();
      setScrapeMessage(res.message);
      showNotification(res.message, 4500);
      await scanAllFolders(config);
    } catch {
      setScrapeMessage('Falha ao baixar capas da web.');
      showNotification('Falha ao baixar capas da web.');
    } finally {
      setIsScraping(false);
    }
  }, [config, scanAllFolders, showNotification]);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const loadedConfig = await fetchConfig();
        setConfig(loadedConfig);
        const emuStat = await checkEmulators();
        setEmulatorStatus(emuStat);
        await scanAllFolders(loadedConfig);
      } catch (err) {
        console.error('Falha na inicialização do Tico:', err);
      }
    }
    init();
  }, [scanAllFolders]);

  // Scroll active game card into view smoothly within the carousel container ONLY
  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;

    const cards = container.children;
    const targetCard = cards[safeIndex] as HTMLElement | undefined;
    if (!targetCard) return;

    const containerRect = container.getBoundingClientRect();
    const cardRect = targetCard.getBoundingClientRect();
    const cardCenterRelativeToContainer = cardRect.left - containerRect.left + cardRect.width / 2;
    const containerCenter = containerRect.width / 2;
    const scrollDelta = cardCenterRelativeToContainer - containerCenter;

    container.scrollTo({
      left: Math.max(0, container.scrollLeft + scrollDelta),
      behavior: 'smooth',
    });
  }, [safeIndex]);

  // Handle Game Launch
  const handleLaunchGame = useCallback(async () => {
    if (!selectedGame) return;

    sfx.playSelect();

    if (selectedGame.isDemo) {
      showNotification(
        'Este é um título de demonstração! Para jogar, configure a pasta com suas ROMs nas Configurações.',
        4500
      );
      setIsDetailsOpen(true);
      return;
    }

    setIsLaunching(true);
    showNotification(`Iniciando ${selectedGame.title}...`);

    let customPath: string | null = null;
    if (selectedGame.platform === 'ps1') customPath = config.duckstation_path || null;
    if (selectedGame.platform === 'ps2') customPath = config.pcsx2_path || null;
    if (selectedGame.platform === 'ps3') customPath = config.rpcs3_path || null;
    if (selectedGame.platform === 'switch') customPath = config.ryujinx_path || null;
    if (selectedGame.platform === 'snes') customPath = config.snes9x_path || null;
    if (selectedGame.platform === 'nes') customPath = config.mesen_path || null;
    if (['gba', 'gbc', 'gb'].includes(selectedGame.platform)) customPath = config.mgba_path || null;

    const result = await launchGameRom(selectedGame.platform, selectedGame.path, customPath);
    setIsLaunching(false);

    if (result.success) {
      showNotification(`✓ ${result.message}`);
    } else {
      showNotification(`⚠️ ${result.message}`, 5000);
    }
  }, [selectedGame, config, showNotification]);

  // Toggle favorite
  const handleToggleFavorite = useCallback(() => {
    if (!selectedGame) return;
    sfx.playSelect();
    const favs = new Set(config.favorites);
    if (favs.has(selectedGame.id)) {
      favs.delete(selectedGame.id);
    } else {
      favs.add(selectedGame.id);
    }
    const updated = { ...config, favorites: Array.from(favs) };
    setConfig(updated);
    saveAppConfig(updated);
  }, [selectedGame, config]);

  // Cycle platform tabs (L1 / R1)
  const handleTabCycle = useCallback((direction: 'next' | 'prev') => {
    sfx.playTab();
    const order: TabType[] = ['all', 'switch', 'snes', 'nes', 'gba', 'gbc', 'gb', 'ps1', 'ps2', 'ps3'];
    const curIdx = order.indexOf(activeTab);
    let nextIdx = direction === 'next' ? curIdx + 1 : curIdx - 1;
    if (nextIdx >= order.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = order.length - 1;
    setActiveTab(order[nextIdx]);
    setSelectedIndex(0);
  }, [activeTab]);

  // Gamepad Actions Hook
  const { connected: controllerConnected, controllerName, controllerType } = useGamepad({
    onNavigateLeft: () => {
      if (isSettingsOpen) return;
      sfx.playMove();
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    },
    onNavigateRight: () => {
      if (isSettingsOpen) return;
      sfx.playMove();
      setSelectedIndex((prev) => Math.min(filteredGames.length - 1, prev + 1));
    },
    onNavigateUp: () => {
      if (isSettingsOpen) return;
      sfx.playMove();
      setSelectedIndex((prev) => Math.max(0, prev - 4));
    },
    onNavigateDown: () => {
      if (isSettingsOpen) return;
      sfx.playMove();
      setSelectedIndex((prev) => Math.min(filteredGames.length - 1, prev + 4));
    },
    onSelect: () => {
      if (isDetailsOpen) {
        handleLaunchGame();
      } else if (!isSettingsOpen) {
        handleLaunchGame();
      }
    },
    onBack: () => {
      if (isSettingsOpen) {
        sfx.playBack();
        setIsSettingsOpen(false);
      } else if (isDetailsOpen) {
        sfx.playBack();
        setIsDetailsOpen(false);
      }
    },
    onDetails: () => {
      if (!isSettingsOpen) {
        sfx.playSelect();
        setIsDetailsOpen((prev) => !prev);
      }
    },
    onFavorite: () => {
      handleToggleFavorite();
    },
    onPrevTab: () => {
      if (!isSettingsOpen && !isDetailsOpen) handleTabCycle('prev');
    },
    onNextTab: () => {
      if (!isSettingsOpen && !isDetailsOpen) handleTabCycle('next');
    },
    onSettings: () => {
      sfx.playSelect();
      setIsSettingsOpen((prev) => !prev);
    },
    onMenu: () => {
      sfx.playSelect();
      setIsSettingsOpen((prev) => !prev);
    },
  });

  // Keyboard navigation fallback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === 'ArrowLeft') {
        sfx.playMove();
        setSelectedIndex((p) => Math.max(0, p - 1));
      } else if (e.key === 'ArrowRight') {
        sfx.playMove();
        setSelectedIndex((p) => Math.min(filteredGames.length - 1, p + 1));
      } else if (e.key === 'Enter') {
        handleLaunchGame();
      } else if (e.key === 'Escape') {
        if (isSettingsOpen) setIsSettingsOpen(false);
        if (isDetailsOpen) setIsDetailsOpen(false);
        sfx.playBack();
      } else if (e.key === ' ' || e.key === 'i') {
        setIsDetailsOpen((p) => !p);
      } else if (e.key === 'f') {
        handleToggleFavorite();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleTabCycle(e.shiftKey ? 'prev' : 'next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredGames.length, handleLaunchGame, handleToggleFavorite, handleTabCycle, isSettingsOpen, isDetailsOpen]);

  const isFavorite = selectedGame ? config.favorites.includes(selectedGame.id) : false;

  return (
    <div className="relative w-full max-w-full h-full max-h-screen flex flex-col justify-between overflow-hidden bg-transparent text-zinc-100 select-none">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          sfx.playTab();
          setActiveTab(tab);
          setSelectedIndex(0);
        }}
        controllerConnected={controllerConnected}
        controllerName={controllerName}
        controllerType={controllerType}
        gameCount={filteredGames.length}
        onOpenSettings={() => {
          sfx.playSelect();
          setIsSettingsOpen(true);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const val = sfx.toggleSound();
          setSoundEnabled(val);
        }}
      />

      {/* Hero Showcase (Selected Game) */}
      <HeroDetails
        game={selectedGame}
        controllerType={controllerType}
        onLaunch={handleLaunchGame}
        onOpenDetails={() => {
          sfx.playSelect();
          setIsDetailsOpen(true);
        }}
        isLaunching={isLaunching}
        statusMessage={statusMessage}
      />

      {/* Horizontal Carousel (Games List) */}
      <div className="relative z-20 px-12 py-6 overflow-hidden">
        <div
          ref={carouselRef}
          className="flex items-center gap-6 overflow-x-auto no-scrollbar py-6 px-8"
        >
          {filteredGames.map((game, index) => (
            <GameCard
              key={game.id}
              game={game}
              isSelected={index === safeIndex}
              isFavorite={config.favorites.includes(game.id)}
              onClick={() => {
                sfx.playMove();
                setSelectedIndex(index);
              }}
            />
          ))}

          {filteredGames.length === 0 && (
            <div className="w-full text-center py-12 text-zinc-500">
              Nenhum jogo nesta categoria. Adicione jogos nas configurações.
            </div>
          )}
        </div>
      </div>

      {/* Bottom HUD */}
      <ControllerHUD
        controllerType={controllerType}
        inModal={isSettingsOpen || isDetailsOpen}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          config={config}
          emulatorStatus={emulatorStatus}
          controllerType={controllerType}
          controllerConnected={controllerConnected}
          controllerName={controllerName}
          onSaveConfig={(newCfg) => {
            setConfig(newCfg);
            saveAppConfig(newCfg);
          }}
          onScanNow={() => scanAllFolders(config)}
          onScrapeCovers={handleScrapeCovers}
          isScraping={isScraping}
          scrapeMessage={scrapeMessage}
          onUpdateEmulatorStatus={(newStatus) => setEmulatorStatus(newStatus)}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Game Details Modal */}
      {isDetailsOpen && selectedGame && (
        <GameDetailsModal
          game={selectedGame}
          controllerType={controllerType}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
          onLaunch={handleLaunchGame}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
