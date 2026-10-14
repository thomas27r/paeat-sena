import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Student, Grade } from '../types';
import { Trash2, Save, User, FileText, GraduationCap, Sparkles } from 'lucide-react';
import { Modal } from '../components/Modal';
import { motion } from 'motion/react';

interface StudentFormViewProps {
  studentToEdit?: Student | null;
  onBack: () => void;
  onSave: (studentData: {
    id?: string;
    fullName: string;
    documentNumber: string;
    grade: Grade;
    avatarUrl?: string;
  }) => void;
  onDelete?: (id: string) => void;
  onOpenSettings?: () => void;
}

export const StudentFormView: React.FC<StudentFormViewProps> = ({
  studentToEdit,
  onBack,
  onSave,
  onDelete,
  onOpenSettings,
}) => {
  const isEditing = !!studentToEdit;
  const [fullName, setFullName] = useState(studentToEdit?.fullName || '');
  const [documentNumber, setDocumentNumber] = useState(
    studentToEdit?.documentNumber || ''
  );
  const [grade, setGrade] = useState<Grade>(studentToEdit?.grade || '6');
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (studentToEdit) {
      setFullName(studentToEdit.fullName);
      setDocumentNumber(studentToEdit.documentNumber);
      setGrade(studentToEdit.grade);
    }
  }, [studentToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !documentNumber.trim()) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }
    setError('');

    onSave({
      id: studentToEdit?.id,
      fullName: fullName.trim(),
      documentNumber: documentNumber.trim(),
      grade,
    });
  };

  const handleConfirmDelete = () => {
    if (studentToEdit && onDelete) {
      onDelete(studentToEdit.id);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#3d081b] flex flex-col pb-16">
      <Header showBack onBack={onBack} showSettings onSettings={onOpenSettings} />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        title="¿Ocultar Estudiante del Sistema?"
        description={`¿Está seguro de que desea ocultar a "${studentToEdit?.fullName}"? El estudiante se ocultará de las entregas y listas activas, pero permanecerá guardado en la base de datos y podrá restaurarse en cualquier momento desde la Papelera / Registros Ocultos.`}
        confirmText="Sí, archivar/ocultar"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      <main className="flex-1 flex flex-col items-center justify-start py-4 sm:py-6 px-3 sm:px-4 max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center"
        >
          {/* Header Title */}
          <div className="text-center mb-3">
            <div className="inline-flex items-center gap-1.5 bg-amber-400/15 border border-amber-400/30 text-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              <span>{isEditing ? 'Edición de Registro' : 'Nuevo Registro'}</span>
            </div>
            <h1 className="text-white text-lg sm:text-xl font-black tracking-tight">
              {isEditing ? 'Editar Estudiante' : 'Registrar Estudiante'}
            </h1>
            <p className="text-stone-300 text-xs mt-0.5">
              {isEditing
                ? 'Actualice la información del estudiante'
                : 'Ingrese los datos del estudiante para incorporarlo'}
            </p>
          </div>

          {error && (
            <div className="w-full bg-rose-950/80 border border-rose-500 text-rose-100 text-xs font-bold rounded-xl p-2 mb-3 text-center shadow-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-3">
            {/* Form Fields Container */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#2e0513] p-3.5 sm:p-4 rounded-2xl border border-stone-700/80 shadow-xl">
              {/* Full Name */}
              <div className="flex flex-col sm:col-span-3">
                <label className="text-stone-300 text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-amber-400" />
                  <span>Nombre Completo *</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Sofia Martínez Gómez"
                  className="w-full bg-[#1e030c] text-white text-sm font-bold rounded-xl px-3 py-2 border border-stone-800 outline-hidden focus:ring-2 focus:ring-amber-400 shadow-inner"
                />
              </div>

              {/* Document Number */}
              <div className="flex flex-col sm:col-span-2">
                <label className="text-stone-300 text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-amber-400" />
                  <span>Nro. Documento (TI / CC) *</span>
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Ej: 1098765432"
                  className="w-full bg-[#1e030c] text-white font-mono text-sm font-bold rounded-xl px-3 py-2 border border-stone-800 outline-hidden focus:ring-2 focus:ring-amber-400 shadow-inner"
                />
              </div>

              {/* Grade */}
              <div className="flex flex-col sm:col-span-1">
                <label className="text-stone-300 text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-amber-400" />
                  <span>Grado *</span>
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as Grade)}
                  className="w-full bg-[#1e030c] text-white text-sm font-black rounded-xl px-3 py-2 border border-stone-800 outline-hidden focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-inner"
                >
                  <option value="5">Grado 5°</option>
                  <option value="6">Grado 6°</option>
                  <option value="7">Grado 7°</option>
                  <option value="8">Grado 8°</option>
                  <option value="9">Grado 9°</option>
                  <option value="10">Grado 10°</option>
                  <option value="11">Grado 11°</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-2.5 w-full max-w-sm mt-1">
              {isEditing && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-200 hover:text-white rounded-xl py-2 px-4 text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 rounded-xl py-2 px-5 text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md border border-amber-300"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {isEditing ? 'Guardar Cambios' : 'Registrar Estudiante'}
                </span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
};


