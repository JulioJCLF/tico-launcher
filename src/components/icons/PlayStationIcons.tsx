import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  colored?: boolean;
}

// PlayStation Cross (✕) - Blue
export const PSCross: React.FC<IconProps> = ({ size = 16, className = '', colored = true }) => {
  const strokeColor = colored ? '#60a5fa' : 'currentColor';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      data-testid="ps-icon-cross"
    >
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
};

// PlayStation Circle (○) - Red
export const PSCircle: React.FC<IconProps> = ({ size = 16, className = '', colored = true }) => {
  const strokeColor = colored ? '#f87171' : 'currentColor';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      data-testid="ps-icon-circle"
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
};

// PlayStation Square (▢) - Pink/Magenta
export const PSSquare: React.FC<IconProps> = ({ size = 16, className = '', colored = true }) => {
  const strokeColor = colored ? '#f472b6' : 'currentColor';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      data-testid="ps-icon-square"
    >
      <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" />
    </svg>
  );
};

// PlayStation Triangle (△) - Green
export const PSTriangle: React.FC<IconProps> = ({ size = 16, className = '', colored = true }) => {
  const strokeColor = colored ? '#34d399' : 'currentColor';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      data-testid="ps-icon-triangle"
    >
      <polygon points="12 4 21 19 3 19" strokeLinejoin="round" />
    </svg>
  );
};

// Badge wrapper with subtle frosted dark disk like real console buttons
export type PSButtonType = 'cross' | 'circle' | 'square' | 'triangle';

interface PSButtonBadgeProps {
  type: PSButtonType;
  size?: number;
  colored?: boolean;
  className?: string;
}

export const PSButtonBadge: React.FC<PSButtonBadgeProps> = ({
  type,
  size = 13,
  colored = true,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/10 border border-white/15 shadow-sm flex-shrink-0 ${className}`}
      data-testid={`ps-badge-${type}`}
    >
      {type === 'cross' && <PSCross size={size} colored={colored} />}
      {type === 'circle' && <PSCircle size={size} colored={colored} />}
      {type === 'square' && <PSSquare size={size} colored={colored} />}
      {type === 'triangle' && <PSTriangle size={size} colored={colored} />}
    </span>
  );
};

// Generic Controller Prompt Badge (handles both PlayStation and Xbox modes)
interface ControllerPromptProps {
  button: 'cross' | 'circle' | 'square' | 'triangle' | 'l1' | 'r1' | 'share' | 'options';
  isPlaystation: boolean;
  colored?: boolean;
  className?: string;
}

export const ControllerPrompt: React.FC<ControllerPromptProps> = ({
  button,
  isPlaystation,
  colored = true,
  className = '',
}) => {
  if (isPlaystation) {
    if (button === 'cross' || button === 'circle' || button === 'square' || button === 'triangle') {
      return <PSButtonBadge type={button} colored={colored} className={className} />;
    }
    if (button === 'l1' || button === 'r1') {
      return (
        <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-zinc-300">
          {button.toUpperCase()}
        </span>
      );
    }
    if (button === 'share') {
      return (
        <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[9px] font-bold text-zinc-300 tracking-wider">
          SHARE
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[9px] font-bold text-zinc-300 tracking-wider">
        OPTIONS
      </span>
    );
  }

  // Xbox Fallback
  const xboxLabels: Record<string, string> = {
    cross: 'A',
    circle: 'B',
    square: 'X',
    triangle: 'Y',
    l1: 'LB',
    r1: 'RB',
    share: 'VIEW',
    options: 'MENU',
  };

  const xboxColors: Record<string, string> = {
    cross: 'text-emerald-400',
    circle: 'text-rose-400',
    square: 'text-blue-400',
    triangle: 'text-amber-400',
  };

  const isFace = button === 'cross' || button === 'circle' || button === 'square' || button === 'triangle';

  return (
    <span
      className={`inline-flex items-center justify-center font-bold text-[11px] ${
        isFace
          ? `w-5 h-5 rounded-full bg-white/10 border border-white/15 ${colored ? xboxColors[button] : 'text-white'}`
          : 'px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-zinc-300'
      } ${className}`}
      data-testid={`xbox-badge-${button}`}
    >
      {xboxLabels[button] || button}
    </span>
  );
};
