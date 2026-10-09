use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Game {
    pub id: String,
    pub title: String,
    pub platform: String, // "ps1", "ps2", "ps3"
    pub path: String,
    pub cover_url: Option<String>,
    pub file_size: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub ps1_rom_dir: String,
    pub ps2_rom_dir: String,
    pub ps3_rom_dir: String,
    pub duckstation_path: Option<String>,
    pub pcsx2_path: Option<String>,
    pub rpcs3_path: Option<String>,
    pub favorites: Vec<String>,
    pub recent_games: Vec<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        #[cfg(target_os = "windows")]
        let base_roms = {
            if let Some(docs) = dirs::document_dir() {
                docs.join("Games").join("ROMs")
            } else if let Some(home) = dirs::home_dir() {
                home.join("Games").join("ROMs")
            } else {
                PathBuf::from("C:\\Games\\ROMs")
            }
        };

        #[cfg(not(target_os = "windows"))]
        let base_roms = {
            let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("/Users"));
            home.join("Games").join("ROMs")
        };

        Self {
            ps1_rom_dir: base_roms.join("PS1").to_string_lossy().to_string(),
            ps2_rom_dir: base_roms.join("PS2").to_string_lossy().to_string(),
            ps3_rom_dir: base_roms.join("PS3").to_string_lossy().to_string(),
            duckstation_path: None,
            pcsx2_path: None,
            rpcs3_path: None,
            favorites: Vec::new(),
            recent_games: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmulatorStatus {
    pub ps1_installed: bool,
    pub ps1_path: String,
    pub ps2_installed: bool,
    pub ps2_path: String,
    pub ps3_installed: bool,
    pub ps3_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformInfo {
    pub os: String, // "windows", "macos", "linux"
    pub is_windows: bool,
    pub is_macos: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrapeResult {
    pub scanned: usize,
    pub downloaded: usize,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BiosFileInfo {
    pub name: String,
    pub size: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pcsx2BiosStatus {
    pub bios_dir: String,
    pub config_dir: String,
    pub bios_files: Vec<BiosFileInfo>,
    pub has_bios: bool,
}

fn get_config_dir() -> PathBuf {
    if let Some(config) = dirs::config_dir() {
        config.join("tico")
    } else if let Some(home) = dirs::home_dir() {
        home.join(".config").join("tico")
    } else {
        PathBuf::from("tico_data")
    }
}

fn get_config_path() -> PathBuf {
    if let Some(home) = dirs::home_dir() {
        let legacy = home.join(".config").join("tico").join("config.json");
        if legacy.exists() {
            return legacy;
        }
    }
    get_config_dir().join("config.json")
}

fn get_covers_dir() -> PathBuf {
    if let Some(home) = dirs::home_dir() {
        let legacy = home.join(".config").join("tico").join("covers");
        if legacy.exists() {
            return legacy;
        }
    }
    get_config_dir().join("covers")
}

#[tauri::command]
fn get_platform_info() -> PlatformInfo {
    #[cfg(target_os = "windows")]
    {
        PlatformInfo {
            os: "windows".to_string(),
            is_windows: true,
            is_macos: false,
        }
    }
    #[cfg(target_os = "macos")]
    {
        PlatformInfo {
            os: "macos".to_string(),
            is_macos: true,
            is_windows: false,
        }
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        PlatformInfo {
            os: "linux".to_string(),
            is_windows: false,
            is_macos: false,
        }
    }
}

#[tauri::command]
fn get_config() -> AppConfig {
    let path = get_config_path();
    if let Ok(content) = fs::read_to_string(&path) {
        if let Ok(config) = serde_json::from_str::<AppConfig>(&content) {
            return config;
        }
    }
    let default = AppConfig::default();
    let _ = save_config(default.clone());
    default
}

#[tauri::command]
fn save_config(config: AppConfig) -> Result<(), String> {
    let path = get_config_path();
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("Failed to write config: {}", e))?;
    Ok(())
}

fn url_encode(input: &str) -> String {
    let mut encoded = String::new();
    for b in input.bytes() {
        match b {
            b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                encoded.push(b as char);
            }
            b' ' => {
                encoded.push_str("%20");
            }
            _ => {
                encoded.push_str(&format!("%{:02X}", b));
            }
        }
    }
    encoded
}

fn clean_title(raw_name: &str) -> String {
    let mut name = raw_name.to_string();
    if let Some(pos) = name.rfind('.') {
        name = name[..pos].to_string();
    }
    let re_bracket = regex_cleaning(&name);
    re_bracket.replace('_', " ").trim().to_string()
}

fn regex_cleaning(s: &str) -> String {
    let mut result = String::new();
    let mut in_paren = 0;
    let mut in_bracket = 0;

    for ch in s.chars() {
        match ch {
            '(' => in_paren += 1,
            ')' => {
                if in_paren > 0 {
                    in_paren -= 1;
                }
            }
            '[' => in_bracket += 1,
            ']' => {
                if in_bracket > 0 {
                    in_bracket -= 1;
                }
            }
            _ => {
                if in_paren == 0 && in_bracket == 0 {
                    result.push(ch);
                }
            }
        }
    }
    result
}

fn format_file_size(bytes: u64) -> String {
    const MB: u64 = 1024 * 1024;
    const GB: u64 = MB * 1024;
    if bytes >= GB {
        format!("{:.1} GB", (bytes as f64) / (GB as f64))
    } else {
        format!("{:.0} MB", (bytes as f64) / (MB as f64))
    }
}

fn get_libretro_repo_name(platform: &str) -> Option<&'static str> {
    match platform.to_lowercase().as_str() {
        "ps1" => Some("Sony_-_PlayStation"),
        "ps2" => Some("Sony_-_PlayStation_2"),
        "ps3" => Some("Sony_-_PlayStation_3"),
        _ => None,
    }
}

fn get_cover_candidates(platform: &str, file_stem: &str, clean_title: &str) -> Vec<String> {
    let repo = match get_libretro_repo_name(platform) {
        Some(r) => r,
        None => return Vec::new(),
    };

    let base = format!(
        "https://raw.githubusercontent.com/libretro-thumbnails/{}/master/Named_Boxarts",
        repo
    );

    let mut names = Vec::new();
    names.push(format!("{}.png", file_stem));
    names.push(format!("{} (USA).png", clean_title));
    names.push(format!("{} (Europe).png", clean_title));
    names.push(format!("{} (Japan).png", clean_title));
    names.push(format!("{}.png", clean_title));

    names
        .into_iter()
        .map(|name| format!("{}/{}", base, url_encode(&name)))
        .collect()
}

fn try_download_cover(platform: &str, file_stem: &str, clean_title: &str) -> Option<PathBuf> {
    let covers_dir = get_covers_dir().join(platform);
    let _ = fs::create_dir_all(&covers_dir);
    let target_path = covers_dir.join(format!("{}.png", file_stem));

    if target_path.exists() {
        return Some(target_path);
    }

    let candidates = get_cover_candidates(platform, file_stem, clean_title);
    for url in candidates {
        let status = Command::new("curl")
            .arg("-s")
            .arg("-f")
            .arg("-L")
            .arg("--max-time")
            .arg("4")
            .arg(&url)
            .arg("-o")
            .arg(&target_path)
            .status();

        if let Ok(st) = status {
            if st.success() && target_path.exists() {
                if let Ok(meta) = target_path.metadata() {
                    if meta.len() > 1000 {
                        return Some(target_path);
                    }
                }
            }
        }
        let _ = fs::remove_file(&target_path);
    }

    None
}

fn format_asset_url(file_path: &Path) -> String {
    let normalized = file_path.to_string_lossy().replace('\\', "/");
    format!("asset://localhost/{}", normalized)
}

#[tauri::command]
fn scan_roms(platform: String, dir_path: String) -> Vec<Game> {
    let mut games = Vec::new();
    let p = Path::new(&dir_path);
    if !p.exists() || !p.is_dir() {
        return games;
    }

    let allowed_exts: Vec<&str> = match platform.to_lowercase().as_str() {
        "ps1" => vec!["chd", "cue", "iso", "bin", "pbp", "m3u"],
        "ps2" => vec!["iso", "chd", "bin", "cso", "gz"],
        "ps3" => vec!["iso", "pkg", "bin"],
        _ => vec!["iso", "chd", "bin"],
    };

    let covers_cache_dir = get_covers_dir().join(&platform);

    if let Ok(entries) = fs::read_dir(p) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension() {
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    if allowed_exts.contains(&ext_str.as_str()) {
                        if ext_str == "bin" {
                            let cue_path = path.with_extension("cue");
                            if cue_path.exists() {
                                continue;
                            }
                        }

                        let file_stem = path.file_stem().unwrap_or_default().to_string_lossy();
                        let title = clean_title(&file_stem);
                        let file_size = if let Ok(meta) = entry.metadata() {
                            Some(format_file_size(meta.len()))
                        } else {
                            None
                        };

                        let mut cover_url = None;
                        for img_ext in &["png", "jpg", "jpeg", "webp"] {
                            let img_path = path.with_extension(img_ext);
                            if img_path.exists() {
                                cover_url = Some(format_asset_url(&img_path));
                                break;
                            }
                        }

                        if cover_url.is_none() {
                            let cached_path = covers_cache_dir.join(format!("{}.png", file_stem));
                            if cached_path.exists() {
                                cover_url = Some(format_asset_url(&cached_path));
                            }
                        }

                        if cover_url.is_none() {
                            let candidates = get_cover_candidates(&platform, &file_stem, &title);
                            if let Some(primary_url) = candidates.first() {
                                cover_url = Some(primary_url.clone());
                            }
                        }

                        let id = format!("{}_{}", platform, file_stem);
                        games.push(Game {
                            id,
                            title,
                            platform: platform.clone(),
                            path: path.to_string_lossy().to_string(),
                            cover_url,
                            file_size,
                        });
                    }
                }
            } else if path.is_dir() && platform.to_lowercase() == "ps3" {
                let eboot_path = path.join("PS3_GAME").join("USRDIR").join("EBOOT.BIN");
                if eboot_path.exists() {
                    let folder_name = path.file_name().unwrap_or_default().to_string_lossy();
                    let title = clean_title(&folder_name);
                    let mut cover_url = None;
                    let icon_path = path.join("PS3_GAME").join("ICON0.PNG");
                    if icon_path.exists() {
                        cover_url = Some(format_asset_url(&icon_path));
                    }

                    if cover_url.is_none() {
                        let candidates = get_cover_candidates(&platform, &folder_name, &title);
                        if let Some(primary_url) = candidates.first() {
                            cover_url = Some(primary_url.clone());
                        }
                    }

                    let id = format!("{}_{}", platform, folder_name);
                    games.push(Game {
                        id,
                        title,
                        platform: platform.clone(),
                        path: eboot_path.to_string_lossy().to_string(),
                        cover_url,
                        file_size: None,
                    });
                }
            }
        }
    }

    games.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));
    games
}

