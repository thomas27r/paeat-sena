import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playTapSound, playDeleteSound } from '../utils/audio';

interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = false,
  children,
  onConfirm,
  onClose,
}) => {
  const handleConfirm = () => {
    if (isDanger) {
      playDeleteSound();
    } else {
      playTapSound();
    }
    onConfirm();
    onClose();
  };

  const handleClose = () => {
    playTapSound();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={handleClose}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.25, bounce: 0.2 }}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#24040e] text-white border-2 border-stone-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl z-10 flex flex-col items-center text-center"
          >
            {/* Top accent border */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${
                isDanger ? 'bg-rose-600' : 'bg-amber-400'
              }`}
            />

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>

            {isDanger && (
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/40 shadow-inner">
                <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
              </div>
            )}

            <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-2 text-white">
              {title}
            </h3>

            {description && (
              <p className="text-stone-300 font-medium text-sm sm:text-base mb-5 leading-relaxed">
                {description}
              </p>
            )}

            {children}

            <div className="flex items-center justify-center gap-3 w-full mt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600/80 rounded-xl py-3 px-4 font-bold text-sm sm:text-base active:scale-95 transition cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`flex-1 rounded-xl py-3 px-4 font-black text-sm sm:text-base active:scale-95 transition cursor-pointer shadow-lg ${
                  isDanger
                    ? 'bg-rose-700 hover:bg-rose-600 text-white border border-rose-500/60'
                    : 'bg-amber-400 hover:bg-amber-300 text-stone-950 border border-amber-300'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

