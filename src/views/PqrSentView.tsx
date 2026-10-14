import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface PqrSentViewProps {
  onBack: () => void;
}

export const PqrSentView: React.FC<PqrSentViewProps> = ({ onBack }) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onBack]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#3d081b] via-[#2f0615] to-[#1e030c] flex flex-col pb-12">
      <Header rightAction="back" onRightAction={onBack} onLogoClick={onBack} />

      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 py-8 max-w-sm mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full bg-[#dedede] rounded-2xl p-4 sm:p-5 text-center shadow-xl border border-[#3d081b] flex flex-col items-center gap-3 relative overflow-hidden"
        >
          {/* Animated visual badge */}
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center border-2 border-emerald-500 shadow-sm">
            <CheckCircle2 className="w-7 h-7 text-emerald-700 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-[#3d081b] text-xl sm:text-2xl font-black tracking-tight">
              ¡Mensaje Enviado!
            </h2>
            <p className="text-stone-700 font-bold text-xs leading-relaxed px-1">
              Su solicitud PQR ha sido registrada en el sistema PAEAT. El equipo revisará su reporte a la brevedad.
            </p>
          </div>

          {/* Auto-redirect countdown bar */}
          <div className="w-full bg-stone-300 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-emerald-600 h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(countdown / 3) * 100}%` }}
            />
          </div>

          <p className="text-stone-600 text-[11px] font-bold">
            Redirigiendo en <strong className="text-emerald-800 font-black">{countdown}s</strong>...
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={onBack}
            className="w-full mt-1 py-2 px-4 rounded-xl bg-[#3d081b] hover:bg-[#520b24] text-amber-300 font-black text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Volver ahora</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </motion.button>
        </motion.div>
      </main>
    </div>
  );
};