#[tauri::command]
fn scrape_all_covers() -> Result<ScrapeResult, String> {
    let config = get_config();
    let mut total_scanned = 0;
    let mut total_downloaded = 0;

    let platforms = [
        ("ps1", &config.ps1_rom_dir),
        ("ps2", &config.ps2_rom_dir),
        ("ps3", &config.ps3_rom_dir),
    ];

    for (platform, dir_path) in platforms {
        let games = scan_roms(platform.to_string(), dir_path.to_string());
        total_scanned += games.len();

        for game in games {
            let p = Path::new(&game.path);
            let file_stem = p.file_stem().unwrap_or_default().to_string_lossy();
            let covers_dir = get_covers_dir().join(platform);
            let cached_path = covers_dir.join(format!("{}.png", file_stem));

            if !cached_path.exists() {
                if let Some(_downloaded_path) = try_download_cover(platform, &file_stem, &game.title) {
                    total_downloaded += 1;
                }
            }
        }
    }

    Ok(ScrapeResult {
        scanned: total_scanned,
        downloaded: total_downloaded,
        message: format!(
            "Varredura concluída: {} jogos verificados, {} novas capinhas baixadas.",
            total_scanned, total_downloaded
        ),
    })
}

#[allow(dead_code)]
fn find_windows_emulator(name: &str) -> Option<PathBuf> {
    let program_files = std::env::var("ProgramFiles").unwrap_or_else(|_| "C:\\Program Files".to_string());
    let program_files_x86 = std::env::var("ProgramFiles(x86)").unwrap_or_else(|_| "C:\\Program Files (x86)".to_string());
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();

    let mut candidates = Vec::new();

    match name {
        "duckstation" => {
            candidates.push(PathBuf::from(&program_files).join("DuckStation").join("duckstation-qt-x64-ReleaseLTCG.exe"));
            candidates.push(PathBuf::from(&program_files).join("DuckStation").join("duckstation.exe"));
            if !local_app_data.is_empty() {
                candidates.push(PathBuf::from(&local_app_data).join("DuckStation").join("duckstation-qt-x64-ReleaseLTCG.exe"));
                candidates.push(PathBuf::from(&local_app_data).join("DuckStation").join("duckstation.exe"));
                candidates.push(PathBuf::from(&local_app_data).join("Programs").join("DuckStation").join("duckstation.exe"));
            }
            candidates.push(PathBuf::from("C:\\Emulators\\DuckStation\\duckstation-qt-x64-ReleaseLTCG.exe"));
            candidates.push(PathBuf::from("C:\\Emulators\\DuckStation\\duckstation.exe"));
            candidates.push(PathBuf::from("D:\\Emulators\\DuckStation\\duckstation.exe"));
        }
        "pcsx2" => {
            candidates.push(PathBuf::from(&program_files).join("PCSX2").join("pcsx2-qt.exe"));
            candidates.push(PathBuf::from(&program_files).join("PCSX2").join("pcsx2.exe"));
            candidates.push(PathBuf::from(&program_files_x86).join("PCSX2").join("pcsx2.exe"));
            if !local_app_data.is_empty() {
                candidates.push(PathBuf::from(&local_app_data).join("Programs").join("PCSX2").join("pcsx2-qt.exe"));
                candidates.push(PathBuf::from(&local_app_data).join("Programs").join("PCSX2").join("pcsx2.exe"));
            }
            candidates.push(PathBuf::from("C:\\Emulators\\PCSX2\\pcsx2-qt.exe"));
            candidates.push(PathBuf::from("C:\\Emulators\\PCSX2\\pcsx2.exe"));
            candidates.push(PathBuf::from("C:\\PCSX2\\pcsx2-qt.exe"));
            candidates.push(PathBuf::from("D:\\Emulators\\PCSX2\\pcsx2-qt.exe"));
        }
        "rpcs3" => {
            candidates.push(PathBuf::from(&program_files).join("RPCS3").join("rpcs3.exe"));
            if !local_app_data.is_empty() {
                candidates.push(PathBuf::from(&local_app_data).join("Programs").join("RPCS3").join("rpcs3.exe"));
                candidates.push(PathBuf::from(&local_app_data).join("RPCS3").join("rpcs3.exe"));
            }
            candidates.push(PathBuf::from("C:\\Emulators\\RPCS3\\rpcs3.exe"));
            candidates.push(PathBuf::from("C:\\RPCS3\\rpcs3.exe"));
            candidates.push(PathBuf::from("D:\\Emulators\\RPCS3\\rpcs3.exe"));
        }
        _ => {}
    }

    candidates.into_iter().find(|p| p.exists())
}

