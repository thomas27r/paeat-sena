import React from 'react';
import { Utensils, GraduationCap, ChevronRight, Building2 } from 'lucide-react';
import { motion } from 'motion/react';

interface WelcomeViewProps {
  onEnter: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onEnter }) => {
  return (
    <div className="fixed inset-0 w-full h-full h-[100dvh] bg-gradient-to-b from-[#3d081b] via-[#2f0615] to-[#1e030c] flex flex-col items-center justify-center p-4 overflow-hidden select-none overscroll-none touch-none">
      {/* Subtle Background Glow */}
      <div className="absolute w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -top-10 -left-10" />
      <div className="absolute w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -bottom-10 -right-10" />

      {/* Main Framed Welcome Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-sm sm:max-w-md bg-[#dedede] border-3 border-[#3d081b] rounded-2xl p-5 sm:p-8 flex flex-col items-center justify-center shadow-2xl text-center relative z-10"
      >
        {/* Heraldic Icon Badge */}
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#3d081b] text-amber-300 flex items-center justify-center shadow-md mb-2.5 sm:mb-3 border border-amber-400/30">
          <Utensils className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
        </div>

        {/* Brand Title */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-wider text-[#3d081b] uppercase select-none drop-shadow-xs flex items-baseline justify-center">
          <span>PAEAT</span>
          <span className="text-lg sm:text-2xl font-bold text-amber-800 ml-1">®</span>
        </h1>

        {/* Project Credits & Institution */}
        <div className="mt-1.5 sm:mt-2 mb-4 sm:mb-5 space-y-1.5 sm:space-y-2 max-w-xs sm:max-w-sm">
          <p className="text-stone-800 text-xs sm:text-sm font-extrabold leading-snug tracking-wide">
            Proyecto desarrollado por la Modalidad Conexión Vocacional
          </p>
          <div className="inline-flex items-center gap-1.5 bg-[#3d081b]/10 text-[#3d081b] px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[#3d081b]/20 text-[10px] sm:text-xs font-bold shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-[#3d081b] shrink-0" />
            <span>Institución Educativa Empresarial</span>
          </div>
        </div>

        {/* ENTRAR Action Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onEnter}
          className="w-full max-w-xs bg-[#dedede] text-[#3d081b] border-2 border-[#3d081b] rounded-xl py-2 sm:py-2.5 px-6 text-base sm:text-lg font-black tracking-wider shadow-lg hover:bg-stone-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 group"
        >
          <span>ENTRAR</span>
          <ChevronRight className="w-5 h-5 stroke-[2.8]" />
        </motion.button>
      </motion.div>

      {/* Footer copyright */}
      <p className="text-stone-400 text-[10px] sm:text-[11px] font-semibold mt-2.5 sm:mt-3 relative z-10">
        PAEAT © 2026 · Programa de Alimentación Escolar
      </p>
    </div>
  );
};
