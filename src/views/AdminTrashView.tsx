import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Student, Repartidor, PQRMessage } from '../types';
import {
  Archive,
  RotateCcw,
  Users,
  Truck,
  MessageSquare,
  ShieldAlert,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminTrashViewProps {
  hiddenStudents: Student[];
  hiddenRepartidores: Repartidor[];
  hiddenPqrs: PQRMessage[];
  onRestoreStudent: (id: string) => void;
  onRestoreRepartidor: (id: string) => void;
  onRestorePqr: (id: string) => void;
  onBack: () => void;
  onGoHome: () => void;
  onOpenSettings: () => void;
}

export const AdminTrashView: React.FC<AdminTrashViewProps> = ({
  hiddenStudents,
  hiddenRepartidores,
  hiddenPqrs,
  onRestoreStudent,
  onRestoreRepartidor,
  onRestorePqr,
  onBack,
  onGoHome,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'repartidores' | 'pqrs'>('students');
  const [searchQuery, setSearchQuery] = useState('');

  const totalHiddenCount =
    hiddenStudents.length + hiddenRepartidores.length + hiddenPqrs.length;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Fecha no registrada';
    try {
      const dt = new Date(isoString);
      return dt.toLocaleString('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  };

  const filteredStudents = hiddenStudents.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.documentNumber.includes(q) ||
      s.grade.includes(q)
    );
  });

  const filteredRepartidores = hiddenRepartidores.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.fullName.toLowerCase().includes(q) ||
      r.documentNumber.includes(q)
    );
  });

  const filteredPqrs = hiddenPqrs.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.senderName || '').toLowerCase().includes(q) ||
      (p.message || '').toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#3d081b] text-stone-100 pb-24 sm:pb-16">
      <Header
        title="Registros Ocultos / Papelera"
        showBack={true}
        onBack={onBack}
        showHome={true}
        onHome={onGoHome}
        showSettings={true}
        onSettings={onOpenSettings}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Soft-delete Principle Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-stone-900/90 border border-amber-500/40 rounded-3xl p-5 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
            <Archive className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                Principio de Soft Delete
              </span>
              <span className="text-xs text-stone-400">Trazabilidad Total</span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">
              Los datos nunca se eliminan físicamente de la base de datos
            </h2>
            <p className="text-xs text-stone-300 mt-0.5">
              Permanecen protegidos en Firestore con bandera de archivado para auditorías y control escolar. Puedes restaurar cualquier registro a su estado activo en cualquier momento.
            </p>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-stone-900/80 rounded-2xl border border-stone-800 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'students'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Estudiantes ({hiddenStudents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('repartidores')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'repartidores'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Repartidores ({hiddenRepartidores.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pqrs')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'pqrs'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>PQRs ({hiddenPqrs.length})</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en registros ocultos por nombre, documento..."
            className="w-full pl-11 pr-4 py-3 bg-stone-900/80 border border-stone-800 focus:border-amber-500/70 rounded-2xl text-xs text-white placeholder-stone-500 outline-none transition"
          />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* TAB 1: Students */}
          {activeTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12 bg-stone-900/60 border border-stone-800/60 rounded-3xl p-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
                  <p className="text-sm font-bold text-white">No hay estudiantes ocultos</p>
                  <p className="text-xs text-stone-400 mt-1">
                    Todos los estudiantes registrados están activos en el sistema.
                  </p>
                </div>
              ) : (
                filteredStudents.map((st) => (
                  <div
                    key={st.id}
                    className="bg-stone-900/80 border border-stone-800 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-md"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center font-bold text-xs text-stone-300">
                        {st.grade}°
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{st.fullName}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                            Oculto
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-400 mt-0.5">
                          <span>Doc: {st.documentNumber}</span>
                          <span>Grado: {st.grade}°</span>
                          <span className="text-stone-500">
                            Archivado: {formatDate(st.deletedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onRestoreStudent(st.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar a Activos</span>
                    </button>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* TAB 2: Repartidores */}
          {activeTab === 'repartidores' && (
            <motion.div
              key="repartidores"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {filteredRepartidores.length === 0 ? (
                <div className="text-center py-12 bg-stone-900/60 border border-stone-800/60 rounded-3xl p-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
                  <p className="text-sm font-bold text-white">No hay repartidores ocultos</p>
                  <p className="text-xs text-stone-400 mt-1">
                    Todos los repartidores registrados están activos.
                  </p>
                </div>
              ) : (
                filteredRepartidores.map((rep) => (
                  <div
                    key={rep.id}
                    className="bg-stone-900/80 border border-stone-800 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-md"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{rep.fullName}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                            Inactivo / Oculto
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-400 mt-0.5">
                          <span>Doc: {rep.documentNumber}</span>
                          <span className="text-stone-500">
                            Archivado: {formatDate(rep.deletedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onRestoreRepartidor(rep.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reactivar y Restaurar</span>
                    </button>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* TAB 3: PQRs */}
          {activeTab === 'pqrs' && (
            <motion.div
              key="pqrs"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {filteredPqrs.length === 0 ? (
                <div className="text-center py-12 bg-stone-900/60 border border-stone-800/60 rounded-3xl p-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
                  <p className="text-sm font-bold text-white">No hay PQRs ocultos ni archivados</p>
                  <p className="text-xs text-stone-400 mt-1">
                    Todos los mensajes de soporte están en la bandeja principal.
                  </p>
                </div>
              ) : (
                filteredPqrs.map((pqr) => (
                  <div
                    key={pqr.id}
                    className="bg-stone-900/80 border border-stone-800 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition shadow-md"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {pqr.senderName || 'Remitente'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700 font-semibold">
                          {pqr.senderRole || 'Usuario'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                          Archivado
                        </span>
                      </div>
                      <p className="text-xs text-stone-300 leading-relaxed italic bg-stone-950/40 p-2.5 rounded-xl border border-stone-800/60">
                        "{pqr.message}"
                      </p>
                      <div className="text-[11px] text-stone-500 flex gap-3">
                        <span>Creado: {formatDate(pqr.createdAt)}</span>
                        <span>Archivado: {formatDate(pqr.deletedAt)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onRestorePqr(pqr.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 shrink-0 self-start"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar a Bandeja</span>
                    </button>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