fn find_macos_emulator(name: &str) -> Option<PathBuf> {
    let app_name = match name {
        "duckstation" => "DuckStation.app",
        "pcsx2" => "PCSX2.app",
        "rpcs3" => "RPCS3.app",
        _ => return None,
    };
    let app_path = PathBuf::from("/Applications").join(app_name);
    if app_path.exists() {
        return Some(app_path);
    }
    if let Some(home) = dirs::home_dir() {
        let user_app = home.join("Applications").join(app_name);
        if user_app.exists() {
            return Some(user_app);
        }
    }
    None
}

fn get_default_emulator(name: &str) -> (bool, String) {
    #[cfg(target_os = "windows")]
    {
        if let Some(p) = find_windows_emulator(name) {
            return (true, p.to_string_lossy().to_string());
        }
        let fallback = match name {
            "duckstation" => "C:\\Emulators\\DuckStation\\duckstation-qt-x64-ReleaseLTCG.exe",
            "pcsx2" => "C:\\Program Files\\PCSX2\\pcsx2-qt.exe",
            "rpcs3" => "C:\\Emulators\\RPCS3\\rpcs3.exe",
            _ => "",
        };
        (false, fallback.to_string())
    }

    #[cfg(target_os = "macos")]
    {
        if let Some(p) = find_macos_emulator(name) {
            return (true, p.to_string_lossy().to_string());
        }
        let fallback = match name {
            "duckstation" => "/Applications/DuckStation.app",
            "pcsx2" => "/Applications/PCSX2.app",
            "rpcs3" => "/Applications/RPCS3.app",
            _ => "",
        };
        (false, fallback.to_string())
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        (false, format!("/usr/bin/{}", name))
    }
}

