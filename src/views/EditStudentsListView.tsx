import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Student } from '../types';
import { Settings, Plus, Trash2, Search, Users } from 'lucide-react';
import { Modal } from '../components/Modal';
import { matchStudent } from '../utils/search';
import { motion } from 'motion/react';
import { ExcelStudentImporter } from '../components/ExcelStudentImporter';

interface EditStudentsListViewProps {
  students: Student[];
  onBack: () => void;
  onEditStudent: (student: Student) => void;
  onAddStudent: () => void;
  onDeleteStudent?: (id: string) => void;
  onImportStudents?: (newStudents: Student[], mode: 'append' | 'replace') => void;
  onOpenSettings?: () => void;
}

export const EditStudentsListView: React.FC<EditStudentsListViewProps> = ({
  students,
  onBack,
  onEditStudent,
  onAddStudent,
  onDeleteStudent,
  onImportStudents,
  onOpenSettings,
}) => {
  const [filterText, setFilterText] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const formatGradeLabel = (g: string) => {
    const match = g.match(/^(\d+)([A-Za-z])$/);
    if (match) {
      return `${match[1]}°${match[2].toUpperCase()}`;
    }
    return `${g}°`;
  };

  const filtered = students.filter((s) => matchStudent(s, filterText));

  const handleConfirmDelete = () => {
    if (studentToDelete && onDeleteStudent) {
      onDeleteStudent(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#3d081b] flex flex-col relative pb-20">
      <Header showBack onBack={onBack} showSettings onSettings={onOpenSettings} />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!studentToDelete}
        title="¿Ocultar Estudiante del Sistema?"
        description={`¿Está seguro de que desea ocultar a "${studentToDelete?.fullName}"? El estudiante se ocultará de las entregas y listas activas, pero permanecerá protegido en la base de datos y podrá restaurarse en cualquier momento desde la Papelera / Registros Ocultos.`}
        confirmText="Sí, archivar/ocultar"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onClose={() => setStudentToDelete(null)}
      />

      <main className="flex-1 p-2 sm:p-3 max-w-5xl mx-auto w-full animate-in fade-in duration-200">
        
        {/* View Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/50 text-amber-300 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-white tracking-wide leading-tight">
                Administrar Estudiantes ({students.length})
              </h1>
              <p className="text-stone-300 text-[11px] font-medium">
                Gestión manual o importación masiva de estudiantes en Excel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
            {onImportStudents && (
              <ExcelStudentImporter
                onImport={onImportStudents}
                existingCount={students.length}
              />
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddStudent}
              className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-md py-1 px-2.5 text-xs flex items-center justify-center gap-1 border border-amber-300 shadow-xs cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nuevo Estudiante</span>
            </motion.button>
          </div>
        </div>

        {/* Filter input */}
        <div className="mb-2 bg-[#2e0513] p-1.5 rounded-lg border border-stone-700/80 shadow-xs">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, documento o grado..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-[#1e030c] text-white pl-8 pr-3 py-1.5 rounded-md border border-stone-800 text-xs font-medium outline-hidden focus:ring-1 focus:ring-amber-400 shadow-inner"
            />
          </div>
        </div>

        {/* Mobile View: Responsive Cards List */}
        <div className="block sm:hidden space-y-2">
          {filtered.length === 0 ? (
            <div className="text-stone-300 text-center py-6 bg-[#2e0513] rounded-xl border border-stone-800 font-semibold text-xs">
              No se encontraron estudiantes registrados.
            </div>
          ) : (
            filtered.map((st) => (
              <motion.div
                key={st.id}
                whileHover={{ scale: 1.005 }}
                className="bg-[#2e0513] border border-stone-700/80 rounded-xl p-3 shadow-md space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-black text-sm leading-snug break-words">
                      {st.fullName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-block bg-[#1a0209] text-stone-200 font-mono font-bold text-xs px-2 py-0.5 rounded border border-stone-800 shadow-inner">
                        Doc: {st.documentNumber}
                      </span>
                      <span className="inline-block bg-amber-400/15 text-amber-300 border border-amber-400/40 font-black text-xs px-2 py-0.5 rounded">
                        Grado {formatGradeLabel(st.grade)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800/80">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onEditStudent(st)}
                    className="flex-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-600 shadow-xs cursor-pointer text-xs font-bold py-1.5 flex items-center justify-center gap-1"
                  >
                    <span>Editar</span>
                  </motion.button>

                  {onDeleteStudent && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStudentToDelete(st)}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 shadow-xs cursor-pointer flex items-center justify-center gap-1 text-xs font-bold"
                      title="Eliminar estudiante"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Ocultar</span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Desktop / Tablet Table Layout */}
        <div className="hidden sm:block w-full overflow-x-auto bg-[#2e0513] rounded-lg border border-stone-700/80 shadow-md">
          <div className="min-w-[600px]">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 bg-[#1e030c] px-2.5 py-1.5 border-b border-stone-800 text-stone-300 font-extrabold text-[10px] uppercase tracking-wider items-center">
              <div className="col-span-5">Nombre Completo</div>
              <div className="col-span-3 text-center">Documento</div>
              <div className="col-span-2 text-center">Grado</div>
              <div className="col-span-2 text-center">Acciones</div>
            </div>

            {/* List Rows */}
            <div className="divide-y divide-stone-800/80">
              {filtered.length === 0 ? (
                <div className="text-stone-300 text-center py-5 bg-[#2e0513] font-semibold text-xs">
                  No se encontraron estudiantes registrados.
                </div>
              ) : (
                filtered.map((st) => (
                  <motion.div
                    key={st.id}
                    whileHover={{ backgroundColor: '#3b0619' }}
                    className="grid grid-cols-12 gap-2 items-center px-2.5 py-1.5 bg-[#2a0411] transition-colors"
                  >
                    <div className="col-span-5 flex flex-col min-w-0 pr-1">
                      <span className="text-white font-bold text-xs leading-tight truncate hover:text-amber-300 transition-colors">
                        {st.fullName}
                      </span>
                    </div>

                    <div className="col-span-3 text-center">
                      <span className="inline-block bg-[#1a0209] text-stone-200 font-mono font-bold text-[11px] px-1.5 py-0.2 rounded border border-stone-800/90 shadow-inner">
                        {st.documentNumber}
                      </span>
                    </div>

                    <div className="col-span-2 text-center">
                      <span className="inline-block bg-amber-400/15 text-amber-300 border border-amber-400/40 font-black text-[10px] px-1.5 py-0.2 rounded">
                        {formatGradeLabel(st.grade)}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center justify-center gap-1.5">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onEditStudent(st)}
                        className="rounded-md bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-600 shadow-xs cursor-pointer text-[11px] font-bold px-2 py-0.5"
                        title="Editar estudiante"
                      >
                        <span>Editar</span>
                      </motion.button>

                      {onDeleteStudent && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setStudentToDelete(st)}
                          className="p-1 rounded-md bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 shadow-xs cursor-pointer"
                          title="Eliminar estudiante"
                        >
                          <Trash2 className="w-3 h-3" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
