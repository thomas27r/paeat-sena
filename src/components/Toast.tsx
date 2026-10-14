import React, { useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-14 right-3 z-50 flex flex-col gap-1.5 max-w-[270px] w-full pointer-events-none px-1">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const timer = setTimeout(() => {
      dismissRef.current(toast.id);
    }, 850);

    return () => clearTimeout(timer);
  }, [toast.id]);

  const bgColors = {
    success: 'bg-emerald-950/95 border-emerald-500/80 text-emerald-100 shadow-emerald-950/50',
    error: 'bg-red-950/95 border-red-500/80 text-red-100 shadow-red-950/50',
    info: 'bg-stone-900/95 border-amber-500/80 text-stone-100 shadow-black/50',
  };

  const progressColors = {
    success: 'bg-emerald-400',
    error: 'bg-red-400',
    info: 'bg-amber-400',
  };

  const icons = {
    success: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />,
    info: <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.88, transition: { duration: 0.12 } }}
      transition={{ duration: 0.15 }}
      className={`pointer-events-auto relative overflow-hidden flex items-center justify-between px-2.5 py-1.5 rounded-xl border shadow-lg backdrop-blur-md text-xs font-bold ${bgColors[toast.type]}`}
    >
      <div className="flex items-center gap-2 min-w-0 pr-1">
        {icons[toast.type]}
        <span className="leading-tight text-[11px] truncate">{toast.text}</span>
      </div>
      <button
        onClick={() => dismissRef.current(toast.id)}
        className="p-0.5 hover:bg-white/10 rounded-md text-stone-300 hover:text-white transition cursor-pointer shrink-0"
        aria-label="Cerrar notificación"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Countdown progress bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 0.85, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-0.5 ${progressColors[toast.type]} opacity-70`}
      />
    </motion.div>
  );
};

