import { invoke } from '@tauri-apps/api/core';
import type { GameItem, PlatformType } from '../data/sampleGames';

export interface AppConfig {
  ps1_rom_dir: string;
  ps2_rom_dir: string;
  ps3_rom_dir: string;
  switch_rom_dir: string;
  snes_rom_dir: string;
  nes_rom_dir: string;
  gba_rom_dir: string;
  gbc_rom_dir: string;
  gb_rom_dir: string;
  duckstation_path?: string | null;
  pcsx2_path?: string | null;
  rpcs3_path?: string | null;
  ryujinx_path?: string | null;
  snes9x_path?: string | null;
  mesen_path?: string | null;
  mgba_path?: string | null;
  favorites: string[];
  recent_games: string[];
}

export interface EmulatorStatus {
  ps1_installed: boolean;
  ps1_path: string;
  ps2_installed: boolean;
  ps2_path: string;
  ps3_installed: boolean;
  ps3_path: string;
  switch_installed: boolean;
  switch_path: string;
  snes_installed: boolean;
  snes_path: string;
  nes_installed: boolean;
  nes_path: string;
  mgba_installed: boolean;
  mgba_path: string;
}

export interface ScrapeResult {
  scanned: number;
  downloaded: number;
  message: string;
}

export interface BiosFileInfo {
  name: string;
  size: string;
  path: string;
}

export interface Pcsx2BiosStatus {
  bios_dir: string;
  config_dir: string;
  bios_files: BiosFileInfo[];
  has_bios: boolean;
}

export interface PlatformInfo {
  os: 'windows' | 'macos' | 'linux';
  is_windows: boolean;
  is_macos: boolean;
}

// Helper to check if running inside Tauri window
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function getPlatformInfo(): Promise<PlatformInfo> {
  if (!isTauri()) {
    const isWin = typeof navigator !== 'undefined' && /windows/i.test(navigator.userAgent);
    return {
      os: isWin ? 'windows' : 'macos',
      is_windows: isWin,
      is_macos: !isWin,
    };
  }
  return await invoke<PlatformInfo>('get_platform_info');
}

export async function fetchConfig(): Promise<AppConfig> {
  if (!isTauri()) {
    const isWin = typeof navigator !== 'undefined' && /windows/i.test(navigator.userAgent);
    const base = isWin ? 'C:\\Games\\ROMs' : '~/Games/ROMs';
    const sep = isWin ? '\\' : '/';
    return {
      ps1_rom_dir: `${base}${sep}PS1`,
      ps2_rom_dir: `${base}${sep}PS2`,
      ps3_rom_dir: `${base}${sep}PS3`,
      switch_rom_dir: `${base}${sep}Switch`,
      snes_rom_dir: `${base}${sep}SNES`,
      nes_rom_dir: `${base}${sep}NES`,
      gba_rom_dir: `${base}${sep}GBA`,
      gbc_rom_dir: `${base}${sep}GBC`,
      gb_rom_dir: `${base}${sep}GB`,
      favorites: [],
      recent_games: [],
    };
  }
  return await invoke<AppConfig>('get_config');
}

export async function saveAppConfig(config: AppConfig): Promise<void> {
  if (!isTauri()) return;
  await invoke('save_config', { config });
}

export async function scanLocalRoms(platform: string, dirPath: string): Promise<GameItem[]> {
  if (!isTauri()) return [];
  try {
    const rawGames = await invoke<Array<{
      id: string;
      title: string;
      platform: string;
      path: string;
      cover_url?: string;
      file_size?: string;
    }>>('scan_roms', { platform, dirPath });

    return rawGames.map((g) => ({
      id: g.id,
      title: g.title,
      platform: g.platform as PlatformType,
      path: g.path,
      cover_url: g.cover_url || getFallbackCover(g.platform),
      file_size: g.file_size,
      isDemo: false,
    }));
  } catch (err) {
    console.error(`Erro ao escanear ROMs de ${platform}:`, err);
    return [];
  }
}

export async function checkEmulators(): Promise<EmulatorStatus> {
  if (!isTauri()) {
    return {
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
    };
  }
  return await invoke<EmulatorStatus>('check_emulators_installed');
}

