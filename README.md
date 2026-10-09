# Tico 🎮 (macOS & Windows)

Front-end minimalista, ultraleve e console-first inspirado no **Tico** do Nintendo Switch, construído para **macOS** (Apple Silicon / Intel) e **Windows** (x64) com **Tauri 2**, **React 19**, **Tailwind CSS** e **Rust**.

Projetado para rodar com alta performance e sem distrações títulos de **PlayStation 1**, **PlayStation 2** e **PlayStation 3** com suporte completo a controles de videogame (DualShock 4 / PS4 e XInput / Xbox).

---

## ✨ Recursos

* 🍏 **Design Apple-like:** Efeitos de vidro fosco (*frosted glass*), anéis de seleção sutis, elevação tvOS e ambient glow baseado na arte do jogo.
* 🎮 **Gamepad First:** Navegação 100% pensada para controle. Suporte nativo a controles PlayStation (exibindo os ícones oficiais ✕, ○, ▢, △) e Xbox (A, B, X, Y).
* 🌐 **Scraper Libretro Automático:** Baixa em segundo plano as capinhas oficiais em alta resolução direto do CDN da comunidade Libretro.
* 💾 **Gerenciador de BIOS e Configs do PS2:** Verificação integrada do status da BIOS, importação automática com 1 clique e atalhos rápidos para abrir as pastas no Finder ou Explorer.
* ⚡ **Ultraleve e Instantâneo:** Inicialização em milissegundos, consumo de RAM inferior a 45 MB e binário nativo.
* 🪟 **Multiplataforma Nativo:** Roda nativamente no macOS (Metal) e no Windows 10/11 (DirectX/Vulkan).

---

## 📥 Como Instalar e Rodar

### Opção 1: Baixar Binários Prontos (GitHub Releases)
Vá na aba [Releases](https://github.com/JulioJCLF/tico-launcher/releases) do repositório:
* **macOS:** Baixe o arquivo `.dmg`, abra e arraste o **Tico** para sua pasta `/Applications`.
* **Windows:** Baixe o instalador `.msi` ou o executável portátil `.exe` e execute diretamente.

---

### Opção 2: Compilar a partir do Código-Fonte

#### Pré-requisitos
1. **Node.js** (versão 20 ou superior): [nodejs.org](https://nodejs.org)
2. **Rust & Cargo**: [rustup.rs](https://rustup.rs)
   * No Windows: certifique-se de ter as ferramentas de compilação C++ (*Visual Studio C++ Build Tools*).
   * No macOS: certifique-se de ter o Xcode Command Line Tools (`xcode-select --install`).

#### Passo a Passo

1. **Clonar o Repositório:**
   ```bash
   git clone https://github.com/JulioJCLF/tico-launcher.git
   cd tico-launcher
   ```

2. **Instalar Dependências Frontend:**
   ```bash
   npm install
   ```

3. **Rodar em Modo Desenvolvimento (com Live Reload):**
   ```bash
   npm run tauri:dev
   ```

4. **Compilar o Binário Final de Produção:**
   * **No macOS:**
     ```bash
     npm run tauri:build
     ```
     O arquivo `.dmg` e o `.app` estarão em `src-tauri/target/release/bundle/macos/`.
   * **No Windows:**
     ```cmd
     npm run tauri:build
     ```
     O instalador `.msi` e o `.exe` estarão em `src-tauri/target/release/bundle/msi/`.

---

## 🎮 Controles no Gamepad

O Tico detecta dinamicamente o modelo de controle conectado e adapta a interface gráfica:

| Ação | Controle PS4 / PS5 (DualShock/DualSense) | Controle Xbox (XInput) | Teclado |
| :--- | :--- | :--- | :--- |
| **Navegar pelos Jogos** | D-Pad / Analógico Esquerdo | D-Pad / Analógico Esquerdo | Setas (← / → / ↑ / ↓) |
| **Jogar / Confirmar** | **✕ (Cross)** | **A** | `Enter` |
| **Voltar / Fechar** | **○ (Circle)** | **B** | `Esc` |
| **Detalhes do Jogo** | **▢ (Square)** | **X** | `Espaço` / `I` |
| **Favoritar Jogo** | **△ (Triangle)** | **Y** | `F` |
| **Alternar Sistema (PS1/PS2/PS3)** | **L1** / **R1** | **LB** / **RB** | `Tab` / `Shift+Tab` |
| **Configurações & BIOS** | **SHARE** / **SELECT** | **BACK** / **VIEW** | Clique na engrenagem |

---

## 📁 Onde colocar suas ROMs

O Tico organiza seus jogos por diretório. Você pode personalizar as pastas nas Configurações do app ou utilizar as pastas padrão:

### No macOS:
* **PS1:** `~/Games/ROMs/PS1` (formatos: `.chd`, `.cue`, `.iso`, `.bin`, `.pbp`, `.m3u`)
* **PS2:** `~/Games/ROMs/PS2` (formatos: `.iso`, `.chd`, `.cso`, `.gz`)
* **PS3:** `~/Games/ROMs/PS3` (formatos: `.iso`, `.pkg`, ou pastas com `PS3_GAME/USRDIR/EBOOT.BIN`)

### No Windows:
* **PS1:** `C:\Games\ROMs\PS1` ou `%USERPROFILE%\Documents\Games\ROMs\PS1`
* **PS2:** `C:\Games\ROMs\PS2` ou `%USERPROFILE%\Documents\Games\ROMs\PS2`
* **PS3:** `C:\Games\ROMs\PS3` ou `%USERPROFILE%\Documents\Games\ROMs\PS3`

> 💡 **Dica de Capas Locais:** Caso prefira usar suas próprias imagens, basta colocar um arquivo `.png` com o mesmo nome da ROM na pasta (ex: `Silent Hill.chd` e `Silent Hill.png`). Caso contrário, use o botão **"Buscar Capas na Web"** para baixar tudo automaticamente!

---

## 🕹️ Emuladores Suportados

| Console | Emulador | Instalação no macOS | Instalação no Windows |
| :--- | :--- | :--- | :--- |
| **PS1** | **DuckStation** | 1-Clique pelo app ou [GitHub](https://github.com/stenzek/duckstation/releases) | `winget install DuckStation.DuckStation` |
| **PS2** | **PCSX2** | `brew install --cask pcsx2` ou [Site Oficial](https://pcsx2.net/downloads) | `winget install PCSX2.PCSX2` |
| **PS3** | **RPCS3** | [Site Oficial](https://rpcs3.net/download) | `winget install RPCS3.RPCS3` |

---

## 🧪 Testes Automatizados

O projeto conta com suíte de testes unitários e de componentes de interface utilizando **Vitest** e **React Testing Library**:

```bash
# Executar todos os testes
npm test

# Modo interativo (watch mode)
npm run test:watch
```

---

## 📄 Licença
Distribuído sob a licença MIT. Sinta-se livre para usar, modificar e contribuir!
