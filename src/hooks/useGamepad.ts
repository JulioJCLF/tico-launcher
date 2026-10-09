import { useEffect, useRef, useState, useCallback } from 'react';

export type ControllerType = 'playstation' | 'xbox';

export interface GamepadActions {
  onNavigateLeft?: () => void;
  onNavigateRight?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onSelect?: () => void; // Cross / A
  onBack?: () => void; // Circle / B
  onDetails?: () => void; // Square / X
  onFavorite?: () => void; // Triangle / Y
  onPrevTab?: () => void; // L1 / LB
  onNextTab?: () => void; // R1 / RB
  onMenu?: () => void; // Options / Start
  onSettings?: () => void; // Share / Back
}

export interface UseGamepadReturn {
  connected: boolean;
  controllerName: string;
  controllerType: ControllerType;
  isGameSir: boolean;
}

export function useGamepad(actions: GamepadActions): UseGamepadReturn {
  const [connected, setConnected] = useState(false);
  const [controllerName, setControllerName] = useState<string>('Nenhum controle');
  const [controllerType, setControllerType] = useState<ControllerType>('xbox');
  const [isGameSir, setIsGameSir] = useState<boolean>(false);

  // Keep references to prevent animation loop recreation
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const connectedRef = useRef(false);
  const controllerNameRef = useRef('Nenhum controle');
  const controllerTypeRef = useRef<ControllerType>('xbox');
  const isGameSirRef = useRef(false);

  // Track previous button states for edge-triggering
  const prevButtonsRef = useRef<{ [key: number]: boolean }>({});

  // Navigation repeat handling
  const navRepeatRef = useRef<{
    direction: string | null;
    firstPressTime: number;
    lastRepeatTime: number;
  }>({
    direction: null,
    firstPressTime: 0,
    lastRepeatTime: 0,
  });

  const parseControllerInfo = useCallback((id: string): { type: ControllerType; cleanName: string; isGameSir: boolean } => {
    const lower = id.toLowerCase();

    // 1. Check for GameSir devices first (T4, T4 Lite, T4 Pro, Nova, etc.)
    if (
      lower.includes('gamesir') ||
      lower.includes('t4') ||
      lower.includes('2ec2') // GameSir Vendor ID
    ) {
      return {
        type: 'xbox',
        cleanName: 'GameSir T4 Lite',
        isGameSir: true,
      };
    }

    // 2. Check for Nintendo / Switch Pro Controller (Vendor 057e)
    if (lower.includes('057e') || lower.includes('pro controller') || lower.includes('joy-con')) {
      return {
        type: 'xbox', // uses A, B, X, Y buttons
        cleanName: 'Nintendo Switch Pro Controller',
        isGameSir: false,
      };
    }

    // 3. Check for PlayStation controllers (DualShock 4, DualSense, Sony 054c)
    if (
      lower.includes('playstation') ||
      lower.includes('dualshock') ||
      lower.includes('dualsense') ||
      lower.includes('sony') ||
      (lower.includes('wireless controller') && !lower.includes('xbox') && !lower.includes('gamesir')) ||
      lower.includes('054c')
    ) {
      return {
        type: 'playstation',
        cleanName: 'PlayStation Controller',
        isGameSir: false,
      };
    }

    // 4. Default to Xbox / Standard XInput layout
    let cleanName = 'Xbox Wireless Controller';
    if (lower.includes('xbox')) cleanName = 'Xbox Controller';
    else if (id.trim().length > 0) cleanName = id.replace(/\(vendor:[^)]+\)/i, '').trim();

    return {
      type: 'xbox',
      cleanName,
      isGameSir: false,
    };
  }, []);

  useEffect(() => {
    const DEADZONE = 0.35;
    const INITIAL_REPEAT_DELAY = 280; // ms before repeat starts
    const REPEAT_INTERVAL = 120; // ms between repeats while held

    // Helper to get all connected gamepads
    const getActiveGamepad = (): Gamepad | null => {
      if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;
      try {
        const list = Array.from(navigator.getGamepads()).filter(
          (g): g is Gamepad => g !== null && g !== undefined
        );

        // Priority 1: Gamepad with any button currently pressed or axis moved
        const active = list.find(
          (g) =>
            g.buttons.some((b) => (typeof b === 'object' ? b.pressed : b === 1.0)) ||
            g.axes.some((a) => Math.abs(a) > 0.15)
        );
        if (active) return active;

        // Priority 2: Gamepad marked as connected
        const connectedGp = list.find((g) => g.connected);
        if (connectedGp) return connectedGp;

        // Priority 3: First valid gamepad
        return list[0] || null;
      } catch {
        return null;
      }
    };

    const updateConnectionState = (gp: Gamepad | null) => {
      if (gp) {
        const info = parseControllerInfo(gp.id);
        if (!connectedRef.current || controllerNameRef.current !== info.cleanName) {
          connectedRef.current = true;
          controllerNameRef.current = info.cleanName;
          controllerTypeRef.current = info.type;
          isGameSirRef.current = info.isGameSir;

          setConnected(true);
          setControllerName(info.cleanName);
          setControllerType(info.type);
          setIsGameSir(info.isGameSir);
        }
      } else {
        if (connectedRef.current) {
          connectedRef.current = false;
          controllerNameRef.current = 'Nenhum controle';
          isGameSirRef.current = false;

          setConnected(false);
          setControllerName('Nenhum controle');
          setIsGameSir(false);
        }
      }
    };

    // Standard event listeners
    const handleConnected = (e: GamepadEvent) => {
      if (e.gamepad) updateConnectionState(e.gamepad);
    };

    const handleDisconnected = () => {
      const remaining = getActiveGamepad();
      updateConnectionState(remaining);
    };

    window.addEventListener('gamepadconnected', handleConnected);
    window.addEventListener('gamepaddisconnected', handleDisconnected);

    // In WebKit / macOS WKWebView, Gamepad API activates on first user interaction
    const handleUserInteraction = () => {
      const gp = getActiveGamepad();
      if (gp) updateConnectionState(gp);
    };

    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });
    window.addEventListener('focus', handleUserInteraction);

    // Initial check on mount
    const initialGp = getActiveGamepad();
    if (initialGp) updateConnectionState(initialGp);

    // Polling loop
    let animId: number;

    const poll = (time: number) => {
      const gp = getActiveGamepad();

      if (gp) {
        updateConnectionState(gp);

        const act = actionsRef.current;
        const prev = prevButtonsRef.current;

        // Helper to check button edge (just pressed)
        const isJustPressed = (btnIndex: number) => {
          const btn = gp.buttons[btnIndex];
          const pressed = btn ? (typeof btn === 'object' ? btn.pressed : btn === 1.0) : false;
          const wasPressed = !!prev[btnIndex];
          prev[btnIndex] = pressed;
          return pressed && !wasPressed;
        };

        // Standard Face Buttons (A, B, X, Y or Cross, Circle, Square, Triangle)
        if (isJustPressed(0)) act.onSelect?.(); // A / Cross
        if (isJustPressed(1)) act.onBack?.(); // B / Circle
        if (isJustPressed(2)) act.onDetails?.(); // X / Square
        if (isJustPressed(3)) act.onFavorite?.(); // Y / Triangle

        // Shoulder & Triggers
        if (isJustPressed(4)) act.onPrevTab?.(); // L1 / LB
        if (isJustPressed(5)) act.onNextTab?.(); // R1 / RB

        // Back / View / Share & Start / Menu / Options
        if (isJustPressed(8)) act.onSettings?.(); // Back / Share
        if (isJustPressed(9)) act.onMenu?.(); // Start / Options
        if (isJustPressed(16)) act.onSettings?.(); // Guide / Home

        // Direction navigation (Supports D-Pad buttons, Analog Stick, and GameSir D-Pad Axes)
        let currentDir: 'left' | 'right' | 'up' | 'down' | null = null;

        // Standard D-Pad buttons: 12 = up, 13 = down, 14 = left, 15 = right
        const dUp = gp.buttons[12]?.pressed;
        const dDown = gp.buttons[13]?.pressed;
        const dLeft = gp.buttons[14]?.pressed;
        const dRight = gp.buttons[15]?.pressed;

        // Left Analog Stick (Axes 0, 1)
        const stickX = gp.axes[0] ?? 0;
        const stickY = gp.axes[1] ?? 0;

        // Secondary D-Pad Axes (Axes 4, 5 common in GameSir Mac/DInput modes)
        const altDpadX = gp.axes[4] ?? 0;
        const altDpadY = gp.axes[5] ?? 0;

        // Hat switch (Axis 9)
        const hat = gp.axes[9];
        const hatUp = hat !== undefined && hat >= -1.05 && hat <= -0.65;
        const hatRight = hat !== undefined && hat >= -0.45 && hat <= -0.15;
        const hatDown = hat !== undefined && hat >= 0.05 && hat <= 0.35;
        const hatLeft = hat !== undefined && hat >= 0.65 && hat <= 0.95;

        if (dLeft || stickX < -DEADZONE || altDpadX < -0.5 || hatLeft) {
          currentDir = 'left';
        } else if (dRight || stickX > DEADZONE || altDpadX > 0.5 || hatRight) {
          currentDir = 'right';
        } else if (dUp || stickY < -DEADZONE || altDpadY < -0.5 || hatUp) {
          currentDir = 'up';
        } else if (dDown || stickY > DEADZONE || altDpadY > 0.5 || hatDown) {
          currentDir = 'down';
        }

        // Handle navigation with auto-repeat
        const nav = navRepeatRef.current;
        if (currentDir) {
          if (nav.direction !== currentDir) {
            // First time pressing this direction
            nav.direction = currentDir;
            nav.firstPressTime = time;
            nav.lastRepeatTime = time;

            if (currentDir === 'left') act.onNavigateLeft?.();
            if (currentDir === 'right') act.onNavigateRight?.();
            if (currentDir === 'up') act.onNavigateUp?.();
            if (currentDir === 'down') act.onNavigateDown?.();
          } else {
            // Holding direction: check repeat
            const heldDuration = time - nav.firstPressTime;
            if (heldDuration > INITIAL_REPEAT_DELAY) {
              const timeSinceLastRepeat = time - nav.lastRepeatTime;
              if (timeSinceLastRepeat > REPEAT_INTERVAL) {
                nav.lastRepeatTime = time;
                if (currentDir === 'left') act.onNavigateLeft?.();
                if (currentDir === 'right') act.onNavigateRight?.();
                if (currentDir === 'up') act.onNavigateUp?.();
                if (currentDir === 'down') act.onNavigateDown?.();
              }
            }
          }
        } else {
          nav.direction = null;
        }
      } else {
        updateConnectionState(null);
      }

      animId = requestAnimationFrame(poll);
    };

    animId = requestAnimationFrame(poll);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('gamepadconnected', handleConnected);
      window.removeEventListener('gamepaddisconnected', handleDisconnected);
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('focus', handleUserInteraction);
    };
  }, [parseControllerInfo]);

  return {
    connected,
    controllerName,
    controllerType,
    isGameSir,
  };
}
