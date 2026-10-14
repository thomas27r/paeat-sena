import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Send, MessageSquare, User, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { playSuccessSound } from '../utils/audio';
import { ActiveUserSession } from './LoginView';

interface PqrFormViewProps {
  onBack: () => void;
  onSend: (
    message: string,
    titularData?: { name: string; document: string; role: string }
  ) => void;
  activeUser?: ActiveUserSession | null;
  onOpenSettings?: () => void;
}

const PQR_TYPES = ['Petición', 'Queja', 'Reclamo', 'Sugerencia'];

export const PqrFormView: React.FC<PqrFormViewProps> = ({
  onBack,
  onSend,
  activeUser,
}) => {
  const titularName = activeUser?.fullName || 'Usuario';
  const titularDoc = activeUser?.documentNumber || '';
  const titularRole = activeUser?.role === 'admin' ? 'Administrador' : 'Repartidor';

  const [tipo, setTipo] = useState<string>('Petición');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) {
      setError('Por favor escriba su mensaje.');
      return;
    }

    setError('');
    const fullText = asunto.trim()
      ? `[${tipo}] Asunto: ${asunto.trim()}\n\n${mensaje.trim()}`
      : `[${tipo}]\n\n${mensaje.trim()}`;

    playSuccessSound();
    onSend(fullText, {
      name: titularName,
      document: titularDoc,
      role: titularRole,
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#3d081b] via-[#2f0615] to-[#1e030c] flex flex-col pb-16">
      <Header showBack onBack={onBack} />

      <main className="flex-1 flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 py-6 max-w-lg mx-auto w-full overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full bg-[#2e0513] rounded-2xl border border-stone-700/80 shadow-2xl p-4 sm:p-5"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 pb-2.5 mb-3 border-b border-stone-800">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-xs shrink-0">
              <MessageSquare className="w-4 h-4 stroke-[2.3]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black text-white tracking-wide">
                Enviar PQR / Mensaje
              </h1>
              <p className="text-stone-300 text-[11px] font-medium flex items-center gap-1">
                <User className="w-3 h-3 text-amber-400" />
                <span>De: {titularName} ({titularRole})</span>
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-3 bg-rose-950/90 border border-rose-500/80 text-rose-200 text-xs font-bold rounded-lg p-2 flex items-center gap-1.5 shadow-xs">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-3">
            {/* Tipo de PQR */}
            <div>
              <label className="text-stone-300 text-[10px] font-black uppercase tracking-wider mb-1 block">
                Tipo
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {PQR_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-black transition cursor-pointer text-center border ${
                      tipo === t
                        ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-xs'
                        : 'bg-[#1e030c] text-stone-300 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Asunto */}
            <div>
              <label className="text-stone-300 text-[10px] font-black uppercase tracking-wider mb-1 block">
                Asunto (Opcional)
              </label>
              <input
                type="text"
                placeholder="Breve resumen del mensaje..."
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                className="w-full bg-[#dedede] text-stone-900 placeholder-stone-500 rounded-lg px-3 py-1.5 text-xs font-bold outline-hidden focus:ring-2 focus:ring-amber-400 shadow-inner"
              />
            </div>

            {/* Mensaje */}
            <div>
              <label className="text-stone-300 text-[10px] font-black uppercase tracking-wider mb-1 block">
                Mensaje <span className="text-amber-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Escriba aquí los detalles de su solicitud, queja o reporte..."
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                className="w-full bg-[#dedede] text-stone-900 placeholder-stone-500 rounded-lg p-2.5 text-xs font-medium outline-hidden focus:ring-2 focus:ring-amber-400 shadow-inner resize-none"
              />
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-lg py-2 px-4 text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md cursor-pointer border border-amber-300 transition-all mt-2"
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Enviar Mensaje</span>
            </motion.button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};
