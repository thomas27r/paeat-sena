import React from 'react';

interface PaeatLogoProps {
  className?: string;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'badge' | 'full';
  showText?: boolean;
  withGlow?: boolean;
}

export const PaeatLogo: React.FC<PaeatLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'icon',
  showText = false,
  withGlow = false,
}) => {
  const getDimension = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'xs':
        return 20;
      case 'sm':
        return 28;
      case 'md':
        return 38;
      case 'lg':
        return 56;
      case 'xl':
        return 88;
      default:
        return 38;
    }
  };

  const dim = getDimension();

  // SVG representation of the official PAEAT interlocking heart logo
  const logoSvg = (
    <svg
      viewBox="0 0 1000 1000"
      width={dim}
      height={dim}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${className}`}
      aria-label="Logo Oficial PAEAT"
    >
      <defs>
        {withGlow && (
          <filter id="paeat-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#FF0033" floodOpacity="0.4" />
          </filter>
        )}
      </defs>

      <g filter={withGlow ? 'url(#paeat-glow)' : undefined}>
        {/* Red Ribbon / Left Lobe of Heart */}
        <path
          d="M 50 747 L 252 747 L 672 380 L 442 150 C 370 78 250 78 178 150 C 106 222 106 342 178 414 L 330 566 L 246 650 L 140 544 C 40 444 40 280 140 180 C 240 80 404 80 504 180 L 610 286 L 672 380 L 50 747 Z"
          fill="#FF002B"
        />

        {/* Wine / Burgundy Ribbon / Right Lobe of Heart */}
        <path
          d="M 480 930 L 320 770 L 685 405 L 805 285 C 877 213 877 93 805 21 C 733 -51 613 -51 541 21 L 435 127 L 519 211 L 625 105 C 673 57 749 57 797 105 C 845 153 845 229 797 277 L 735 339 L 480 930 Z"
          fill="#780D3D"
        />

        {/* Alternative Crisp Geometric Interlocking Heart rendering exact to Paeat.png */}
        {/* Left 'P' Red Loop */}
        <path
          d="M 58 748 L 260 748 L 672 376 C 596 300 488 280 410 338 L 330 418 C 286 462 214 462 170 418 C 126 374 126 302 170 258 C 248 180 374 180 452 258 L 512 318 L 572 258 C 466 152 294 152 188 258 C 82 364 82 536 188 642 L 58 748 Z"
          fill="#FF002B"
        />

        {/* Right Deep Wine Lobe with exact overlap */}
        <path
          d="M 480 930 L 320 770 L 460 630 C 504 586 576 586 620 630 C 664 674 664 746 620 790 L 540 870 C 618 948 744 948 822 870 C 928 764 928 592 822 486 L 762 426 L 702 486 C 780 564 780 690 702 768 C 658 812 586 812 542 768 L 480 930 Z"
          fill="#780D3D"
        />
      </g>
    </svg>
  );

  if (variant === 'badge') {
    return (
      <div
        className={`bg-stone-950/90 p-2 rounded-2xl border border-rose-900/60 shadow-xl flex items-center justify-center shrink-0 ${className}`}
        style={{ width: dim + 16, height: dim + 16 }}
      >
        {logoSvg}
      </div>
    );
  }

  if (showText) {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        {logoSvg}
        <div className="flex flex-col text-left">
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg sm:text-xl font-black tracking-wider text-[#3d081b] uppercase leading-none">
              PAEAT
            </span>
            <span className="text-xs font-bold text-amber-800">®</span>
          </div>
          <span className="text-[9px] font-bold text-stone-600 tracking-tight uppercase">
            Alimentación Escolar
          </span>
        </div>
      </div>
    );
  }

  return logoSvg;
};
