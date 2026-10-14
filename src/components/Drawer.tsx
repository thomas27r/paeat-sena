import React from 'react';
import { Award, Users, LogOut, X, MessageSquarePlus, Shield, ChevronRight, Truck, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playTapSound, playDeleteSound, useAudioMuted } from '../utils/audio';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (target: 'contacts' | 'delivery_students' | 'pqr_form' | 'logout') => void;
  currentRepartidorName?: string;
  currentRepartidorDoc?: string;
  userRole?: 'admin' | 'repartidor' | 'guest';
  onToast?: (message: string, type?: 'info' | 'success') => void;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentRepartidorName = 'Repartidor PAEAT',
  currentRepartidorDoc,
  userRole = 'repartidor',
  onToast,
}) => {
  const [isMuted, , toggleMute] = useAudioMuted();

  const handleToggleSound = () => {
    const nextMuted = toggleMute();
    if (onToast) {
      onToast(
        nextMuted ? 'Sonidos silenciados para repartidor' : 'Sonidos activados para repartidor',
        nextMuted ? 'info' : 'success'
      );
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="relative w-64 sm:w-72 max-w-[85vw] bg-[#20030c] text-white border-r border-stone-800 p-3.5 flex flex-col justify-between shadow-2xl z-10"
          >
            <div>
              {/* Header Profile Info */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/50 text-amber-300 font-black flex items-center justify-center text-xs shadow-xs shrink-0">
                    <Truck className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-black text-xs sm:text-sm text-white block truncate leading-tight">
                      {currentRepartidorName}
                    </span>
                    {currentRepartidorDoc && (
                      <span className="text-stone-400 text-[10px] font-medium block truncate">
                        Doc: {currentRepartidorDoc}
                      </span>
                    )}
                    <span className="text-amber-400 text-[10px] font-bold flex items-center gap-1 mt-0.5">
                      <Shield className="w-2.5 h-2.5" />
                      <span>{userRole === 'admin' ? 'Administrador' : 'Repartidor'}</span>
                    </span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    playTapSound();
                    onClose();
                  }}
                  className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800/80 rounded-lg transition cursor-pointer"
                  aria-label="Cerrar menú"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </motion.button>
              </div>

              {/* Navigation Menu Links */}
              <div className="space-y-1">
                <span className="text-stone-400 text-[10px] font-black uppercase tracking-wider px-2 mb-1 block">
                  Navegación
                </span>

                {/* Estudiantes */}
                <button
                  onClick={() => {
                    playTapSound();
                    onNavigate('delivery_students');
                    onClose();
                  }}
                  className="flex items-center justify-between w-full py-2 px-2.5 rounded-xl bg-[#2e0513] hover:bg-amber-400 hover:text-stone-950 text-stone-200 font-bold text-xs transition-all cursor-pointer border border-stone-800 hover:border-amber-300 group shadow-xs mb-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400 group-hover:text-stone-950 transition-colors" />
                    <span>Lista de Estudiantes</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-950 transition-colors" />
                </button>

                {/* Enviar PQR direct link */}
                <button
                  onClick={() => {
                    playTapSound();
                    onNavigate('pqr_form');
                    onClose();
                  }}
                  className="flex items-center justify-between w-full py-2 px-2.5 rounded-xl bg-[#2e0513] hover:bg-amber-400 hover:text-stone-950 text-stone-200 font-bold text-xs transition-all cursor-pointer border border-stone-800 hover:border-amber-300 group shadow-xs mb-1.5"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquarePlus className="w-4 h-4 text-amber-400 group-hover:text-stone-950 transition-colors" />
                    <span>Reportar Novedad PQR</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-950 transition-colors" />
                </button>

                {/* Contactos y Créditos */}
                <button
                  onClick={() => {
                    playTapSound();
                    onNavigate('contacts');
                    onClose();
                  }}
                  className="flex items-center justify-between w-full py-2 px-2.5 rounded-xl bg-[#2e0513] hover:bg-amber-400 hover:text-stone-950 text-stone-200 font-bold text-xs transition-all cursor-pointer border border-stone-800 hover:border-amber-300 group shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400 group-hover:text-stone-950 transition-colors" />
                    <span>Contactos y Créditos</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-950 transition-colors" />
                </button>
              </div>

              {/* Ajustes de Sonido para el Repartidor */}
              <div className="mt-3.5 pt-2.5 border-t border-stone-800/80">
                <span className="text-stone-400 text-[10px] font-black uppercase tracking-wider px-2 mb-1.5 block">
                  Ajustes de Reparto
                </span>

                <div className="py-2.5 px-3 rounded-xl bg-[#2e0513] border border-stone-800 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        isMuted
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 stroke-[2.2]" />
                      ) : (
                        <Volume2 className="w-4 h-4 stroke-[2.2]" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-200 block leading-tight">
                        {isMuted ? 'Sonidos Silenciados' : 'Sonidos Activados'}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        {isMuted ? 'Modo silencioso activo' : 'Campana en cada entrega'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleSound}
                    role="switch"
                    aria-checked={!isMuted}
                    aria-label="Silenciar o activar sonidos de la aplicación"
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      isMuted ? 'bg-stone-700' : 'bg-emerald-500'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isMuted ? 'translate-x-0' : 'translate-x-5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Logout Footer Section */}
            <div className="pt-3 border-t border-stone-800">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  playDeleteSound();
                  onNavigate('logout');
                  onClose();
                }}
                className="flex items-center justify-between w-full py-2 px-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-600 text-rose-200 hover:text-white font-black text-xs transition-all cursor-pointer border border-rose-800/80 hover:border-rose-500 shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4 stroke-[2.2]" />
                  <span>Cerrar Sesión</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
              </motion.button>

              <div className="text-center text-[10px] text-stone-400 font-semibold mt-2.5 space-y-0.5">
                <div>PAEAT © 2026 · I.E. Empresarial</div>
                <div className="text-[9px] text-amber-400/80">
                  Thomas Marin R. & Joel Mendoza B.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
