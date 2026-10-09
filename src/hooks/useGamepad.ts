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

export function useGamepad(actions: GamepadActions) {
  const [connected, setConnected] = useState(false);
  const [controllerName, setControllerName] = useState<string>('Nenhum controle');
  const [controllerType, setControllerType] = useState<ControllerType>('playstation');

  // Ref to hold the latest actions so requestAnimationFrame doesn't go stale
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  // Track previous button states for edge-triggering (press once per tap)
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

  const detectType = useCallback((id: string): ControllerType => {
    const lower = id.toLowerCase();
    if (
      lower.includes('playstation') ||
      lower.includes('dualshock') ||
      lower.includes('dualsense') ||
      lower.includes('sony') ||
      lower.includes('wireless controller') ||
      lower.includes('054c')
    ) {
      return 'playstation';
    }
    return 'xbox';
  }, []);

  useEffect(() => {
    const handleConnected = (e: GamepadEvent) => {
      const gp = e.gamepad;
      if (gp) {
        setConnected(true);
        setControllerName(gp.id);
        setControllerType(detectType(gp.id));
      }
    };

    const handleDisconnected = () => {
      // Check if any other gamepad is still connected
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let found = false;
      for (const gp of gamepads) {
        if (gp) {
          setConnected(true);
          setControllerName(gp.id);
          setControllerType(detectType(gp.id));
          found = true;
          break;
        }
      }
      if (!found) {
        setConnected(false);
        setControllerName('Nenhum controle');
      }
    };

    window.addEventListener('gamepadconnected', handleConnected);
    window.addEventListener('gamepaddisconnected', handleDisconnected);

    // Initial check
    const initialGps = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of initialGps) {
      if (gp) {
        setConnected(true);
        setControllerName(gp.id);
        setControllerType(detectType(gp.id));
        break;
      }
    }

    // Polling loop
    let animId: number;
    const DEADZONE = 0.35;
    const INITIAL_REPEAT_DELAY = 300; // ms before repeat starts
    const REPEAT_INTERVAL = 130; // ms between repeats while held

    const poll = (time: number) => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];

      if (gp) {
        if (!connected) {
          setConnected(true);
          setControllerName(gp.id);
          setControllerType(detectType(gp.id));
        }

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

        // Standard Face & Shoulder buttons
        if (isJustPressed(0)) act.onSelect?.(); // Cross / A
        if (isJustPressed(1)) act.onBack?.(); // Circle / B
        if (isJustPressed(2)) act.onDetails?.(); // Square / X
        if (isJustPressed(3)) act.onFavorite?.(); // Triangle / Y
        if (isJustPressed(4)) act.onPrevTab?.(); // L1 / LB
        if (isJustPressed(5)) act.onNextTab?.(); // R1 / RB
        if (isJustPressed(8)) act.onSettings?.(); // Share / Back
        if (isJustPressed(9)) act.onMenu?.(); // Options / Start

        // Direction navigation (D-Pad + Left Stick)
        let currentDir: 'left' | 'right' | 'up' | 'down' | null = null;

        // D-Pad buttons: 12 = up, 13 = down, 14 = left, 15 = right
        const dUp = gp.buttons[12]?.pressed;
        const dDown = gp.buttons[13]?.pressed;
        const dLeft = gp.buttons[14]?.pressed;
        const dRight = gp.buttons[15]?.pressed;

        // Left Analog Stick
        const stickX = gp.axes[0] || 0;
        const stickY = gp.axes[1] || 0;

        if (dLeft || stickX < -DEADZONE) {
          currentDir = 'left';
        } else if (dRight || stickX > DEADZONE) {
          currentDir = 'right';
        } else if (dUp || stickY < -DEADZONE) {
          currentDir = 'up';
        } else if (dDown || stickY > DEADZONE) {
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
      }

      animId = requestAnimationFrame(poll);
    };

    animId = requestAnimationFrame(poll);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('gamepadconnected', handleConnected);
      window.removeEventListener('gamepaddisconnected', handleDisconnected);
    };
  }, [detectType, connected]);

  return {
    connected,
    controllerName,
    controllerType,
  };
}
