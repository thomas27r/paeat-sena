import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Student, Grade } from '../types';
import { CheckCircle2, Clock, Eye, X, Lock, Search, Filter, RotateCcw, Truck, Shield, Volume2, VolumeX, ShieldAlert, AlertTriangle } from 'lucide-react';
import { matchStudent } from '../utils/search';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveUserSession } from './LoginView';
import { useAudioMuted } from '../utils/audio';

interface DeliveryStudentListViewProps {
  students: Student[];
  activeUser?: ActiveUserSession | null;
  selectedGradeFilter?: Grade | null;
  onOpenMenu: () => void;
  onOpenGradeSelect: () => void;
  onSelectGrade?: (grade: Grade | null) => void;
  onToggleStatus: (studentId: string) => void;
  onClearGradeFilter?: () => void;
  onOpenSettings?: () => void;
}

export const DeliveryStudentListView: React.FC<DeliveryStudentListViewProps> = ({
  students,
  activeUser,
  selectedGradeFilter,
  onOpenMenu,
  onOpenGradeSelect,
  onSelectGrade,
  onToggleStatus,
  onClearGradeFilter,
  onOpenSettings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendientes' | 'recibidos'>('todos');
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [blockedUndoStudent, setBlockedUndoStudent] = useState<Student | null>(null);
  const [blockedCompanionStudent, setBlockedCompanionStudent] = useState<Student | null>(null);
  const [isMuted, , toggleMute] = useAudioMuted();

  const gradeList: Grade[] = ['5', '6', '7', '8', '9', '10', '11'];

  const formatGradeLabel = (g: string) => {
    return `${g}°`;
  };

  /**
   * Evaluates if the current active user is allowed to undo / cancel this delivery.
   * Only the original deliverer (matching document or name) or an Administrator can undo.
   */
  const canUserUndoDelivery = (st: Student): boolean => {
    if (st.status !== 'Recibido') return true;
    if (!activeUser) return true;
    if (activeUser.role === 'admin') return true;

    if (st.deliveredByDoc && activeUser.documentNumber) {
      return st.deliveredByDoc.trim() === activeUser.documentNumber.trim();
    }
    if (st.deliveredByName && activeUser.fullName) {
      return st.deliveredByName.trim().toLowerCase() === activeUser.fullName.trim().toLowerCase();
    }
    return true;
  };

  const filteredStudents = students.filter((st) => {
    const matchesGrade = !selectedGradeFilter || st.grade === selectedGradeFilter;
    const matchesSearch = matchStudent(st, searchTerm);
    const matchesStatus =
      statusFilter === 'todos'
        ? true
        : statusFilter === 'recibidos'
        ? st.status === 'Recibido'
        : st.status !== 'Recibido';

    return matchesGrade && matchesSearch && matchesStatus;
  });

  const totalFiltered = filteredStudents.length;
  const filteredRecibidos = filteredStudents.filter((s) => s.status === 'Recibido').length;
  const filteredPercentage = totalFiltered > 0 ? Math.round((filteredRecibidos / totalFiltered) * 100) : 0;

  const recibidosCount = students.filter((s) => s.status === 'Recibido').length;
  const pendientesCount = students.length - recibidosCount;

  const handleGradeChipClick = (grade: Grade | null) => {
    if (onSelectGrade) {
      onSelectGrade(grade);
    } else if (grade === null && onClearGradeFilter) {
      onClearGradeFilter();
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    if (onClearGradeFilter) onClearGradeFilter();
    if (onSelectGrade) onSelectGrade(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3d081b] via-[#2f0615] to-[#1e030c] flex flex-col pb-24 sm:pb-16">
      <Header
        showMenu
        onMenu={onOpenMenu}
      />

      <main className="flex-1 p-2 sm:p-3 max-w-5xl mx-auto w-full">
        {/* Active Session User Banner */}
        {activeUser && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#2e0513] p-2 rounded-lg border border-amber-400/30 shadow-md mb-2 flex items-center justify-between gap-2.5"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-stone-950 font-black flex items-center justify-center text-xs shadow-xs shrink-0">
                <Truck className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/30 flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    <span>{activeUser.role === 'admin' ? 'Admin' : 'Repartidor'}</span>
                  </span>
                  {activeUser.role === 'repartidor' && activeUser.shiftStart && activeUser.shiftEnd && (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-600/60 flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      <span>Turno: {activeUser.shiftStart} - {activeUser.shiftEnd}</span>
                    </span>
                  )}
                  {activeUser.assignedGrades && activeUser.assignedGrades.length > 0 && (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-stone-800 text-amber-300 px-1.5 py-0.2 rounded border border-stone-700">
                      Grados: {activeUser.assignedGrades.map((g) => `${g}°`).join(', ')}
                    </span>
                  )}
                </div>
                <h3 className="text-white font-black text-xs sm:text-sm truncate leading-tight mt-0.5">
                  {activeUser.fullName}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {activeUser.assignedGrades && activeUser.assignedGrades.length > 0 && (
                <div className="flex items-center gap-1">
                  {activeUser.assignedGrades.map((g) => (
                    <button
                      key={g}
                      onClick={() => onSelectGrade && onSelectGrade(g as Grade)}
                      className={`px-1.5 py-0.5 rounded font-black text-[11px] transition cursor-pointer ${
                        selectedGradeFilter === g
                          ? 'bg-amber-400 text-stone-950 shadow-xs ring-1 ring-amber-300'
                          : 'bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700'
                      }`}
                    >
                      {g}°
                    </button>
                  ))}
                </div>
              )}

              {/* Sound Quick Toggle */}
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? 'Sonidos silenciados (Clic para activar)' : 'Sonidos activos (Clic para silenciar)'}
                className={`px-2 py-1 rounded-md border flex items-center gap-1 transition text-xs font-bold cursor-pointer shadow-xs ${
                  isMuted
                    ? 'bg-rose-950/80 border-rose-700/80 text-rose-300 hover:bg-rose-900'
                    : 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900'
                }`}
              >
                {isMuted ? (
                  <VolumeX className="w-3 h-3 stroke-[2.2]" />
                ) : (
                  <Volume2 className="w-3 h-3 stroke-[2.2]" />
                )}
                <span className="hidden sm:inline text-[10px] font-black">
                  {isMuted ? 'Mute' : 'Audio'}
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Compact Student Search & Filter Bar */}
        <div className="bg-[#2e0513] p-2 rounded-lg border border-stone-700/70 shadow-md mb-2 space-y-1.5">
          {/* Row 1: Search Box & Reset Button */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nombre o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#dedede] text-stone-900 text-xs placeholder-stone-500 rounded-md pl-8 pr-7 py-1.5 font-bold outline-hidden focus:ring-1 focus:ring-amber-400 shadow-inner transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-950 p-0.5 rounded-full bg-stone-300 hover:bg-stone-400 transition cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {(searchTerm || selectedGradeFilter || statusFilter !== 'todos') && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResetFilters}
                className="flex items-center justify-center gap-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-black px-2 py-1.5 rounded-md border border-stone-600 transition cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Limpiar</span>
              </motion.button>
            )}
          </div>

          {/* Row 2: Status Filter Tabs & Grade Selector Chips */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-stone-800/80">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#1e030c] p-0.5 rounded-md border border-stone-800">
              <button
                onClick={() => setStatusFilter('todos')}
                className={`px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer ${
                  statusFilter === 'todos'
                    ? 'bg-[#dedede] text-[#3d081b] shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Todos ({students.length})
              </button>
              <button
                onClick={() => setStatusFilter('pendientes')}
                className={`px-2 py-0.5 rounded text-[10px] font-black transition flex items-center gap-1 cursor-pointer ${
                  statusFilter === 'pendientes'
                    ? 'bg-amber-400 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Clock className="w-2.5 h-2.5" />
                Pendientes ({pendientesCount})
              </button>
              <button
                onClick={() => setStatusFilter('recibidos')}
                className={`px-2 py-0.5 rounded text-[10px] font-black transition flex items-center gap-1 cursor-pointer ${
                  statusFilter === 'recibidos'
                    ? 'bg-emerald-500 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-2.5 h-2.5" />
                Recibidos ({recibidosCount})
              </button>
            </div>

            {/* Quick Grade Filter Chips */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-stone-400 text-[10px] font-black mr-0.5 flex items-center gap-0.5">
                <Filter className="w-2.5 h-2.5 text-amber-400" /> Grado:
              </span>
              <button
                onClick={() => handleGradeChipClick(null)}
                className={`px-1.5 py-0.2 rounded text-[10px] font-black transition cursor-pointer ${
                  !selectedGradeFilter
                    ? 'bg-amber-400 text-stone-950 shadow-xs'
                    : 'bg-[#3d081b] text-stone-300 hover:text-white border border-stone-700'
                }`}
              >
                Todos
              </button>
              {gradeList.map((g) => (
                <button
                  key={g}
                  onClick={() => handleGradeChipClick(g)}
                  className={`px-1.5 py-0.2 rounded text-[10px] font-black transition cursor-pointer ${
                    selectedGradeFilter === g
                      ? 'bg-amber-400 text-stone-950 shadow-xs'
                      : 'bg-[#3d081b] text-stone-300 hover:text-white border border-stone-700'
                  }`}
                >
                  {formatGradeLabel(g)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-[#2e0513] p-2 rounded-lg border border-stone-700/60 shadow-sm mb-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-300 mb-0.5">
            <span>Progreso de Entregas:</span>
            <span className="text-amber-300 font-black text-xs">
              {filteredRecibidos} / {totalFiltered} ({filteredPercentage}%)
            </span>
          </div>
          <div className="w-full bg-[#1e030c] h-1.5 rounded-full overflow-hidden border border-stone-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${filteredPercentage}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
            />
          </div>
        </div>

        {/* Title & Counter */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <h2 className="text-white text-xs sm:text-sm font-black tracking-wide">
            Estudiantes Asignados
          </h2>

          <div className="flex items-center gap-1 text-stone-300 text-[11px] font-bold bg-[#2e0513] px-2 py-0.5 rounded-md border border-stone-800">
            <span>Mostrando:</span>
            <span className="text-amber-300 font-black">
              {totalFiltered}
            </span>
          </div>
        </div>

        {/* Responsive Student Delivery List */}
        <div className="w-full overflow-hidden bg-[#2e0513] rounded-lg border border-stone-700/80 shadow-md">
          {/* Desktop/Tablet Header (Hidden on Mobile) */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 bg-[#1e030c] px-2.5 py-1.5 border-b border-stone-800 text-stone-300 font-black text-[10px] uppercase tracking-wider items-center">
            <div className="col-span-5">Nombre Completo</div>
            <div className="col-span-3 text-center">Documento</div>
            <div className="col-span-1 text-center">Grado</div>
            <div className="col-span-2 text-center">Estado</div>
            <div className="col-span-1 text-center">Ver</div>
          </div>

          {/* List Rows */}
          <div className="divide-y divide-stone-800/80">
            {filteredStudents.length === 0 ? (
              <div className="text-stone-300 text-center py-5 bg-[#2e0513] font-bold text-xs">
                No se encontraron estudiantes para esta selección.
              </div>
            ) : (
              filteredStudents.map((st) => {
                const canUndo = canUserUndoDelivery(st);

                return (
                  <motion.div
                    key={st.id}
                    whileHover={{ backgroundColor: '#3b0619' }}
                    className="px-2.5 py-2 sm:py-1.5 bg-[#2a0411] transition-colors"
                  >
                    {/* Desktop / Tablet Row (sm and up) */}
                    <div className="hidden sm:grid sm:grid-cols-12 gap-2 items-center">
                      <div className="col-span-5 flex flex-col min-w-0 pr-1">
                        <span className="text-white font-bold text-xs leading-tight truncate hover:text-amber-300 transition-colors">
                          {st.fullName}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {st.status === 'Recibido' && (
                            <span className="text-amber-300 text-[9px] font-bold flex items-center gap-0.5 bg-stone-900/80 px-1 py-0.2 rounded border border-amber-500/30">
                              <Truck className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                              <span className="truncate max-w-[140px]">
                                {st.deliveredByName ? `Entregó: ${st.deliveredByName}` : 'Entregado'}
                              </span>
                            </span>
                          )}
                          {st.status === 'Recibido' && st.deliveryTimestamp && (
                            <span className="text-stone-400 text-[9px] font-mono">
                              {st.deliveryTimestamp}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="col-span-3 text-center">
                        <span className="inline-block bg-[#1a0209] text-stone-200 font-mono font-bold text-[11px] px-1.5 py-0.2 rounded border border-stone-800/90 shadow-inner">
                          {st.documentNumber}
                        </span>
                      </div>

                      <div className="col-span-1 text-center">
                        <span className="inline-block bg-amber-400/15 text-amber-300 border border-amber-400/40 font-black text-[10px] px-1.5 py-0.2 rounded">
                          {formatGradeLabel(st.grade)}
                        </span>
                      </div>

                      {/* Status Action Column */}
                      <div className="col-span-2 flex justify-center">
                        {st.status === 'Recibido' ? (
                          !canUndo ? (
                            <button
                              type="button"
                              onClick={() => setBlockedCompanionStudent(st)}
                              className="w-full max-w-[110px] py-1 px-1.5 rounded-md font-black text-[11px] shadow-xs flex items-center justify-center gap-1 bg-stone-900 text-stone-400 border border-stone-700/80 hover:border-amber-400/70 hover:text-stone-200 cursor-pointer transition"
                              title={`Entrega realizada por ${st.deliveredByName || 'otro repartidor'}. Clic para ver motivo.`}
                            >
                              <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">Bloqueado</span>
                            </button>
                          ) : statusFilter === 'recibidos' ? (
                            <motion.button
                              onClick={() => onToggleStatus(st.id)}
                              whileTap={{ scale: 0.92 }}
                              whileHover={{ scale: 1.02 }}
                              className="w-full max-w-[110px] py-1 px-1.5 rounded-md font-black text-[11px] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1 bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-500/70"
                              title="Haga clic para anular o eliminar esta entrega"
                            >
                              <RotateCcw className="w-3 h-3 text-rose-400 shrink-0" />
                              <span>Anular</span>
                            </motion.button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setBlockedUndoStudent(st)}
                              className="w-full max-w-[110px] py-1 px-1.5 rounded-md font-black text-[11px] shadow-xs flex items-center justify-center gap-1 bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 hover:border-amber-400 cursor-pointer transition"
                              title="Entrega registrada. Para eliminar o anular esta entrega, ve a la pestaña 'Recibidos'."
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>Recibido</span>
                              <Lock className="w-2.5 h-2.5 text-stone-400 ml-0.5 shrink-0" />
                            </button>
                          )
                        ) : (
                          <motion.button
                            onClick={() => onToggleStatus(st.id)}
                            whileTap={{ scale: 0.92 }}
                            whileHover={{ scale: 1.02 }}
                            className="w-full max-w-[110px] py-1 px-1.5 rounded-md font-black text-[11px] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1 bg-amber-400 hover:bg-amber-300 text-stone-950 border border-amber-300"
                            title="Haga clic para marcar entrega"
                          >
                            <Clock className="w-3 h-3 text-stone-950 shrink-0" />
                            <span>Entregar</span>
                          </motion.button>
                        )}
                      </div>

                      {/* Ver Details Button */}
                      <div className="col-span-1 flex items-center justify-center">
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setViewingStudent(st)}
                          className="bg-stone-800 hover:bg-amber-400 hover:text-stone-950 text-stone-200 border border-stone-700 p-1 rounded-md text-[10px] font-bold transition flex items-center justify-center shadow-xs cursor-pointer shrink-0"
                          title="Ver detalles"
                        >
                          <Eye className="w-3 h-3" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Mobile-Optimized Row (< sm screens, smartphones) */}
                    <div className="flex sm:hidden items-center justify-between gap-2 w-full">
                      {/* Left: Student Info */}
                      <div className="flex flex-col min-w-0 flex-1 pr-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-white font-bold text-xs leading-tight truncate">
                            {st.fullName}
                          </span>
                          <span className="bg-amber-400/20 text-amber-300 font-black text-[9px] px-1.5 py-0.2 rounded border border-amber-400/30 shrink-0">
                            {formatGradeLabel(st.grade)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] text-stone-400 font-mono">
                          <span>Doc: {st.documentNumber}</span>
                          {st.status === 'Recibido' && st.deliveryTimestamp && (
                            <span className="text-stone-300">· {st.deliveryTimestamp}</span>
                          )}
                        </div>

                        {st.status === 'Recibido' && (
                          <div className="flex items-center gap-1 mt-0.5 text-[9px] text-amber-300 font-semibold truncate">
                            <Truck className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                            <span className="truncate">
                              {st.deliveredByName ? `Entregó: ${st.deliveredByName}` : 'Entregado'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions (100% visible on mobile, no horizontal scroll needed!) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          onClick={() => setViewingStudent(st)}
                          className="p-1.5 rounded-md bg-stone-800 text-stone-300 hover:text-white border border-stone-700 shadow-xs cursor-pointer"
                          title="Ver perfil"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </motion.button>

                        {st.status === 'Recibido' ? (
                          !canUndo ? (
                            <button
                              type="button"
                              onClick={() => setBlockedCompanionStudent(st)}
                              className="py-1.5 px-2.5 rounded-md font-black text-xs flex items-center gap-1 shadow-xs bg-stone-900 text-stone-400 border border-stone-700/80 hover:border-amber-400/70 hover:text-stone-200 cursor-pointer"
                              title={`Entrega realizada por ${st.deliveredByName || 'otro repartidor'}`}
                            >
                              <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>Bloqueado</span>
                            </button>
                          ) : statusFilter === 'recibidos' ? (
                            <motion.button
                              onClick={() => onToggleStatus(st.id)}
                              whileTap={{ scale: 0.92 }}
                              className="py-1.5 px-2.5 rounded-md font-black text-xs transition cursor-pointer flex items-center gap-1 shadow-xs bg-rose-950/90 text-rose-200 border border-rose-500/70"
                              title="Haga clic para anular entrega"
                            >
                              <RotateCcw className="w-3 h-3 text-rose-400 shrink-0" />
                              <span>Anular</span>
                            </motion.button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setBlockedUndoStudent(st)}
                              className="py-1.5 px-2.5 rounded-md font-black text-xs flex items-center gap-1 shadow-xs bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 cursor-pointer"
                              title="Entrega registrada. Para anular, vaya a la pestaña 'Recibidos'."
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Recibido</span>
                              <Lock className="w-2.5 h-2.5 text-stone-400 ml-0.5 shrink-0" />
                            </button>
                          )
                        ) : (
                          <motion.button
                            onClick={() => onToggleStatus(st.id)}
                            whileTap={{ scale: 0.92 }}
                            className="py-1.5 px-3 rounded-md font-black text-xs transition cursor-pointer flex items-center gap-1 shadow-md bg-amber-400 hover:bg-amber-300 text-stone-950 border border-amber-300"
                            title="Marcar entrega como recibida"
                          >
                            <Clock className="w-3.5 h-3.5 text-stone-950 shrink-0" />
                            <span>Entregar</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Read-Only Student Profile Modal */}
      <AnimatePresence>
        {viewingStudent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-[#2e0513] border-2 border-stone-700/80 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative text-white"
            >
              {/* Close Button */}
              <button
                onClick={() => setViewingStudent(null)}
                className="absolute top-4 right-4 text-stone-400 hover:text-white bg-stone-900/60 p-2 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase mb-4 tracking-wider">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Perfil del Estudiante (Modo Lectura)</span>
              </div>

              {/* Student Header Details */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 mb-3 rounded-2xl bg-amber-400 text-stone-950 font-black flex items-center justify-center text-2xl shadow-xl border-2 border-amber-300">
                  {viewingStudent.fullName.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-xl font-black text-white">{viewingStudent.fullName}</h3>
                <span className="text-stone-300 text-sm font-semibold mt-1">
                  Documento: <strong className="text-white">{viewingStudent.documentNumber}</strong>
                </span>
              </div>

              {/* Details Cards */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-[#3d081b] p-3.5 rounded-2xl border border-stone-800 text-center">
                  <span className="text-stone-400 text-xs font-black block uppercase mb-1">
                    Grado Asignado
                  </span>
                  <span className="text-2xl font-black text-amber-300">
                    {formatGradeLabel(viewingStudent.grade)}
                  </span>
                </div>

                <div className="bg-[#3d081b] p-3.5 rounded-2xl border border-stone-800 text-center flex flex-col items-center justify-center">
                  <span className="text-stone-400 text-xs font-black block uppercase mb-1">
                    Estado Entrega
                  </span>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 ${
                      viewingStudent.status === 'Recibido'
                        ? 'bg-emerald-800 text-emerald-200 border border-emerald-500'
                        : 'bg-stone-800 text-stone-300 border border-stone-700'
                    }`}
                  >
                    {viewingStudent.status === 'Recibido' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Recibido</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pendiente</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {viewingStudent.status === 'Recibido' && (
                <div className="bg-[#3d081b] p-3.5 rounded-2xl border border-amber-500/40 text-left mb-5">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-stone-800">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block">
                        Constancia de Entrega
                      </span>
                      <span className="text-white text-xs font-bold">
                        Entregado personalmente por:
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 bg-[#1e030c] p-2.5 rounded-xl border border-stone-800/80">
                    <p className="text-xs font-black text-amber-300">
                      {viewingStudent.deliveredByName || 'Repartidor Autorizado'}
                    </p>
                    {viewingStudent.deliveredByDoc && (
                      <p className="text-[11px] text-stone-300">
                        C.C. / Documento: <span className="font-mono text-white font-bold">{viewingStudent.deliveredByDoc}</span>
                      </p>
                    )}
                    {viewingStudent.deliveryTimestamp && (
                      <p className="text-[11px] text-stone-400">
                        Fecha y Hora: <span className="text-stone-200 font-semibold">{viewingStudent.deliveryTimestamp}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewingStudent(null)}
                className="w-full bg-[#dedede] text-[#3d081b] font-black py-3.5 rounded-2xl hover:bg-stone-200 transition cursor-pointer text-base shadow-xl"
              >
                Cerrar Perfil
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Blocked Undo in "Todos" Notification Modal */}
      <AnimatePresence>
        {blockedUndoStudent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              className="bg-[#2e0513] border-2 border-amber-400 rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-2xl text-center space-y-3"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5 stroke-[2.2]" />
              </div>

              <div className="space-y-1">
                <h4 className="text-white font-black text-sm sm:text-base">
                  Anulación Protegida en "Todos"
                </h4>
                <p className="text-stone-300 text-xs leading-relaxed">
                  Para evitar eliminar entregas por error, solo puedes anular la entrega de <strong className="text-white">{blockedUndoStudent.fullName}</strong> desde la pestaña <strong className="text-emerald-400">"Recibidos"</strong>.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setBlockedUndoStudent(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition cursor-pointer"
                >
                  Entendido
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('recibidos');
                    setBlockedUndoStudent(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ir a Recibidos</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Blocked Companion Undo Modal */}
      <AnimatePresence>
        {blockedCompanionStudent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              className="bg-[#2e0513] border-2 border-rose-500/80 rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-2xl text-center space-y-3 text-white"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 text-rose-300 border border-rose-500/70 flex items-center justify-center mx-auto shadow-md">
                <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
              </div>

              <div className="space-y-1">
                <h4 className="text-white font-black text-sm sm:text-base">
                  Anulación No Autorizada
                </h4>
                <p className="text-stone-300 text-xs leading-relaxed">
                  Esta ración para <strong className="text-white">{blockedCompanionStudent.fullName}</strong> fue registrada y entregada por:
                </p>
              </div>

              <div className="bg-[#1a0209] rounded-xl p-2.5 border border-stone-800 text-left space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                  <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{blockedCompanionStudent.deliveredByName || 'Otro Repartidor'}</span>
                </div>
                {blockedCompanionStudent.deliveredByDoc && (
                  <p className="text-[11px] text-stone-400 font-mono">
                    Documento: <span className="text-stone-200">{blockedCompanionStudent.deliveredByDoc}</span>
                  </p>
                )}
                {blockedCompanionStudent.deliveryTimestamp && (
                  <p className="text-[10px] text-stone-400">
                    Fecha y Hora: <span className="text-stone-300">{blockedCompanionStudent.deliveryTimestamp}</span>
                  </p>
                )}
              </div>

              <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-2 text-[11px] text-amber-200/90 text-left leading-tight">
                <strong>Control de seguridad:</strong> Solo el repartidor que realizó y firmó la entrega (o un Administrador) tiene autorización para anularla. No es posible modificar ni eliminar entregas realizadas por un compañero.
              </div>

              <div className="pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setBlockedCompanionStudent(null)}
                  className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black transition shadow-md cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

