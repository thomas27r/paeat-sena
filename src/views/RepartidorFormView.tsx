import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Repartidor } from '../types';
import { Trash2, Save, Eye, EyeOff, Key, User, FileText, Shield, Clock, Calendar, Check, AlertCircle } from 'lucide-react';
import { Modal } from '../components/Modal';
import { motion } from 'motion/react';
import { SHIFT_PRESETS, DAY_NAMES, SHORT_DAY_NAMES } from '../utils/schedule';

interface RepartidorFormViewProps {
  repartidorToEdit?: Repartidor | null;
  onBack: () => void;
  onSave: (repartidorData: {
    id?: string;
    fullName: string;
    documentNumber: string;
    avatarUrl?: string;
    password?: string;
    hasScheduleRestriction?: boolean;
    shiftStart?: string;
    shiftEnd?: string;
    shiftName?: string;
    shiftDays?: number[];
  }) => void;
  onDelete?: (id: string) => void;
  onOpenSettings?: () => void;
  onGoHome?: () => void;
}

export const RepartidorFormView: React.FC<RepartidorFormViewProps> = ({
  repartidorToEdit,
  onBack,
  onSave,
  onDelete,
  onOpenSettings,
  onGoHome,
}) => {
  const isEditing = !!repartidorToEdit;
  const [fullName, setFullName] = useState(repartidorToEdit?.fullName || '');
  const [documentNumber, setDocumentNumber] = useState(
    repartidorToEdit?.documentNumber || ''
  );
  const [password, setPassword] = useState(
    repartidorToEdit?.password || 'repartidor123'
  );
  const [showPassword, setShowPassword] = useState(false);

  // Shift / Schedule State
  const [hasScheduleRestriction, setHasScheduleRestriction] = useState<boolean>(
    repartidorToEdit?.hasScheduleRestriction !== false
  );
  const [shiftStart, setShiftStart] = useState<string>(
    repartidorToEdit?.shiftStart || '06:00'
  );
  const [shiftEnd, setShiftEnd] = useState<string>(
    repartidorToEdit?.shiftEnd || '12:00'
  );
  const [shiftName, setShiftName] = useState<string>(
    repartidorToEdit?.shiftName || 'Jornada Mañana'
  );
  const [shiftDays, setShiftDays] = useState<number[]>(
    repartidorToEdit?.shiftDays || [1, 2, 3, 4, 5]
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>('manana');

  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (repartidorToEdit) {
      setFullName(repartidorToEdit.fullName);
      setDocumentNumber(repartidorToEdit.documentNumber);
      setPassword(repartidorToEdit.password || 'repartidor123');
      setHasScheduleRestriction(repartidorToEdit.hasScheduleRestriction !== false);
      setShiftStart(repartidorToEdit.shiftStart || '06:00');
      setShiftEnd(repartidorToEdit.shiftEnd || '12:00');
      setShiftName(repartidorToEdit.shiftName || 'Jornada Mañana');
      setShiftDays(repartidorToEdit.shiftDays || [1, 2, 3, 4, 5]);

      // Check if matches preset
      const matched = SHIFT_PRESETS.find(
        (p) => p.start === (repartidorToEdit.shiftStart || '06:00') && p.end === (repartidorToEdit.shiftEnd || '12:00')
      );
      if (matched) {
        setSelectedPresetId(matched.id);
      } else {
        setSelectedPresetId('custom');
      }
    }
  }, [repartidorToEdit]);

  const handleApplyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = SHIFT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    if (preset.id === 'libre') {
      setHasScheduleRestriction(false);
      setShiftName(preset.name);
      setShiftStart('00:00');
      setShiftEnd('23:59');
      setShiftDays([0, 1, 2, 3, 4, 5, 6]);
    } else {
      setHasScheduleRestriction(true);
      setShiftName(preset.name);
      setShiftStart(preset.start);
      setShiftEnd(preset.end);
      setShiftDays(preset.days);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setShiftDays((prev) => {
      if (prev.includes(dayIndex)) {
        if (prev.length <= 1) return prev; // Keep at least one day
        return prev.filter((d) => d !== dayIndex);
      } else {
        return [...prev, dayIndex].sort((a, b) => a - b);
      }
    });
    setSelectedPresetId('custom');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !documentNumber.trim() || !password.trim()) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }
    if (hasScheduleRestriction && (!shiftStart || !shiftEnd)) {
      setError('Por favor ingrese las horas de inicio y fin de turno');
      return;
    }
    setError('');
    onSave({
      id: repartidorToEdit?.id,
      fullName: fullName.trim(),
      documentNumber: documentNumber.trim(),
      password: password.trim(),
      hasScheduleRestriction,
      shiftStart,
      shiftEnd,
      shiftName,
      shiftDays,
    });
  };

  const handleConfirmDelete = () => {
    if (repartidorToEdit && onDelete) {
      onDelete(repartidorToEdit.id);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#3d081b] flex flex-col pb-20 sm:pb-16">
      <Header showBack onBack={onBack} showSettings onSettings={onOpenSettings} onLogoClick={onGoHome} />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        title="¿Ocultar e Inactivar Repartidor?"
        description={`¿Está seguro de que desea ocultar al repartidor "${repartidorToEdit?.fullName}"? Se marcará como inactivo y se ocultará de la lista, pero permanecerá guardado en la base de datos y podrá restaurarse en cualquier momento desde la Papelera / Registros Ocultos.`}
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
              <Shield className="w-3 h-3" />
              <span>{isEditing ? 'Edición de Repartidor' : 'Nuevo Repartidor'}</span>
            </div>
            <h1 className="text-white text-lg sm:text-xl font-black tracking-tight">
              {isEditing ? 'Editar Repartidor' : 'Registrar Repartidor'}
            </h1>
            <p className="text-stone-300 text-xs mt-0.5">
              {isEditing
                ? 'Actualice las credenciales y el horario de acceso autorizado'
                : 'Cree una cuenta para el repartidor con su turno laboral'}
            </p>
          </div>

          {error && (
            <div className="w-full bg-rose-950/80 border border-rose-500 text-rose-100 text-xs font-bold rounded-xl p-2 mb-3 text-center shadow-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-3">
            {/* Account Credentials Container */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#2e0513] p-3.5 sm:p-4 rounded-2xl border border-stone-700/80 shadow-xl">
              <div className="sm:col-span-2 pb-1 border-b border-stone-800/80">
                <span className="text-amber-400 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Datos de Acceso</span>
                </span>
              </div>

              {/* Full Name */}
              <div className="flex flex-col sm:col-span-2">
                <label className="text-stone-300 text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-amber-400" />
                  <span>Nombre Completo *</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Carlos Alberto Gómez"
                  className="w-full bg-[#1e030c] text-white text-sm font-bold rounded-xl px-3 py-2 border border-stone-800 outline-hidden focus:ring-2 focus:ring-amber-400 shadow-inner"
                />
              </div>

              {/* Document Number */}
              <div className="flex flex-col">
                <label className="text-stone-300 text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-amber-400" />
                  <span>Nro. Documento (Usuario) *</span>
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Ej: 71234567"
                  className="w-full bg-[#1e030c] text-white font-mono text-sm font-bold rounded-xl px-3 py-2 border border-stone-800 outline-hidden focus:ring-2 focus:ring-amber-400 shadow-inner"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col">
                <label className="text-stone-300 text-[10px] font-black uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-3 h-3 text-amber-400" />
                    <span>Contraseña *</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña del repartidor"
                    className="w-full bg-[#1e030c] text-white font-mono text-sm font-bold rounded-xl pl-3 pr-9 py-2 border border-stone-800 outline-hidden focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white transition p-1 cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-stone-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-stone-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Shift & Schedule Access Restriction Section */}
            <div className="w-full bg-[#2e0513] p-3.5 sm:p-4 rounded-2xl border border-stone-700/80 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-stone-800/80">
                <span className="text-amber-400 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Control de Horario de Acceso (Turnos)</span>
                </span>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <span className="text-[11px] font-bold text-stone-300">
                    {hasScheduleRestriction ? 'Restricción Activa' : 'Sin Restricción (24h)'}
                  </span>
                  <input
                    type="checkbox"
                    checked={hasScheduleRestriction}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setHasScheduleRestriction(enabled);
                      if (!enabled) {
                        setSelectedPresetId('libre');
                      } else if (selectedPresetId === 'libre') {
                        setSelectedPresetId('manana');
                        setShiftStart('06:00');
                        setShiftEnd('12:00');
                      }
                    }}
                    className="w-4 h-4 rounded text-amber-400 focus:ring-amber-400 bg-stone-900 border-stone-700 cursor-pointer"
                  />
                </label>
              </div>

              {/* Security Hint */}
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2.5 text-[11px] text-amber-200/90 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Medida de Protección Anti-Suplantación:</strong> Al fijar un horario de turno, el repartidor solo podrá iniciar sesión dentro de estas horas. Si otro usuario conoce su contraseña e intenta entrar fuera de turno, el sistema denegará el acceso automáticamente.
                </p>
              </div>

              {hasScheduleRestriction ? (
                <>
                  {/* Quick Shift Presets */}
                  <div>
                    <label className="text-stone-300 text-[10px] font-black uppercase tracking-wider mb-1.5 block">
                      Plantillas Rápidas de Turno
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SHIFT_PRESETS.map((p) => {
                        const isSelected = selectedPresetId === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleApplyPreset(p.id)}
                            className={`p-2 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/40'
                                : 'bg-[#1e030c] border-stone-800 text-stone-300 hover:border-stone-700 hover:bg-[#250410]'
                            }`}
                          >
                            <span className="font-black text-xs flex items-center justify-between">
                              <span>{p.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                            </span>
                            <span className="font-mono text-[10px] text-stone-400 mt-1">
                              {p.start} - {p.end}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Shift Time Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-stone-300 text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Hora Inicio de Turno</span>
                      </label>
                      <input
                        type="time"
                        value={shiftStart}
                        onChange={(e) => {
                          setShiftStart(e.target.value);
                          setSelectedPresetId('custom');
                        }}
                        className="w-full bg-[#1e030c] text-white font-mono text-sm font-bold rounded-xl px-3 py-2 border border-stone-800 outline-hidden focus:ring-2 focus:ring-amber-400 shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="text-stone-300 text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Hora Fin de Turno</span>
                      </label>
                      <input
                        type="time"
                        value={shiftEnd}
                        onChange={(e) => {
                          setShiftEnd(e.target.value);
                          setSelectedPresetId('custom');
                        }}
                        className="w-full bg-[#1e030c] text-white font-mono text-sm font-bold rounded-xl px-3 py-2 border border-stone-800 outline-hidden focus:ring-2 focus:ring-amber-400 shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Permitted Days Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-stone-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        <span>Días Autorizados</span>
                      </label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setShiftDays([1, 2, 3, 4, 5]);
                            setSelectedPresetId('custom');
                          }}
                          className="text-[10px] text-amber-300 hover:underline font-bold"
                        >
                          Lun a Vie
                        </button>
                        <span className="text-stone-600">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShiftDays([0, 1, 2, 3, 4, 5, 6]);
                            setSelectedPresetId('custom');
                          }}
                          className="text-[10px] text-amber-300 hover:underline font-bold"
                        >
                          Toda la semana
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                        const active = shiftDays.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggleDay(d)}
                            className={`py-1.5 rounded-lg text-xs font-black transition cursor-pointer border flex flex-col items-center ${
                              active
                                ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-xs'
                                : 'bg-[#1e030c] text-stone-400 border-stone-800 hover:border-stone-700'
                            }`}
                            title={DAY_NAMES[d]}
                          >
                            <span>{SHORT_DAY_NAMES[d]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-[#1e030c] border border-stone-800 rounded-xl p-3 text-center">
                  <p className="text-stone-300 text-xs font-bold">
                    Acceso Libre Habilitado (24 Horas)
                  </p>
                  <p className="text-stone-400 text-[11px] mt-0.5">
                    Este repartidor podrá ingresar en cualquier día y a cualquier hora sin restricción.
                  </p>
                </div>
              )}
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
                  {isEditing ? 'Guardar Cambios' : 'Registrar Repartidor'}
                </span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
};