export async function launchGameRom(
  platform: string,
  romPath: string,
  customPath?: string | null
): Promise<{ success: boolean; message: string }> {
  if (!isTauri()) {
    return {
      success: true,
      message: `[Modo Navegador] Simulando início de ${platform.toUpperCase()}: ${romPath}`,
    };
  }
  try {
    const res = await invoke<string>('launch_game', {
      platform,
      romPath,
      customEmulatorPath: customPath || null,
    });
    return { success: true, message: res };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function scrapeAllCovers(): Promise<ScrapeResult> {
  if (!isTauri()) {
    return {
      scanned: 0,
      downloaded: 0,
      message: '[Modo Web] Simulação de download de capas.',
    };
  }
  return await invoke<ScrapeResult>('scrape_all_covers');
}

export async function openExternalUrl(url: string): Promise<{ success: boolean; message: string }> {
  if (!isTauri()) {
    window.open(url, '_blank');
    return { success: true, message: `Abrindo ${url} no navegador.` };
  }
  try {
    const res = await invoke<string>('open_external_url', { url });
    return { success: true, message: res };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function installDuckStationAuto(): Promise<{ success: boolean; message: string }> {
  if (!isTauri()) {
    return { success: false, message: 'Disponível apenas no aplicativo nativo.' };
  }
  try {
    const res = await invoke<string>('install_duckstation_auto');
    return { success: true, message: res };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function installPcsx2Brew(): Promise<{ success: boolean; message: string }> {
  if (!isTauri()) {
    return { success: false, message: 'Disponível apenas no aplicativo nativo.' };
  }
  try {
    const res = await invoke<string>('install_pcsx2_brew');
    return { success: true, message: res };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function installEmulatorCask(emulator: string): Promise<{ success: boolean; message: string }> {
  if (!isTauri()) {
    return { success: false, message: 'Disponível apenas no aplicativo nativo.' };
  }
  try {
    const res = await invoke<string>('install_emulator_cask', { emulator });
    return { success: true, message: res };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function fetchPcsx2BiosStatus(): Promise<Pcsx2BiosStatus> {
  if (!isTauri()) {
    return {
      bios_dir: '~/Library/Application Support/PCSX2/bios',
      config_dir: '~/Library/Application Support/PCSX2/inis',
      bios_files: [],
      has_bios: false,
    };
  }
  return await invoke<Pcsx2BiosStatus>('get_pcsx2_bios_status');
}

export async function openFinderFolder(target: string): Promise<{ success: boolean; message: string }> {
  if (!isTauri()) {
    return { success: true, message: `[Modo Web] Pasta simulada: ${target}` };
  }
  try {
    const res = await invoke<string>('open_finder_folder', { target });
    return { success: true, message: res };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function openEmulatorGui(emulator: string): Promise<{ success: boolean; message: string }> {
  if (!isTauri()) {
    return { success: true, message: `[Modo Web] Abrindo painel de ${emulator}` };
  }
  try {
    const res = await invoke<string>('open_emulator_gui', { emulator });
    return { success: true, message: res };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function chooseAndImportPs2Bios(): Promise<{ success: boolean; message: string }> {
  if (!isTauri()) {
    return { success: false, message: 'Disponível apenas no aplicativo nativo.' };
  }
  try {
    const res = await invoke<string>('choose_and_import_ps2_bios');
    return { success: true, message: res };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function importBiosFileBytes(
  filename: string,
  base64Content: string
): Promise<{ success: boolean; message: string }> {
  if (!isTauri()) {
    return { success: false, message: 'Disponível apenas no aplicativo nativo.' };
  }
  try {
    const res = await invoke<string>('import_bios_file_bytes', { filename, base64Content });
    return { success: true, message: res };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export function getFallbackCover(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'ps1':
      return 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x76.jpg';
    case 'ps2':
      return 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r3d.jpg';
    case 'ps3':
      return 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7f.jpg';
    case 'switch':
      return 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1m59.jpg';
    case 'snes':
      return 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x8a.jpg';
    case 'nes':
      return 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1y7m.jpg';
    case 'gba':
      return 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x8e.jpg';
    case 'gbc':
      return 'https://images.igdb.com/igdb/image/upload/t_cover_big/co23t6.jpg';
    case 'gb':
      return 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x86.jpg';
    default:
      return '';
  }
}