#[tauri::command]
fn check_emulators_installed() -> EmulatorStatus {
    let (ps1_installed, ps1_path) = get_default_emulator("duckstation");
    let (ps2_installed, ps2_path) = get_default_emulator("pcsx2");
    let (ps3_installed, ps3_path) = get_default_emulator("rpcs3");

    EmulatorStatus {
        ps1_installed,
        ps1_path,
        ps2_installed,
        ps2_path,
        ps3_installed,
        ps3_path,
    }
}

#[tauri::command]
fn launch_game(
    platform: String,
    rom_path: String,
    custom_emulator_path: Option<String>,
) -> Result<String, String> {
    let platform_lower = platform.to_lowercase();
    let emu_name = match platform_lower.as_str() {
        "ps1" => "duckstation",
        "ps2" => "pcsx2",
        "ps3" => "rpcs3",
        _ => return Err(format!("Plataforma desconhecida: {}", platform)),
    };

    let emu_path = if let Some(custom) = custom_emulator_path.filter(|s| !s.is_empty()) {
        custom
    } else {
        let (_, default_p) = get_default_emulator(emu_name);
        default_p
    };

    let p = Path::new(&emu_path);
    if !p.exists() {
        let download_info = match emu_name {
            "duckstation" => "DuckStation (https://github.com/stenzek/duckstation/releases)",
            "pcsx2" => "PCSX2 (https://pcsx2.net/downloads)",
            "rpcs3" => "RPCS3 (https://rpcs3.net/download)",
            _ => "Emulador",
        };
        return Err(format!(
            "Emulador não encontrado no caminho:\n{}\n\nPor favor configure o caminho correto nas configurações ou instale {}",
            emu_path, download_info
        ));
    }

    #[cfg(target_os = "windows")]
    {
        let mut cmd = Command::new(&emu_path);
        match platform_lower.as_str() {
            "ps1" => {
                cmd.arg("-batch").arg("-fullscreen").arg(&rom_path);
            }
            "ps2" => {
                cmd.arg("-fullscreen").arg("-batch").arg(&rom_path);
            }
            "ps3" => {
                cmd.arg("--fullscreen").arg(&rom_path);
            }
            _ => {
                cmd.arg(&rom_path);
            }
        }
        cmd.spawn().map_err(|e| format!("Falha ao iniciar {}: {}", emu_path, e))?;
        return Ok(format!("Iniciando jogo: {}", rom_path));
    }

    #[cfg(target_os = "macos")]
    {
        let inner_binary = match platform_lower.as_str() {
            "ps1" => {
                let bin = p.join("Contents/MacOS/DuckStation");
                if bin.exists() { Some(bin) } else { None }
            }
            "ps2" => {
                let bin = p.join("Contents/MacOS/PCSX2");
                if bin.exists() { Some(bin) } else { None }
            }
            "ps3" => {
                let bin = p.join("Contents/MacOS/RPCS3");
                if bin.exists() { Some(bin) } else { None }
            }
            _ => None,
        };

        if let Some(bin) = inner_binary {
            let mut cmd = Command::new(&bin);
            match platform_lower.as_str() {
                "ps1" => {
                    cmd.arg("-batch").arg("-fullscreen").arg(&rom_path);
                }
                "ps2" => {
                    cmd.arg("-fullscreen").arg("-batch").arg(&rom_path);
                }
                "ps3" => {
                    cmd.arg("--fullscreen").arg(&rom_path);
                }
                _ => {
                    cmd.arg(&rom_path);
                }
            }
            cmd.spawn().map_err(|e| format!("Falha ao iniciar {}: {}", bin.display(), e))?;
        } else {
            let mut cmd = Command::new("open");
            cmd.arg("-a").arg(&emu_path).arg("--args");
            match platform_lower.as_str() {
                "ps1" => {
                    cmd.arg("-batch").arg("-fullscreen").arg(&rom_path);
                }
                "ps2" => {
                    cmd.arg("-fullscreen").arg("-batch").arg(&rom_path);
                }
                "ps3" => {
                    cmd.arg("--fullscreen").arg(&rom_path);
                }
                _ => {
                    cmd.arg(&rom_path);
                }
            }
            cmd.spawn().map_err(|e| format!("Falha ao abrir com open: {}", e))?;
        }
        return Ok(format!("Iniciando jogo: {}", rom_path));
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        let mut cmd = Command::new(&emu_path);
        cmd.arg(&rom_path);
        cmd.spawn().map_err(|e| format!("Falha ao iniciar {}: {}", emu_path, e))?;
        return Ok(format!("Iniciando jogo: {}", rom_path));
    }
}

