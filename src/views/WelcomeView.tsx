import React from 'react';
import { ChevronRight, Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import { PaeatLogo } from '../components/PaeatLogo';
import { InstitutionLogo } from '../components/InstitutionLogo';

interface WelcomeViewProps {
  onEnter: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#3d081b] via-[#2f0615] to-[#1e030c] flex flex-col items-center justify-center p-3 sm:p-4 py-8 relative overflow-y-auto">
      {/* Subtle Background Glow */}
      <div className="absolute w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -top-10 -left-10" />
      <div className="absolute w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -bottom-10 -right-10" />

      {/* Main Framed Welcome Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#dedede] border-3 border-[#3d081b] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center shadow-2xl text-center relative z-10"
      >
        {/* Heraldic Brand Emblem Logo */}
        <div className="mb-2">
          <PaeatLogo size="lg" lightBg={true} />
        </div>

        {/* Project Credits & Institution Logo Badge */}
        <div className="mt-3 mb-5 space-y-2.5 max-w-sm flex flex-col items-center">
          <p className="text-stone-800 text-xs sm:text-sm font-extrabold leading-snug tracking-wide">
            Proyecto desarrollado por la Modalidad Conexión Vocacional
          </p>
          <div className="inline-flex items-center gap-1.5 bg-[#3d081b]/10 text-[#3d081b] px-3.5 py-1.5 rounded-2xl border border-[#3d081b]/20 text-[11px] sm:text-xs font-bold shadow-2xs">
            <InstitutionLogo size="sm" showText={false} />
            <span>Institución Educativa Empresarial</span>
          </div>
        </div>

        {/* ENTRAR Action Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onEnter}
          className="w-full max-w-xs bg-[#dedede] text-[#3d081b] border-2 border-[#3d081b] rounded-xl py-2.5 px-6 text-lg font-black tracking-wider shadow-lg hover:bg-stone-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 group"
        >
          <span>ENTRAR</span>
          <ChevronRight className="w-5 h-5 stroke-[2.8]" />
        </motion.button>
      </motion.div>

      {/* Footer copyright */}
      <p className="text-stone-400 text-[11px] font-semibold mt-3 relative z-10">
        PAEAT © 2026 · Programa de Alimentación Escolar
      </p>
    </div>
  );
};
