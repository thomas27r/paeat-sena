import React from 'react';
import { Header } from '../components/Header';
import { ShieldCheck, Truck, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { INSTITUTIONAL_LOGO_URL } from '../constants/branding';

interface RoleSelectViewProps {
  onBack: () => void;
  onSelectRole: (role: 'admin' | 'repartidor') => void;
}

export const RoleSelectView: React.FC<RoleSelectViewProps> = ({
  onBack,
  onSelectRole,
}) => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#3d081b] via-[#2f0615] to-[#1e030c] flex flex-col pb-12">
      <Header showBack onBack={onBack} />

      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 py-8 max-w-lg mx-auto w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full space-y-4"
        >
          {/* Institutional Badge */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-14 h-14 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg border-2 border-[#3d081b] ring-2 ring-amber-400/40">
              <img
                src={INSTITUTIONAL_LOGO_URL}
                alt="Logo Institución Educativa Empresarial"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-white text-2xl sm:text-3xl font-black tracking-wide">
              Seleccione su Rol
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm font-medium">
              Elija el perfil de acceso correspondiente para ingresar al sistema
            </p>
          </div>

          <div className="w-full flex flex-col gap-3 pt-1">
            {/* Admin Role Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectRole('admin')}
              className="w-full bg-[#dedede] hover:bg-stone-200 text-[#3d081b] rounded-xl p-4 shadow-lg transition-all cursor-pointer flex items-center justify-between border-2 border-[#3d081b] group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3d081b] text-amber-300 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-wide uppercase">
                    Rectoría
                  </h3>
                  <p className="text-stone-700 text-xs font-semibold mt-0.5">
                    Control operativo, supervisión institucional, estadísticas y reportes
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 stroke-[2.5] text-[#3d081b] group-hover:translate-x-1 transition-transform shrink-0" />
            </motion.button>

            {/* Repartidor Role Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectRole('repartidor')}
              className="w-full bg-[#dedede] hover:bg-stone-200 text-[#3d081b] rounded-xl p-4 shadow-lg transition-all cursor-pointer flex items-center justify-between border-2 border-[#3d081b] group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3d081b] text-amber-300 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Truck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-wide uppercase">
                    Repartidor
                  </h3>
                  <p className="text-stone-700 text-xs font-semibold mt-0.5">
                    Registro de raciones recibidas en sitio por grado y reporte de novedades
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 stroke-[2.5] text-[#3d081b] group-hover:translate-x-1 transition-transform shrink-0" />
            </motion.button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};