fn open_system_folder(path: &Path) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Falha ao abrir Explorer: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Falha ao abrir Finder: {}", e))?;
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Falha ao abrir pasta: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
fn open_external_url(url: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", &url])
            .spawn()
            .map_err(|e| format!("Falha ao abrir URL {}: {}", url, e))?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Falha ao abrir URL {}: {}", url, e))?;
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Falha ao abrir URL {}: {}", url, e))?;
    }
    Ok(format!("Página aberta no navegador: {}", url))
}

#[tauri::command]
fn install_duckstation_auto() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let winget_status = Command::new("winget")
            .args(["install", "--id", "DuckStation.DuckStation", "-e", "--accept-package-agreements", "--accept-source-agreements"])
            .status();

        if let Ok(st) = winget_status {
            if st.success() {
                return Ok("DuckStation instalado com sucesso via Winget no Windows!".to_string());
            }
        }

        let _ = open_external_url("https://github.com/stenzek/duckstation/releases".to_string());
        return Ok("Abrindo página de download do DuckStation para Windows...".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        let zip_url = "https://github.com/stenzek/duckstation/releases/download/latest/duckstation-mac-release.zip";
        let temp_zip = "/tmp/duckstation-installer.zip";

        let status = Command::new("curl")
            .arg("-s")
            .arg("-L")
            .arg(zip_url)
            .arg("-o")
            .arg(temp_zip)
            .status()
            .map_err(|e| format!("Falha ao baixar DuckStation: {}", e))?;

        if !status.success() {
            return Err("Falha no download do pacote do DuckStation.".to_string());
        }

        let unzip_status = Command::new("unzip")
            .arg("-q")
            .arg("-o")
            .arg(temp_zip)
            .arg("-d")
            .arg("/Applications")
            .status()
            .map_err(|e| format!("Falha ao descompactar: {}", e))?;

        let _ = fs::remove_file(temp_zip);

        if !unzip_status.success() {
            return Err("Falha ao extrair DuckStation.app para /Applications.".to_string());
        }

        let _ = Command::new("xattr")
            .arg("-cr")
            .arg("/Applications/DuckStation.app")
            .status();

        if Path::new("/Applications/DuckStation.app").exists() {
            Ok("DuckStation instalado com sucesso em /Applications!".to_string())
        } else {
            Err("Instalação concluída, mas DuckStation.app não foi encontrado.".to_string())
        }
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        Err("Instalação automática suportada apenas no Windows e macOS.".to_string())
    }
}

