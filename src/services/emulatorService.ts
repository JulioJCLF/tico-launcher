import { invoke } from '@tauri-apps/api/core';
import type { GameItem } from '../data/sampleGames';

export interface AppConfig {
  ps1_rom_dir: string;
  ps2_rom_dir: string;
  ps3_rom_dir: string;
  duckstation_path?: string | null;
  pcsx2_path?: string | null;
  rpcs3_path?: string | null;
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
    return {
      ps1_rom_dir: '~/Games/ROMs/PS1',
      ps2_rom_dir: '~/Games/ROMs/PS2',
      ps3_rom_dir: '~/Games/ROMs/PS3',
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
      platform: g.platform as 'ps1' | 'ps2' | 'ps3',
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

function getFallbackCover(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'ps1':
      return 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x76.jpg';
    case 'ps2':
      return 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r3d.jpg';
    case 'ps3':
      return 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7f.jpg';
    default:
      return '';
  }
}
