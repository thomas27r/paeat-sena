import React, { useState } from 'react';
import { Header } from '../components/Header';
import { PQRMessage } from '../types';
import {
  Inbox,
  CheckCircle2,
  Clock,
  Trash2,
  Search,
  User,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Modal } from '../components/Modal';

interface AdminPqrInboxViewProps {
  pqrs: PQRMessage[];
  onBack: () => void;
  onToggleStatus: (pqrId: string) => void;
  onDeletePqr: (pqrId: string) => void;
  onOpenSettings?: () => void;
}

export const AdminPqrInboxView: React.FC<AdminPqrInboxViewProps> = ({
  pqrs,
  onBack,
  onToggleStatus,
  onDeletePqr,
  onOpenSettings,
}) => {
  const [filter, setFilter] = useState<'todos' | 'pendientes' | 'leidos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [pqrToDelete, setPqrToDelete] = useState<PQRMessage | null>(null);

  const formatPqrDate = (dateVal: string | undefined) => {
    if (!dateVal) return 'Sin fecha';
    const parsed = new Date(dateVal);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleString('es-CO', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    }
    return String(dateVal);
  };

  const cleanMessage = (text: string) => {
    return text
      .replace(/\[PRIORIDAD:[^\]]+\]/gi, '')
      .replace(/\[Categoría:[^\]]+\]/gi, '')
      .replace(/\[Grado:[^\]]+\]/gi, '')
      .replace(/\[Raciones Afectadas:[^\]]+\]/gi, '')
      .replace(/\[Ubicación:[^\]]+\]/gi, '')
      .replace(/\[URGENTE[^\]]*\]/gi, '')
      .trim();
  };

  const filteredPqrs = pqrs.filter((p) => {
    const matchesFilter =
      filter === 'todos'
        ? true
        : filter === 'pendientes'
        ? p.status === 'enviado'
        : p.status === 'leido';

    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      (p.senderName && p.senderName.toLowerCase().includes(q)) ||
      p.message.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  const pendientesCount = pqrs.filter((p) => p.status === 'enviado').length;
  const leidosCount = pqrs.filter((p) => p.status === 'leido').length;

  const handleConfirmDelete = () => {
    if (pqrToDelete) {
      onDeletePqr(pqrToDelete.id);
      setPqrToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#3d081b] flex flex-col pb-24 sm:pb-16">
      <Header showBack onBack={onBack} showSettings onSettings={onOpenSettings} />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!pqrToDelete}
        title="¿Archivar PQR?"
        description="El mensaje se moverá a la papelera y podrá restaurarse en cualquier momento."
        confirmText="Archivar"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onClose={() => setPqrToDelete(null)}
      />

      <main className="flex-1 p-2 sm:p-3 max-w-4xl mx-auto w-full animate-in fade-in duration-200">
        {/* Header & Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
              <Inbox className="w-3.5 h-3.5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-white leading-tight">
                Buzón de PQRs ({pqrs.length})
              </h1>
              <p className="text-stone-300 text-[11px] font-medium">
                Peticiones, quejas y novedades reportadas
              </p>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-[#2e0513] p-1.5 sm:p-2 rounded-lg border border-stone-700/80 shadow-md mb-2 space-y-1.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por remitente o contenido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#dedede] text-stone-900 text-xs placeholder-stone-500 rounded-md pl-8 pr-3 py-1.5 font-bold outline-hidden focus:ring-1 focus:ring-amber-400 shadow-inner"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#1e030c] p-0.5 rounded-md border border-stone-800 self-start sm:self-auto shrink-0">
              <button
                onClick={() => setFilter('todos')}
                className={`px-2 py-0.5 rounded text-[11px] font-black transition cursor-pointer ${
                  filter === 'todos'
                    ? 'bg-[#dedede] text-[#3d081b] shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Todos ({pqrs.length})
              </button>
              <button
                onClick={() => setFilter('pendientes')}
                className={`px-2 py-0.5 rounded text-[11px] font-black transition flex items-center gap-1 cursor-pointer ${
                  filter === 'pendientes'
                    ? 'bg-amber-400 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Clock className="w-2.5 h-2.5" />
                Pendientes ({pendientesCount})
              </button>
              <button
                onClick={() => setFilter('leidos')}
                className={`px-2 py-0.5 rounded text-[11px] font-black transition flex items-center gap-1 cursor-pointer ${
                  filter === 'leidos'
                    ? 'bg-emerald-500 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-2.5 h-2.5" />
                Atendidos ({leidosCount})
              </button>
            </div>
          </div>
        </div>

        {/* PQR List */}
        <div className="space-y-1.5">
          {filteredPqrs.length === 0 ? (
            <div className="bg-[#2e0513] border border-stone-800 rounded-lg p-6 text-center text-stone-400 text-xs font-bold">
              No hay mensajes para los filtros seleccionados.
            </div>
          ) : (
            filteredPqrs.map((pqr) => {
              const isPending = pqr.status === 'enviado';
              return (
                <motion.div
                  key={pqr.id}
                  whileHover={{ backgroundColor: '#340616' }}
                  className="bg-[#2a0411] border border-stone-800 rounded-lg p-2.5 transition-colors space-y-1.5"
                >
                  {/* Top: Sender & Date */}
                  <div className="flex items-center justify-between gap-2 border-b border-stone-800/60 pb-1 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-white truncate">
                        {pqr.senderName || 'Remitente'}
                      </span>
                      {pqr.senderRole && (
                        <span className="text-[10px] bg-stone-800 text-amber-300 px-1.5 py-0.2 rounded font-semibold border border-stone-700 shrink-0">
                          {pqr.senderRole}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-stone-400 font-mono shrink-0">
                      {formatPqrDate(pqr.createdAt)}
                    </span>
                  </div>

                  {/* Message body */}
                  <p className="text-stone-200 text-xs whitespace-pre-wrap leading-relaxed">
                    {cleanMessage(pqr.message)}
                  </p>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-stone-800/60 text-xs">
                    <button
                      onClick={() => onToggleStatus(pqr.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-black transition cursor-pointer flex items-center gap-1 border ${
                        isPending
                          ? 'bg-amber-400 text-stone-950 border-amber-300 hover:bg-amber-300'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-500/50 hover:border-amber-400'
                      }`}
                    >
                      {isPending ? (
                        <>
                          <Clock className="w-2.5 h-2.5" />
                          <span>Marcar como Atendido</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Atendido (clic para reabrir)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setPqrToDelete(pqr)}
                      className="p-1 rounded text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                      title="Archivar mensaje"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>

    </div>
  );
};
