import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Repartidor } from '../types';
import { Plus, Trash2, Search, UserCheck, Clock } from 'lucide-react';
import { Modal } from '../components/Modal';
import { normalizeText } from '../utils/search';
import { motion } from 'motion/react';
import { ExcelRepartidorImporter } from '../components/ExcelRepartidorImporter';
import { checkDriverScheduleAccess, formatDaysOfWeek } from '../utils/schedule';

interface EditRepartidoresListViewProps {
  repartidores: Repartidor[];
  onBack: () => void;
  onEditRepartidor: (repartidor: Repartidor) => void;
  onAddRepartidor: () => void;
  onDeleteRepartidor?: (id: string) => void;
  onImportRepartidores?: (repartidores: Repartidor[], mode: 'append' | 'replace') => void;
  onOpenSettings?: () => void;
  onGoHome?: () => void;
}

export const EditRepartidoresListView: React.FC<EditRepartidoresListViewProps> = ({
  repartidores,
  onBack,
  onEditRepartidor,
  onAddRepartidor,
  onDeleteRepartidor,
  onImportRepartidores,
  onOpenSettings,
  onGoHome,
}) => {
  const [filterText, setFilterText] = useState('');
  const [repartidorToDelete, setRepartidorToDelete] = useState<Repartidor | null>(null);

  const filtered = repartidores.filter((r) => {
    if (!filterText.trim()) return true;
    const q = normalizeText(filterText);
    const name = normalizeText(r.fullName);
    const doc = normalizeText(r.documentNumber);
    return name.includes(q) || doc.includes(q);
  });

  const handleConfirmDelete = () => {
    if (repartidorToDelete && onDeleteRepartidor) {
      onDeleteRepartidor(repartidorToDelete.id);
      setRepartidorToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#3d081b] flex flex-col relative pb-20">
      <Header showBack onBack={onBack} showSettings onSettings={onOpenSettings} onLogoClick={onGoHome} />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!repartidorToDelete}
        title="¿Ocultar e Inactivar Repartidor?"
        description={`¿Está seguro de que desea ocultar a "${repartidorToDelete?.fullName}"? El repartidor se marcará como inactivo y se ocultará de la lista, pero permanecerá guardado en la base de datos y podrá restaurarse en cualquier momento desde la Papelera / Registros Ocultos.`}
        confirmText="Sí, archivar/ocultar"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onClose={() => setRepartidorToDelete(null)}
      />

      <main className="flex-1 p-2 sm:p-3 max-w-5xl mx-auto w-full animate-in fade-in duration-200">
        
        {/* Compact View Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/50 text-amber-300 flex items-center justify-center shrink-0">
              <UserCheck className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-white tracking-wide leading-tight">
                Administrar Repartidores ({repartidores.length})
              </h1>
              <p className="text-stone-300 text-[11px] font-medium">
                Gestión de cuentas, turnos de horario autorizados e importación masiva
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
            {onImportRepartidores && (
              <ExcelRepartidorImporter
                onImport={onImportRepartidores}
                existingCount={repartidores.length}
              />
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddRepartidor}
              className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-md py-1 px-2.5 text-xs flex items-center justify-center gap-1 border border-amber-300 shadow-xs cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nuevo Repartidor</span>
            </motion.button>
          </div>
        </div>

        {/* Compact Search Input */}
        <div className="mb-2 bg-[#2e0513] p-1.5 rounded-lg border border-stone-700/80 shadow-xs">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar repartidor por nombre o documento..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-[#1e030c] text-white pl-8 pr-3 py-1.5 rounded-md border border-stone-800 text-xs font-medium outline-hidden focus:ring-1 focus:ring-amber-400 shadow-inner"
            />
          </div>
        </div>

        {/* Mobile View: Responsive Cards List */}
        <div className="block sm:hidden space-y-2">
          {filtered.length === 0 ? (
            <div className="text-stone-300 text-center py-6 bg-[#2e0513] rounded-xl border border-stone-800 font-bold text-xs">
              No se encontraron repartidores registrados.
            </div>
          ) : (
            filtered.map((rep) => {
              const scheduleStatus = checkDriverScheduleAccess(rep);
              const isUnrestricted = rep.hasScheduleRestriction === false;

              return (
                <motion.div
                  key={rep.id}
                  whileHover={{ scale: 1.005 }}
                  className="bg-[#2e0513] border border-stone-700/80 rounded-xl p-3 shadow-md space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-black text-sm leading-snug break-words">
                        {rep.fullName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="inline-block bg-[#1a0209] text-stone-200 font-mono font-bold text-xs px-2 py-0.5 rounded border border-stone-800 shadow-inner">
                          C.C. {rep.documentNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shift details badge on Mobile */}
                  <div className="bg-[#1e030c] p-2 rounded-lg border border-stone-800 flex items-center justify-between text-xs">
                    <span className="text-stone-400 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Horario:
                    </span>
                    {isUnrestricted ? (
                      <span className="font-bold bg-blue-950/80 text-blue-300 border border-blue-700/60 px-2 py-0.5 rounded text-[11px]">
                        Libre (24 Horas)
                      </span>
                    ) : (
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2 py-0.5 rounded border ${
                            scheduleStatus.allowed
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/80'
                              : 'bg-stone-900 text-stone-300 border-stone-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              scheduleStatus.allowed ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
                            }`}
                          />
                          <span>
                            {rep.shiftStart || '06:00'} - {rep.shiftEnd || '12:00'}
                          </span>
                        </span>
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          {scheduleStatus.allowed ? 'En turno' : 'Fuera de turno'} • {formatDaysOfWeek(rep.shiftDays)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Mobile Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800/80">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onEditRepartidor(rep)}
                      className="flex-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-600 shadow-xs cursor-pointer text-xs font-bold py-1.5 flex items-center justify-center gap-1"
                    >
                      <span>Editar</span>
                    </motion.button>

                    {onDeleteRepartidor && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setRepartidorToDelete(rep)}
                        className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 shadow-xs cursor-pointer flex items-center justify-center gap-1 text-xs font-bold"
                        title="Eliminar repartidor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Ocultar</span>
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Desktop / Tablet Compact Table Layout */}
        <div className="hidden sm:block w-full overflow-x-auto bg-[#2e0513] rounded-lg border border-stone-700/80 shadow-md">
          <div className="min-w-[620px]">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 bg-[#1e030c] px-2.5 py-1.5 border-b border-stone-800 text-stone-300 font-black text-[10px] uppercase tracking-wider items-center">
              <div className="col-span-5">Nombre Completo</div>
              <div className="col-span-2 text-center">Documento</div>
              <div className="col-span-3 text-center">Horario de Turno</div>
              <div className="col-span-2 text-center">Acciones</div>
            </div>

            {/* List Rows */}
            <div className="divide-y divide-stone-800/80">
              {filtered.length === 0 ? (
                <div className="text-stone-300 text-center py-5 bg-[#2e0513] font-bold text-xs">
                  No se encontraron repartidores registrados.
                </div>
              ) : (
                filtered.map((rep) => {
                  const scheduleStatus = checkDriverScheduleAccess(rep);
                  const isUnrestricted = rep.hasScheduleRestriction === false;

                  return (
                    <motion.div
                      key={rep.id}
                      whileHover={{ backgroundColor: '#3b0619' }}
                      className="grid grid-cols-12 gap-2 items-center px-2.5 py-1.5 bg-[#2a0411] transition-colors"
                    >
                      <div className="col-span-5 flex flex-col min-w-0 pr-1">
                        <span className="text-white font-bold text-xs leading-tight truncate hover:text-amber-300 transition-colors">
                          {rep.fullName}
                        </span>
                      </div>

                      <div className="col-span-2 text-center">
                        <span className="inline-block bg-[#1a0209] text-stone-200 font-mono font-bold text-[11px] px-1.5 py-0.2 rounded border border-stone-800/90 shadow-inner">
                          {rep.documentNumber}
                        </span>
                      </div>

                      {/* Shift Schedule Badge */}
                      <div className="col-span-3 flex flex-col items-center justify-center">
                        {isUnrestricted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-700/60 px-1.5 py-0.5 rounded">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Libre (24h)</span>
                          </span>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                scheduleStatus.allowed
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/80'
                                  : 'bg-stone-900 text-stone-300 border-stone-700'
                              }`}
                              title={scheduleStatus.detail}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  scheduleStatus.allowed ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
                                }`}
                              />
                              <span>
                                {rep.shiftStart || '06:00'} - {rep.shiftEnd || '12:00'}
                              </span>
                            </span>
                            <span className="text-[9px] text-stone-400 font-medium">
                              {scheduleStatus.allowed ? 'En turno' : 'Fuera de turno'} • {formatDaysOfWeek(rep.shiftDays)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons: Edit & Direct Delete */}
                      <div className="col-span-2 flex items-center justify-center gap-1.5">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onEditRepartidor(rep)}
                          className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-600 shadow-xs cursor-pointer text-[11px] font-bold"
                          title="Editar cuenta y horario"
                        >
                          <span>Editar</span>
                        </motion.button>

                        {onDeleteRepartidor && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setRepartidorToDelete(rep)}
                            className="p-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 shadow-xs cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};
