import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Student } from '../types';
import {
  BarChart3,
  Calendar,
  ShieldCheck,
  ListFilter,
  ChevronRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ActiveUserSession } from './LoginView';
import { playTapSound } from '../utils/audio';
import { maskDocument, maskEmail, isPrivacyModeEnabled } from '../utils/privacy';
import { IEELogo } from '../components/IEELogo';

interface AdminHomeViewProps {
  students?: Student[];
  activeUser?: ActiveUserSession | null;
  onOpenSettings: () => void;
  onGoToStudentList: (filters: { nombre: string; documento: string; grupo: string }) => void;
  onGoToStats?: () => void;
  onGoToHistory?: () => void;
  onGoHome?: () => void;
}

export const AdminHomeView: React.FC<AdminHomeViewProps> = ({
  students = [],
  activeUser,
  onOpenSettings,
  onGoToStudentList,
  onGoToStats,
  onGoToHistory,
  onGoHome,
}) => {
  const totalStudents = students.length;
  const [isConfidential] = useState(() => isPrivacyModeEnabled());

  const handleSearch = () => {
    playTapSound();
    onGoToStudentList({ nombre: '', documento: '', grupo: '' });
  };

  const handleStats = () => {
    playTapSound();
    if (onGoToStats) onGoToStats();
  };

  const handleHistory = () => {
    playTapSound();
    if (onGoToHistory) onGoToHistory();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3d081b] via-[#2f0615] to-[#1e030c] flex flex-col">
      <Header showSettings onSettings={onOpenSettings} onLogoClick={onGoHome} />

      <main className="flex-1 flex flex-col items-center p-3 sm:p-4 max-w-4xl mx-auto w-full">
        {/* Active Admin Session Profile Bar with Confidential Mode */}
        {activeUser && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-[#2e0513] p-2.5 sm:p-3 rounded-2xl border border-amber-400/30 shadow-xl mb-3 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/50 text-amber-300 font-black flex items-center justify-center shadow-xs shrink-0">
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/30 flex items-center gap-0.5">
                    {isConfidential ? <Lock className="w-2.5 h-2.5" /> : null}
                    <span>{activeUser.subRole === 'rectoria' ? '🏛️ Rectoría' : 'Admin'}</span>
                  </span>
                  <h3 className="text-white font-black text-sm truncate leading-tight">
                    {activeUser.fullName}
                  </h3>
                </div>
                <p className="text-stone-400 text-[10px] font-semibold truncate font-mono mt-0.5">
                  Doc:{' '}
                  <span className="text-stone-200 font-bold">
                    {isConfidential ? maskDocument(activeUser.documentNumber) : activeUser.documentNumber}
                  </span>{' '}
                  ·{' '}
                  <span className="text-stone-300">
                    {isConfidential
                      ? maskEmail(activeUser.email || 'admin@paeat.edu.co')
                      : activeUser.email || 'admin@paeat.edu.co'}
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Section Header */}
        <div className="text-center my-2 space-y-1 flex flex-col items-center">
          <div className="w-12 h-12 mb-1 drop-shadow-sm">
            <IEELogo className="w-full h-full" />
          </div>
          <div className="inline-flex items-center gap-1.5 bg-amber-400/15 border border-amber-400/30 text-amber-300 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Panel de Administración Central</span>
          </div>
          <h2 className="text-white text-xl sm:text-2xl font-black tracking-wide">
            Panel de Control PAEAT
          </h2>
          <p className="text-stone-300 text-xs font-medium max-w-md mx-auto">
            Sistema de gestión y supervisión del Programa de Alimentación Escolar · I.E. Empresarial
          </p>
        </div>

        {/* Main Modules Grid Navigation */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          {/* Card 1: Estadísticas y Reportes */}
          {onGoToStats && (
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStats}
              className="bg-[#2e0513] hover:bg-[#3b0619] p-4 rounded-2xl border border-stone-700/80 hover:border-amber-400/60 shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center mb-3 group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors shadow-xs">
                  <BarChart3 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h3 className="text-white font-black text-base group-hover:text-amber-300 transition-colors">
                  Módulo de Estadísticas
                </h3>
                <p className="text-stone-300 text-xs mt-1 leading-relaxed">
                  Gráficas interactivas de entregas por grado escolar, conteos en tiempo real y descarga de reportes oficiales en PDF y Excel/CSV.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between pt-2 border-t border-stone-800 text-xs font-black text-amber-400">
                <span>Ver Estadísticas</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          )}

          {/* Card 2: Historial de Jornadas */}
          {onGoToHistory && (
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleHistory}
              className="bg-[#2e0513] hover:bg-[#3b0619] p-4 rounded-2xl border border-stone-700/80 hover:border-amber-400/60 shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center mb-3 group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors shadow-xs">
                  <Calendar className="w-5 h-5 stroke-[2.2]" />
                </div>
                <h3 className="text-white font-black text-base group-hover:text-amber-300 transition-colors">
                  Historial de Jornadas
                </h3>
                <p className="text-stone-300 text-xs mt-1 leading-relaxed">
                  Consulte registros de entregas por fechas anteriores, auditoría de turnos cerrados y guardado histórico diario del PAEAT.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between pt-2 border-t border-stone-800 text-xs font-black text-amber-400">
                <span>Consultar Histórico</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          )}

          {/* Card 3: Lista de Estudiantes y Estado */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSearch}
            className="bg-[#2e0513] hover:bg-[#3b0619] p-4 rounded-2xl border border-stone-700/80 hover:border-amber-400/60 shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center mb-3 group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors shadow-xs">
                <ListFilter className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="text-white font-black text-base group-hover:text-amber-300 transition-colors">
                Listado de Estudiantes
              </h3>
              <p className="text-stone-300 text-xs mt-1 leading-relaxed">
                Visualización de los {totalStudents} estudiantes registrados, filtrado por documento, grado escolar o nombre con marcas de entrega.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between pt-2 border-t border-stone-800 text-xs font-black text-amber-400">
              <span>Abrir Lista</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
