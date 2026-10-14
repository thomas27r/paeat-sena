import React from 'react';
import { Settings, Menu, ArrowLeft } from 'lucide-react';
import { playTapSound } from '../utils/audio';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showSettings?: boolean;
  onSettings?: () => void;
  showMenu?: boolean;
  onMenu?: () => void;
  rightAction?: 'settings' | 'back' | 'none';
  onRightAction?: () => void;
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  showBack = false,
  onBack,
  showSettings = false,
  onSettings,
  showMenu = false,
  onMenu,
  rightAction = 'none',
  onRightAction,
  onLogoClick,
}) => {
  const handleSettingsClick = () => {
    playTapSound();
    if (onSettings) {
      onSettings();
    } else if (onRightAction) {
      onRightAction();
    }
  };

  const handleBackClick = () => {
    playTapSound();
    if (onBack) {
      onBack();
    } else if (onRightAction) {
      onRightAction();
    }
  };

  const handleMenuClick = () => {
    playTapSound();
    if (onMenu) {
      onMenu();
    }
  };

  const handleLogoClick = () => {
    playTapSound();
    if (onLogoClick) {
      onLogoClick();
    }
  };

  return (
    <header className="w-full bg-[#dedede] text-[#3d081b] px-3 sm:px-4 py-2 flex items-center justify-between border-b border-stone-300 shadow-xs select-none sticky top-0 z-40 backdrop-blur-md">
      {/* Left Slot: Back Arrow or Hamburger Menu */}
      <div className="w-10 flex items-center justify-start">
        {showBack && (onBack || onRightAction) ? (
          <button
            onClick={handleBackClick}
            className="p-1 rounded-lg text-[#3d081b] hover:bg-stone-300/80 active:scale-90 transition-all cursor-pointer"
            aria-label="Volver atrás"
            title="Volver atrás"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : showMenu && onMenu ? (
          <button
            onClick={handleMenuClick}
            className="p-1 rounded-lg text-[#3d081b] hover:bg-stone-300/80 active:scale-90 transition-all cursor-pointer"
            aria-label="Menú principal"
            title="Menú principal"
          >
            <Menu className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : null}
      </div>

      {/* Center Logo Text: PAEAT® */}
      <div className="flex-1 text-center flex items-center justify-center">
        {onLogoClick ? (
          <button
            onClick={handleLogoClick}
            className="text-lg sm:text-xl font-black tracking-wider text-[#3d081b] uppercase inline-flex items-center gap-0.5 hover:opacity-85 transition cursor-pointer active:scale-98 group"
            title="Ir al inicio / Dashboard"
            aria-label="Ir al inicio / Dashboard"
          >
            <span>PAEAT</span>
            <span className="text-xs sm:text-sm align-top font-bold text-amber-800 group-hover:text-amber-600">®</span>
          </button>
        ) : (
          <h1 className="text-lg sm:text-xl font-black tracking-wider text-[#3d081b] uppercase inline-flex items-center gap-0.5">
            <span>PAEAT</span>
            <span className="text-xs sm:text-sm align-top font-bold text-amber-800">®</span>
          </h1>
        )}
      </div>

      {/* Right Slot: Settings Gear or Custom Action */}
      <div className="w-10 flex items-center justify-end">
        {rightAction === 'settings' || showSettings ? (
          <button
            onClick={handleSettingsClick}
            className="p-1 rounded-lg text-[#3d081b] hover:bg-stone-300/80 hover:rotate-45 active:scale-90 transition-all cursor-pointer"
            aria-label="Ajustes"
            title="Ajustes y Configuración"
          >
            <Settings className="w-5 h-5 stroke-[2.2]" />
          </button>
        ) : rightAction === 'back' && onRightAction ? (
          <button
            onClick={handleBackClick}
            className="p-1 rounded-lg text-[#3d081b] hover:bg-stone-300/80 active:scale-90 transition-all cursor-pointer"
            aria-label="Volver"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : null}
      </div>
    </header>
  );
};