#[tauri::command]
fn install_pcsx2_brew() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let winget_status = Command::new("winget")
            .args(["install", "--id", "PCSX2.PCSX2", "-e", "--accept-package-agreements", "--accept-source-agreements"])
            .status();

        if let Ok(st) = winget_status {
            if st.success() {
                return Ok("PCSX2 instalado com sucesso via Winget no Windows!".to_string());
            }
        }

        let _ = open_external_url("https://pcsx2.net/downloads".to_string());
        return Ok("Abrindo página de download do PCSX2 para Windows...".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        let brew_path = if Path::new("/opt/homebrew/bin/brew").exists() {
            "/opt/homebrew/bin/brew"
        } else if Path::new("/usr/local/bin/brew").exists() {
            "/usr/local/bin/brew"
        } else {
            return Err("Homebrew não encontrado no Mac. Use o botão para abrir o site do PCSX2.".to_string());
        };

        let status = Command::new(brew_path)
            .arg("install")
            .arg("--cask")
            .arg("pcsx2")
            .status()
            .map_err(|e| format!("Falha ao executar Homebrew: {}", e))?;

        if status.success() {
            Ok("PCSX2 instalado com sucesso em /Applications!".to_string())
        } else {
            Err("Homebrew retornou um erro ao tentar instalar o PCSX2.".to_string())
        }
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        Err("Instalação automática suportada apenas no Windows e macOS.".to_string())
    }
}

fn get_pcsx2_bios_dir() -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        if let Some(docs) = dirs::document_dir() {
            let p = docs.join("PCSX2").join("bios");
            if p.exists() {
                return p;
            }
        }
        if let Some(data) = dirs::data_dir() {
            let p = data.join("PCSX2").join("bios");
            if p.exists() {
                return p;
            }
        }
        if let Some(docs) = dirs::document_dir() {
            return docs.join("PCSX2").join("bios");
        }
        PathBuf::from("C:\\PCSX2\\bios")
    }

    #[cfg(target_os = "macos")]
    {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        PathBuf::from(home)
            .join("Library")
            .join("Application Support")
            .join("PCSX2")
            .join("bios")
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        if let Some(config) = dirs::config_dir() {
            config.join("PCSX2").join("bios")
        } else {
            PathBuf::from(".pcsx2/bios")
        }
    }
}

