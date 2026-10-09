import React, { useState, useEffect } from 'react';
import type {
  AppConfig,
  EmulatorStatus,
  Pcsx2BiosStatus,
  PlatformInfo,
} from '../services/emulatorService';
import type { ControllerType } from '../hooks/useGamepad';
import {
  openExternalUrl,
  installDuckStationAuto,
  installPcsx2Brew,
  checkEmulators,
  fetchPcsx2BiosStatus,
  openFinderFolder,
  openEmulatorGui,
  chooseAndImportPs2Bios,
  getPlatformInfo,
  installEmulatorCask,
} from '../services/emulatorService';
import { sfx } from '../utils/sfx';
import {
  Folder,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Download,
  Gamepad,
  Sparkles,
  ExternalLink,
  Terminal,
  HelpCircle,
  Cpu,
  FolderOpen,
  Upload,
  FileCode,
  Sliders,
} from 'lucide-react';

interface SettingsModalProps {
  config: AppConfig;
  emulatorStatus: EmulatorStatus;
  controllerType: ControllerType;
  controllerConnected: boolean;
  controllerName: string;
  onSaveConfig: (newConfig: AppConfig) => void;
  onScanNow: () => void;
  onScrapeCovers: () => void;
  isScraping: boolean;
  scrapeMessage: string | null;
  onUpdateEmulatorStatus: (status: EmulatorStatus) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  emulatorStatus,
  controllerType,
  controllerConnected,
  controllerName,
  onSaveConfig,
  onScanNow,
  onScrapeCovers,
  isScraping,
  scrapeMessage,
  onUpdateEmulatorStatus,
  onClose,
}) => {
  const [ps1Dir, setPs1Dir] = useState(config.ps1_rom_dir);
  const [ps2Dir, setPs2Dir] = useState(config.ps2_rom_dir);
  const [ps3Dir, setPs3Dir] = useState(config.ps3_rom_dir);
  const [switchDir, setSwitchDir] = useState(config.switch_rom_dir || '~/Games/ROMs/Switch');
  const [snesDir, setSnesDir] = useState(config.snes_rom_dir || '~/Games/ROMs/SNES');
  const [nesDir, setNesDir] = useState(config.nes_rom_dir || '~/Games/ROMs/NES');
  const [gbaDir, setGbaDir] = useState(config.gba_rom_dir || '~/Games/ROMs/GBA');
  const [gbcDir, setGbcDir] = useState(config.gbc_rom_dir || '~/Games/ROMs/GBC');
  const [gbDir, setGbDir] = useState(config.gb_rom_dir || '~/Games/ROMs/GB');
  const [savedNotice, setSavedNotice] = useState(false);

  const [installingDuck, setInstallingDuck] = useState(false);
  const [installingPcsx2, setInstallingPcsx2] = useState(false);
  const [installingCask, setInstallingCask] = useState<string | null>(null);
  const [checkingEmulators, setCheckingEmulators] = useState(false);
  const [pcsx2Bios, setPcsx2Bios] = useState<Pcsx2BiosStatus | null>(null);
  const [importingBios, setImportingBios] = useState(false);

  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    os: 'macos',
    is_windows: false,
    is_macos: true,
  });

  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  const setBanner = (type: 'success' | 'info' | 'error', text: string) => {
    setFeedbackBanner({ type, text });
  };

  useEffect(() => {
    fetchPcsx2BiosStatus().then(setPcsx2Bios).catch(console.error);
    getPlatformInfo().then(setPlatformInfo).catch(console.error);
  }, []);

  const isWin = platformInfo.is_windows;
  const explorerLabel = isWin ? 'Explorer' : 'Finder';

  const handleSave = () => {
    sfx.playSelect();
    onSaveConfig({
      ...config,
      ps1_rom_dir: ps1Dir,
      ps2_rom_dir: ps2Dir,
      ps3_rom_dir: ps3Dir,
      switch_rom_dir: switchDir,
      snes_rom_dir: snesDir,
      nes_rom_dir: nesDir,
      gba_rom_dir: gbaDir,
      gbc_rom_dir: gbcDir,
      gb_rom_dir: gbDir,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleInstallCask = async (emulator: string, label: string) => {
    sfx.playSelect();
    setInstallingCask(emulator);
    setBanner('info', `Instalando ${label} em segundo plano (${isWin ? 'Winget' : 'Brew'})...`);
    try {
      const res = await installEmulatorCask(emulator);
      if (res.success) {
        sfx.playSelect();
        setBanner('success', `✓ ${res.message}`);
        const updated = await checkEmulators();
        onUpdateEmulatorStatus(updated);
      } else {
        sfx.playBack();
        setBanner('error', res.message);
      }
    } catch {
      sfx.playBack();
      setBanner('error', `Falha ao tentar instalar ${label}.`);
    } finally {
      setInstallingCask(null);
    }
  };

  const handleOpenUrl = async (url: string, name: string) => {
    sfx.playSelect();
    setBanner('info', `Abrindo página de download do ${name} no seu navegador...`);
    const res = await openExternalUrl(url);
    if (res.success) {
      setBanner(
        'success',
        `Página aberta! Baixe o emulador no navegador e clique em "Verificar Novamente".`
      );
    } else {
      sfx.playBack();
      setBanner('error', `Não foi possível abrir o navegador: ${res.message}`);
    }
  };

  const handleInstallDuckStation = async () => {
    sfx.playSelect();
    setInstallingDuck(true);
    setBanner(
      'info',
      isWin
        ? 'Instalando DuckStation via Windows Package Manager (Winget)...'
        : 'Baixando DuckStation direto do GitHub e instalando em /Applications...'
    );

    try {
      const res = await installDuckStationAuto();
      if (res.success) {
        sfx.playSelect();
        setBanner('success', `✓ ${res.message}`);
        const updated = await checkEmulators();
        onUpdateEmulatorStatus(updated);
      } else {
        sfx.playBack();
        setBanner('error', `Falha na instalação: ${res.message}`);
      }
    } catch {
      sfx.playBack();
      setBanner('error', 'Ocorreu um erro durante a instalação do DuckStation.');
    } finally {
      setInstallingDuck(false);
    }
  };

  const handleInstallPcsx2 = async () => {
    sfx.playSelect();
    setInstallingPcsx2(true);
    setBanner(
      'info',
      isWin
        ? 'Instalando PCSX2 via Windows Package Manager (Winget)...'
        : 'Executando "brew install --cask pcsx2" em segundo plano...'
    );

    try {
      const res = await installPcsx2Brew();
      if (res.success) {
        sfx.playSelect();
        setBanner('success', `✓ ${res.message}`);
        const updated = await checkEmulators();
        onUpdateEmulatorStatus(updated);
        const biosStat = await fetchPcsx2BiosStatus();
        setPcsx2Bios(biosStat);
      } else {
        sfx.playBack();
        setBanner('error', res.message);
      }
    } catch {
      sfx.playBack();
      setBanner('error', 'Falha ao executar a instalação do PCSX2.');
    } finally {
      setInstallingPcsx2(false);
    }
  };

  const handleCheckNow = async () => {
    sfx.playSelect();
    setCheckingEmulators(true);
    try {
      const updated = await checkEmulators();
      onUpdateEmulatorStatus(updated);
      const biosStat = await fetchPcsx2BiosStatus();
      setPcsx2Bios(biosStat);

      const count = [
        updated.ps1_installed,
        updated.ps2_installed,
        updated.ps3_installed,
        updated.switch_installed,
        updated.snes_installed,
        updated.nes_installed,
        updated.mgba_installed,
      ].filter(Boolean).length;

      if (count === 7) {
        sfx.playSelect();
        setBanner('success', 'Excelente! Todos os 7 emuladores estão instalados e prontos!');
      } else {
        setBanner(
          'info',
          `Verificação concluída: ${count} de 7 emuladores detectados no sistema.`
        );
      }
    } finally {
      setCheckingEmulators(false);
    }
  };

  const handleOpenFinder = async (target: string, label: string) => {
    sfx.playSelect();
    const res = await openFinderFolder(target);
    if (res.success) {
      setBanner('success', `✓ Pasta ${label} aberta no ${explorerLabel}!`);
    } else {
      sfx.playBack();
      setBanner('error', `Falha ao abrir pasta: ${res.message}`);
    }
  };

  const handleImportBios = async () => {
    sfx.playSelect();
    setImportingBios(true);
    try {
      const res = await chooseAndImportPs2Bios();
      if (res.success) {
        sfx.playSelect();
        setBanner('success', `✓ ${res.message}`);
        const updated = await fetchPcsx2BiosStatus();
        setPcsx2Bios(updated);
      } else {
        if (!res.message.includes('cancelada')) {
          sfx.playBack();
          setBanner('error', res.message);
        }
      }
    } catch {
      sfx.playBack();
      setBanner('error', 'Erro ao importar arquivo de BIOS.');
    } finally {
      setImportingBios(false);
    }
  };

  const handleOpenGui = async (emulator: string) => {
    sfx.playSelect();
    const res = await openEmulatorGui(emulator);
    if (res.success) {
      setBanner('info', `Abrindo o painel completo de configurações do ${emulator}...`);
    } else {
      sfx.playBack();
      setBanner('error', res.message);
    }
  };

  const isPS = controllerType === 'playstation';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xl p-6 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-900/90 backdrop-blur-3xl border border-white/15 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white">
              <Folder className="w-5 h-5 opacity-90" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Configurações & Pastas
              </h3>
              <p className="text-xs text-zinc-400 font-medium">
                Emuladores, BIOS do PS2, diretórios de ROMs e capinhas
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sfx.playBack();
              onClose();
            }}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedbackBanner && (
          <div
            className={`mx-7 mt-4 px-4 py-3 rounded-2xl text-xs font-medium flex items-center justify-between animate-fadeIn border ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : feedbackBanner.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`}
          >
            <span>{feedbackBanner.text}</span>
            <button
              onClick={() => setFeedbackBanner(null)}
              className="ml-3 text-white/60 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content body */}
        <div className="p-7 overflow-y-auto space-y-6">
          {/* Emulators Section */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-zinc-300 tracking-wider uppercase">
                  Status dos Emuladores no {isWin ? 'Windows' : 'macOS'}
                </h4>
                <p className="text-[11px] text-zinc-400">
                  {isWin
                    ? 'Detectados em Program Files, LocalAppData ou pastas portáteis'
                    : 'Os emuladores devem estar localizados em /Applications'}
                </p>
              </div>

              <button
                onClick={handleCheckNow}
                disabled={checkingEmulators}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 cursor-pointer transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingEmulators ? 'animate-spin' : ''}`} />
                <span>Verificar Novamente</span>
              </button>
            </div>

            {/* Instruction helper */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3 text-[11px] text-zinc-300">
              <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block mb-0.5">Como configurar seus emuladores:</span>
                Instale os emuladores abaixo. No caso do <strong>PS2 (PCSX2)</strong>, certifique-se de colocar o arquivo da BIOS do console clicando no botão <strong>"Abrir Pasta da BIOS"</strong> ou <strong>"Importar BIOS"</strong>!
              </div>
            </div>

            {/* DuckStation (PS1) */}
            <div className="p-4 rounded-2xl bg-black/25 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {emulatorStatus.ps1_installed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>DuckStation</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-normal">
                        PS1
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">{emulatorStatus.ps1_path}</div>
                  </div>
                </div>

                {emulatorStatus.ps1_installed ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/20">
                      ✓ Instalado
                    </span>
                    <button
                      onClick={() => handleOpenGui('duckstation')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 cursor-pointer transition-all"
                      title="Abrir o DuckStation para configurar controles ou resolução"
                    >
                      <Sliders className="w-3 h-3 opacity-80" />
                      <span>Abrir Painel</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleInstallDuckStation}
                      disabled={installingDuck}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shadow cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Download className={`w-3.5 h-3.5 ${installingDuck ? 'animate-bounce' : ''}`} />
                      <span>{installingDuck ? 'Instalando...' : 'Instalar com 1 Clique'}</span>
                    </button>

                    <button
                      onClick={() =>
                        handleOpenUrl(
                          'https://github.com/stenzek/duckstation/releases',
                          'DuckStation'
                        )
                      }
                      className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/10"
                      title="Abrir página oficial de lançamentos"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PCSX2 (PS2) + BIOS & Config Management */}
            <div className="p-4 rounded-2xl bg-black/25 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {emulatorStatus.ps2_installed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>PCSX2</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-normal">
                        PS2
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">{emulatorStatus.ps2_path}</div>
                  </div>
                </div>

                {emulatorStatus.ps2_installed ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/20">
                      ✓ Instalado
                    </span>
                    <button
                      onClick={() => handleOpenGui('pcsx2')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 cursor-pointer transition-all"
                      title="Abrir o PCSX2 para configurar controles, tela ou resolução Metal"
                    >
                      <Sliders className="w-3 h-3 opacity-80" />
                      <span>Abrir Painel</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleInstallPcsx2}
                      disabled={installingPcsx2}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Terminal className="w-3.5 h-3.5 opacity-80" />
                      <span>
                        {installingPcsx2
                          ? 'Instalando...'
                          : isWin
                          ? 'Instalar (Winget)'
                          : 'Instalar via Brew'}
                      </span>
                    </button>

                    <button
                      onClick={() => handleOpenUrl('https://pcsx2.net/downloads', 'PCSX2')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shadow cursor-pointer transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir Site Oficial</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Sub-Card: BIOS & Configs do PS2 */}
              <div className="pt-3 border-t border-white/5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-zinc-200">BIOS do PS2:</span>
                    {pcsx2Bios?.has_bios ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">
                        ✓ Detectada ({pcsx2Bios.bios_files[0]?.name || 'Pronta'})
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                        ⚠️ Nenhuma BIOS instalada
                      </span>
                    )}
                  </div>

                  {pcsx2Bios && pcsx2Bios.bios_files.length > 0 && (
                    <span className="text-[11px] text-zinc-400 font-medium">
                      {pcsx2Bios.bios_files.length}{' '}
                      {pcsx2Bios.bios_files.length === 1 ? 'arquivo' : 'arquivos'}
                    </span>
                  )}
                </div>

                {!pcsx2Bios?.has_bios && (
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Para iniciar jogos de PlayStation 2, você precisa do arquivo da BIOS (ex:{' '}
                    <code className="text-zinc-300 bg-white/5 px-1 py-0.5 rounded">SCPH-70012.bin</code>
                    ). Você pode arrastar direto pelo {explorerLabel} ou importar aqui:
                  </p>
                )}

                {/* BIOS action buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => handleOpenFinder('pcsx2_bios', 'da BIOS (PCSX2)')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 cursor-pointer transition-all"
                    title={`Abre a pasta da BIOS no ${explorerLabel}`}
                  >
                    <FolderOpen className="w-3.5 h-3.5 opacity-80" />
                    <span>Abrir Pasta da BIOS ({explorerLabel})</span>
                  </button>

                  <button
                    onClick={handleImportBios}
                    disabled={importingBios}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shadow cursor-pointer transition-all disabled:opacity-50"
                    title="Selecionar arquivo .bin da BIOS para copiar automaticamente"
                  >
                    <Upload className={`w-3.5 h-3.5 ${importingBios ? 'animate-bounce' : ''}`} />
                    <span>{importingBios ? 'Importando...' : 'Importar BIOS (.bin)'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenFinder('pcsx2_config', 'de Configurações (PCSX2)')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium border border-white/5 cursor-pointer transition-all"
                    title={`Abre a pasta inis com o arquivo PCSX2.ini no ${explorerLabel}`}
                  >
                    <FileCode className="w-3.5 h-3.5 opacity-80" />
                    <span>Abrir Pasta de Configs ({explorerLabel})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RPCS3 (PS3) */}
            <div className="p-4 rounded-2xl bg-black/25 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {emulatorStatus.ps3_installed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>RPCS3</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-normal">
                        PS3
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">{emulatorStatus.ps3_path}</div>
                  </div>
                </div>

                {emulatorStatus.ps3_installed ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/20">
                      ✓ Instalado
                    </span>
                    <button
                      onClick={() => handleOpenGui('rpcs3')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 cursor-pointer transition-all"
                    >
                      <Sliders className="w-3 h-3 opacity-80" />
                      <span>Abrir Painel</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenUrl('https://rpcs3.net/download', 'RPCS3')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shadow cursor-pointer transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir Página de Download</span>
                  </button>
                )}
              </div>
            </div>

            {/* Ryujinx (Switch) */}
            <div className="p-4 rounded-2xl bg-black/25 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {emulatorStatus.switch_installed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>Ryujinx</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 font-normal border border-red-500/20">
                        Nintendo Switch
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">{emulatorStatus.switch_path}</div>
                  </div>
                </div>

                {emulatorStatus.switch_installed ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/20">
                      ✓ Instalado
                    </span>
                    <button
                      onClick={() => handleOpenGui('ryujinx')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 cursor-pointer transition-all"
                    >
                      <Sliders className="w-3 h-3 opacity-80" />
                      <span>Abrir Painel</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenUrl('https://ryujinx.org/download', 'Ryujinx')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shadow cursor-pointer transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Baixar Ryujinx</span>
                  </button>
                )}
              </div>
            </div>

            {/* Snes9x (SNES) */}
            <div className="p-4 rounded-2xl bg-black/25 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {emulatorStatus.snes_installed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>Snes9x</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-normal border border-purple-500/20">
                        Super Nintendo
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">{emulatorStatus.snes_path}</div>
                  </div>
                </div>

                {emulatorStatus.snes_installed ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/20">
                      ✓ Instalado
                    </span>
                    <button
                      onClick={() => handleOpenGui('snes9x')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 cursor-pointer transition-all"
                    >
                      <Sliders className="w-3 h-3 opacity-80" />
                      <span>Abrir Painel</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInstallCask('snes9x', 'Snes9x')}
                      disabled={installingCask === 'snes9x'}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Terminal className="w-3.5 h-3.5 opacity-80" />
                      <span>{installingCask === 'snes9x' ? 'Instalando...' : isWin ? 'Instalar (Winget)' : 'Instalar via Brew'}</span>
                    </button>
                    <button
                      onClick={() => handleOpenUrl('https://github.com/snes9xgit/snes9x/releases', 'Snes9x')}
                      className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/10"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mesen / RetroArch (NES) */}
            <div className="p-4 rounded-2xl bg-black/25 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {emulatorStatus.nes_installed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>Mesen / RetroArch</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 font-normal border border-rose-500/20">
                        Nintendo (NES)
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">{emulatorStatus.nes_path}</div>
                  </div>
                </div>

                {emulatorStatus.nes_installed ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/20">
                      ✓ Instalado
                    </span>
                    <button
                      onClick={() => handleOpenGui('mesen')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 cursor-pointer transition-all"
                    >
                      <Sliders className="w-3 h-3 opacity-80" />
                      <span>Abrir Painel</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInstallCask('retroarch', 'RetroArch')}
                      disabled={installingCask === 'retroarch'}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Terminal className="w-3.5 h-3.5 opacity-80" />
                      <span>{installingCask === 'retroarch' ? 'Instalando...' : isWin ? 'Instalar RetroArch' : 'Instalar via Brew'}</span>
                    </button>
                    <button
                      onClick={() => handleOpenUrl('https://github.com/SourMesen/Mesen2/releases', 'Mesen')}
                      className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/10"
                      title="Baixar Mesen oficial"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* mGBA (GBA, GBC, GB) */}
            <div className="p-4 rounded-2xl bg-black/25 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {emulatorStatus.mgba_installed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>mGBA</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-normal border border-emerald-500/20">
                        Game Boy (Advance / Color / Clássico)
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">{emulatorStatus.mgba_path}</div>
                  </div>
                </div>

                {emulatorStatus.mgba_installed ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/20">
                      ✓ Instalado
                    </span>
                    <button
                      onClick={() => handleOpenGui('mgba')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 cursor-pointer transition-all"
                    >
                      <Sliders className="w-3 h-3 opacity-80" />
                      <span>Abrir Painel</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInstallCask('mgba', 'mGBA')}
                      disabled={installingCask === 'mgba'}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shadow cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Download className={`w-3.5 h-3.5 ${installingCask === 'mgba' ? 'animate-bounce' : ''}`} />
                      <span>{installingCask === 'mgba' ? 'Instalando...' : 'Instalar com 1 Clique'}</span>
                    </button>
                    <button
                      onClick={() => handleOpenUrl('https://mgba.io/downloads.html', 'mGBA')}
                      className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/10"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Auto-Scraper Section */}
          <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Baixar Capas Automaticamente</div>
                  <div className="text-[11px] text-zinc-400">
                    Busca artes oficiais no repositório Libretro e salva localmente para uso offline
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  sfx.playSelect();
                  onScrapeCovers();
                }}
                disabled={isScraping}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 cursor-pointer transition-all disabled:opacity-50"
              >
                <Download className={`w-3.5 h-3.5 opacity-80 ${isScraping ? 'animate-bounce' : ''}`} />
                <span>{isScraping ? 'Baixando capas...' : 'Buscar Capas na Web'}</span>
              </button>
            </div>
            {scrapeMessage && (
              <div className="text-xs text-emerald-400 font-medium pl-1 animate-fadeIn">
                ✓ {scrapeMessage}
              </div>
            )}
          </div>

          <hr className="border-white/10" />

          {/* ROM Folders */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-zinc-300 tracking-wider uppercase">
              Diretórios de Jogos (ROMs)
            </h4>

            {/* PS1 */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                PlayStation 1 (DuckStation) — .chd, .cue, .iso, .pbp
              </label>
              <input
                type="text"
                value={ps1Dir}
                onChange={(e) => setPs1Dir(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-white/30 font-mono"
              />
            </div>

            {/* PS2 */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                PlayStation 2 (PCSX2) — .iso, .chd, .cso, .gz
              </label>
              <input
                type="text"
                value={ps2Dir}
                onChange={(e) => setPs2Dir(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-white/30 font-mono"
              />
            </div>

            {/* PS3 */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                PlayStation 3 (RPCS3) — .iso, pastas com EBOOT.BIN
              </label>
              <input
                type="text"
                value={ps3Dir}
                onChange={(e) => setPs3Dir(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-white/30 font-mono"
              />
            </div>

            {/* Switch */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Nintendo Switch (Ryujinx) — .nsp, .xci
              </label>
              <input
                type="text"
                value={switchDir}
                onChange={(e) => setSwitchDir(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-white/30 font-mono"
              />
            </div>

            {/* SNES */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Super Nintendo (Snes9x) — .smc, .sfc
              </label>
              <input
                type="text"
                value={snesDir}
                onChange={(e) => setSnesDir(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-white/30 font-mono"
              />
            </div>

            {/* NES */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Nintendo / Famicom (Mesen / RetroArch) — .nes
              </label>
              <input
                type="text"
                value={nesDir}
                onChange={(e) => setNesDir(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-white/30 font-mono"
              />
            </div>

            {/* GBA */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Game Boy Advance (mGBA) — .gba
              </label>
              <input
                type="text"
                value={gbaDir}
                onChange={(e) => setGbaDir(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-white/30 font-mono"
              />
            </div>

            {/* GBC */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Game Boy Color (mGBA) — .gbc
              </label>
              <input
                type="text"
                value={gbcDir}
                onChange={(e) => setGbcDir(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-white/30 font-mono"
              />
            </div>

            {/* GB */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Game Boy Clássico (mGBA) — .gb
              </label>
              <input
                type="text"
                value={gbDir}
                onChange={(e) => setGbDir(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-white/30 font-mono"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs shadow-md cursor-pointer transition-all"
              >
                Salvar Caminhos
              </button>
              <button
                onClick={() => {
                  sfx.playSelect();
                  onScanNow();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 font-medium text-xs border border-white/10 cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 opacity-80" />
                <span>Escanear Pastas Agora</span>
              </button>
              {savedNotice && (
                <span className="text-xs text-emerald-400 font-medium">
                  ✓ Configurações salvas
                </span>
              )}
            </div>
          </div>

          {/* Windows Portable ZIP Download */}
          <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-blue-400 opacity-90" />
              <div>
                <div className="text-xs font-semibold text-white">Versão Portátil para Windows (.zip com .exe)</div>
                <div className="text-[11px] text-zinc-400">
                  Baixe o executável direto Tico.exe compactado em .zip para rodar sem instalar
                </div>
              </div>
            </div>
            <button
              onClick={() =>
                handleOpenUrl(
                  'https://github.com/JulioJCLF/tico-launcher/releases/download/v0.1.0/Tico-Windows-Portable-x64.zip',
                  'ZIP do Windows'
                )
              }
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs shadow-md cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar ZIP (.exe)</span>
            </button>
          </div>

          <hr className="border-white/10" />

          {/* Gamepad Info */}
          <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gamepad className="w-5 h-5 text-zinc-300 opacity-80" />
                <div>
                  <div className="text-xs font-semibold text-white">Controle Conectado</div>
                  <div className="text-[11px] text-zinc-400 font-mono truncate max-w-sm">
                    {controllerConnected ? controllerName : 'Nenhum controle detectado no momento'}
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-semibold border ${
                controllerConnected
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/10 border-white/10 text-zinc-400'
              }`}>
                {controllerConnected
                  ? controllerName.toLowerCase().includes('gamesir')
                    ? '✓ GameSir T4 Lite Ativo'
                    : isPS
                    ? '✓ Modo DualShock 4'
                    : '✓ Modo XInput / Xbox'
                  : 'Desconectado'}
              </span>
            </div>

            {/* GameSir T4 Lite Pairing Helper */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-zinc-300 space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <span>🎮 Dica para GameSir T4 Lite:</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                • <strong>No Mac (Bluetooth):</strong> Ligue segurando <code className="text-zinc-200 bg-white/10 px-1 rounded">Home + B</code> (Modo Xbox Wireless / Apple Arcade) ou <code className="text-zinc-200 bg-white/10 px-1 rounded">Home + Y</code> (Modo Switch).<br />
                • <strong>No Windows (Cabo / Dongle):</strong> Ligue segurando <code className="text-zinc-200 bg-white/10 px-1 rounded">Home + X</code> (Modo XInput nativo).<br />
                • <strong>Importante:</strong> Após parear, <span className="text-emerald-300 font-medium">pressione qualquer botão ou direcional</span> no controle para que o macOS autorize o sinal de entrada na janela.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 py-4 border-t border-white/10 bg-white/[0.02]">
          <div className="text-[11px] text-zinc-400 font-medium">
            Pressione <span className="text-white font-semibold">({isPS ? '○' : 'B'})</span> para fechar
          </div>
          <button
            onClick={() => {
              sfx.playBack();
              onClose();
            }}
            className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 cursor-pointer transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