fn get_pcsx2_config_dir() -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        if let Some(docs) = dirs::document_dir() {
            let p = docs.join("PCSX2").join("inis");
            if p.exists() {
                return p;
            }
        }
        if let Some(data) = dirs::data_dir() {
            let p = data.join("PCSX2").join("inis");
            if p.exists() {
                return p;
            }
        }
        if let Some(docs) = dirs::document_dir() {
            return docs.join("PCSX2").join("inis");
        }
        PathBuf::from("C:\\PCSX2\\inis")
    }

    #[cfg(target_os = "macos")]
    {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        PathBuf::from(home)
            .join("Library")
            .join("Application Support")
            .join("PCSX2")
            .join("inis")
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        if let Some(config) = dirs::config_dir() {
            config.join("PCSX2").join("inis")
        } else {
            PathBuf::from(".pcsx2/inis")
        }
    }
}

#[tauri::command]
fn get_pcsx2_bios_status() -> Pcsx2BiosStatus {
    let bios_dir = get_pcsx2_bios_dir();
    let config_dir = get_pcsx2_config_dir();
    let _ = fs::create_dir_all(&bios_dir);
    let _ = fs::create_dir_all(&config_dir);

    let mut bios_files = Vec::new();
    if let Ok(entries) = fs::read_dir(&bios_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                let ext = path.extension().unwrap_or_default().to_string_lossy().to_lowercase();
                if ["bin", "rom0", "rom1", "rom2", "nvm", "mec", "gz", "zip"].contains(&ext.as_str()) {
                    let size = if let Ok(meta) = entry.metadata() {
                        format_file_size(meta.len())
                    } else {
                        "0 MB".to_string()
                    };
                    bios_files.push(BiosFileInfo {
                        name,
                        size,
                        path: path.to_string_lossy().to_string(),
                    });
                }
            }
        }
    }

    bios_files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    let has_bios = bios_files.iter().any(|f| f.name.to_lowercase().ends_with(".bin"));

    Pcsx2BiosStatus {
        bios_dir: bios_dir.to_string_lossy().to_string(),
        config_dir: config_dir.to_string_lossy().to_string(),
        bios_files,
        has_bios,
    }
}

#[tauri::command]
fn open_finder_folder(target: String) -> Result<String, String> {
    let path = match target.as_str() {
        "pcsx2_bios" => get_pcsx2_bios_dir(),
        "pcsx2_config" => get_pcsx2_config_dir(),
        "duckstation_bios" => {
            #[cfg(target_os = "windows")]
            {
                if let Some(docs) = dirs::document_dir() {
                    docs.join("DuckStation").join("bios")
                } else {
                    PathBuf::from("C:\\DuckStation\\bios")
                }
            }
            #[cfg(target_os = "macos")]
            {
                let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
                PathBuf::from(&home)
                    .join("Library")
                    .join("Application Support")
                    .join("DuckStation")
                    .join("bios")
            }
            #[cfg(not(any(target_os = "windows", target_os = "macos")))]
            {
                if let Some(config) = dirs::config_dir() {
                    config.join("duckstation").join("bios")
                } else {
                    PathBuf::from(".duckstation/bios")
                }
            }
        }
        "rpcs3" => {
            #[cfg(target_os = "windows")]
            {
                if let Some(data) = dirs::data_dir() {
                    data.join("rpcs3")
                } else {
                    PathBuf::from("C:\\RPCS3")
                }
            }
            #[cfg(target_os = "macos")]
            {
                let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
                PathBuf::from(&home)
                    .join("Library")
                    .join("Application Support")
                    .join("rpcs3")
            }
            #[cfg(not(any(target_os = "windows", target_os = "macos")))]
            {
                if let Some(config) = dirs::config_dir() {
                    config.join("rpcs3")
                } else {
                    PathBuf::from(".rpcs3")
                }
            }
        }
        _ => return Err(format!("Destino desconhecido: {}", target)),
    };

    let _ = fs::create_dir_all(&path);
    open_system_folder(&path)?;

    Ok(format!("Pasta aberta: {}", path.display()))
}

#[tauri::command]
fn open_emulator_gui(emulator: String) -> Result<String, String> {
    let emu_name = emulator.to_lowercase();
    let (found, path) = get_default_emulator(&emu_name);
    if !found && !Path::new(&path).exists() {
        return Err(format!("{} não encontrado no sistema.", emulator));
    }

    #[cfg(target_os = "windows")]
    {
        Command::new(&path)
            .spawn()
            .map_err(|e| format!("Falha ao abrir {}: {}", path, e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-a")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Falha ao abrir {}: {}", path, e))?;
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        Command::new(&path)
            .spawn()
            .map_err(|e| format!("Falha ao abrir {}: {}", path, e))?;
    }

    Ok(format!("Abrindo painel do {}", emulator))
}

#[tauri::command]
fn choose_and_import_ps2_bios() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let ps_script = r#"[System.Reflection.Assembly]::LoadWithPartialName('System.windows.forms') | Out-Null; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = 'BIOS PS2 (*.bin)|*.bin|Todos os Arquivos (*.*)|*.*'; $f.Title = 'Selecione a BIOS do PS2'; if($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK){ Write-Output $f.FileName }"#;
        let output = Command::new("powershell")
            .arg("-NoProfile")
            .arg("-Command")
            .arg(ps_script)
            .output()
            .map_err(|e| format!("Falha ao abrir seletor de arquivos no Windows: {}", e))?;

        if !output.status.success() {
            return Err("Seleção cancelada pelo usuário.".to_string());
        }

        let raw_path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if raw_path.is_empty() {
            return Err("Nenhum arquivo selecionado.".to_string());
        }

        let source_path = Path::new(&raw_path);
        if !source_path.exists() {
            return Err("Arquivo de origem não encontrado.".to_string());
        }

        let filename = source_path
            .file_name()
            .ok_or("Nome de arquivo inválido")?
            .to_string_lossy();

        let bios_dir = get_pcsx2_bios_dir();
        let _ = fs::create_dir_all(&bios_dir);
        let dest_path = bios_dir.join(filename.as_ref());

        fs::copy(source_path, &dest_path)
            .map_err(|e| format!("Erro ao copiar BIOS para {}: {}", dest_path.display(), e))?;

        return Ok(format!("BIOS {} importada com sucesso para o PCSX2!", filename));
    }

    #[cfg(target_os = "macos")]
    {
        let script = r#"POSIX path of (choose file with prompt "Selecione o arquivo de BIOS do PS2 (.bin):")"#;
        let output = Command::new("osascript")
            .arg("-e")
            .arg(script)
            .output()
            .map_err(|e| format!("Falha ao abrir seletor de arquivos: {}", e))?;

        if !output.status.success() {
            return Err("Seleção cancelada pelo usuário.".to_string());
        }

        let raw_path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if raw_path.is_empty() {
            return Err("Nenhum arquivo selecionado.".to_string());
        }

        let source_path = Path::new(&raw_path);
        if !source_path.exists() {
            return Err("Arquivo de origem não encontrado.".to_string());
        }

        let filename = source_path
            .file_name()
            .ok_or("Nome de arquivo inválido")?
            .to_string_lossy();

        let bios_dir = get_pcsx2_bios_dir();
        let _ = fs::create_dir_all(&bios_dir);
        let dest_path = bios_dir.join(filename.as_ref());

        fs::copy(source_path, &dest_path)
            .map_err(|e| format!("Erro ao copiar BIOS para {}: {}", dest_path.display(), e))?;

        return Ok(format!("BIOS {} importada com sucesso para o PCSX2!", filename));
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        Err("Seletor nativo não suportado neste OS. Use a importação manual de arquivo.".to_string())
    }
}

#[tauri::command]
fn import_bios_file_bytes(filename: String, base64_content: String) -> Result<String, String> {
    use base64::Engine;
    let bios_dir = get_pcsx2_bios_dir();
    let _ = fs::create_dir_all(&bios_dir);
    let target_file = bios_dir.join(&filename);

    let decoded = base64::engine::general_purpose::STANDARD
        .decode(&base64_content)
        .map_err(|e| format!("Erro ao decodificar arquivo: {}", e))?;

    fs::write(&target_file, decoded)
        .map_err(|e| format!("Falha ao salvar BIOS: {}", e))?;

    Ok(format!("Arquivo {} copiado com sucesso para a pasta de BIOS!", filename))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_platform_info,
            get_config,
            save_config,
            scan_roms,
            scrape_all_covers,
            check_emulators_installed,
            launch_game,
            open_external_url,
            install_duckstation_auto,
            install_pcsx2_brew,
            get_pcsx2_bios_status,
            open_finder_folder,
            open_emulator_gui,
            choose_and_import_ps2_bios,
            import_bios_file_bytes
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
