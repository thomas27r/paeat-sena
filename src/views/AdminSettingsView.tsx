import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Student, AdminAccount, Repartidor, PQRMessage, DailyHistoryRecord } from '../types';
import { APP_VERSION_LABEL } from '../config/version';
import {
  User,
  Truck,
  Inbox,
  PhoneCall,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Sliders,
  CheckCircle2,
  Save,
  Key,
  Mail,
  Users,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  Archive,
  Landmark,
  FileSpreadsheet,
  HelpCircle,
  ExternalLink,
  AlertCircle,
  X,
  RotateCcw,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveUserSession } from './LoginView';
import { playTapSound, playSuccessSound, playDeleteSound, useAudioMuted } from '../utils/audio';
import { maskDocument, maskEmail, isPrivacyModeEnabled, setPrivacyModeEnabled } from '../utils/privacy';

interface AdminSettingsViewProps {
  onBack: () => void;
  activeUser?: ActiveUserSession | null;
  adminAccounts?: AdminAccount[];
  onUpdateActiveUser?: (updatedUser: ActiveUserSession, newPassword?: string) => void;
  rectorAccount?: AdminAccount;
  onUpdateRectorAccount?: (updatedRector: AdminAccount) => void;
  onEditStudents: () => void;
  onEditRepartidores: () => void;
  onPqrHelp: () => void;
  onOpenPqrInbox?: () => void;
  onOpenHistory?: () => void;
  onOpenTrash?: () => void;
  hiddenCount?: number;
  onLogout: () => void;
  pqrUnreadCount?: number;
  students?: Student[];
  repartidores?: Repartidor[];
  pqrs?: PQRMessage[];
  dailyHistory?: DailyHistoryRecord[];
  onImportStudents?: (students: Student[], mode: 'append' | 'replace') => void;
}

export type SettingsCategory =
  | 'perfil'          // Mi Perfil y Credenciales
  | 'rectoria'        // Cuenta Oficial de Rectoría (solo admin)
  | 'comunidad'       // Gestión Estudiantes y Repartidores
  | 'seguridad'       // Papelera / Soft Delete y Modo Confidencial
  | 'soporte';        // Buzón PQR, Contactos y Créditos

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  onBack,
  activeUser,
  adminAccounts = [],
  onUpdateActiveUser,
  rectorAccount,
  onUpdateRectorAccount,
  onEditStudents,
  onEditRepartidores,
  onPqrHelp,
  onOpenPqrInbox,
  onOpenTrash,
  hiddenCount = 0,
  onLogout,
  pqrUnreadCount = 0,
  students = [],
  repartidores = [],
  pqrs = [],
  dailyHistory = [],
}) => {
  const isRectoria = activeUser?.subRole === 'rectoria';
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('perfil');
  const [muted, , toggleAudioMute] = useAudioMuted();
  const [backupSuccess, setBackupSuccess] = useState(false);

  const handleDownloadBackup = () => {
    playSuccessSound();

    const backupData = {
      backupVersion: '2.4.0',
      exportedAt: new Date().toISOString(),
      institution: 'Institución Educativa Empresarial - PAEAT',
      exportedBy: activeUser?.fullName || 'Administrador PAEAT',
      exportedByDoc: activeUser?.documentNumber || '',
      database: {
        studentsCount: students.length,
        repartidoresCount: repartidores.length,
        pqrsCount: pqrs.length,
        dailyHistoryCount: dailyHistory.length,
        students,
        repartidores,
        pqrs,
        dailyHistory,
      },
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `copia_seguridad_paeat_${dateStamp}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setBackupSuccess(true);
    setTimeout(() => setBackupSuccess(false), 4000);
  };

  // Confidentiality State (Starts active by default to protect data on screen)
  const [isConfidential, setIsConfidential] = useState(() => isPrivacyModeEnabled());

  // Password Authentication Modal State (Required to reveal confidential data)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPasswordInput, setAuthPasswordInput] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Profile Edit State
  const [fullName, setFullName] = useState(activeUser?.fullName || 'Administrador PAEAT');
  const [documentNumber, setDocumentNumber] = useState(activeUser?.documentNumber || '100100100');
  const [email, setEmail] = useState(activeUser?.email || 'admin@paeat.edu.co');
  const [password, setPassword] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Rector Account State (Only editable by Administrators)
  const [rectorName, setRectorName] = useState(rectorAccount?.fullName || 'Humberto Quiroga Quiroga');
  const [rectorDoc, setRectorDoc] = useState(rectorAccount?.documentNumber || '100000001');
  const [rectorEmail, setRectorEmail] = useState(rectorAccount?.email || 'i.e.empresarial@dosquebradas.gov.co');
  const [rectorPass, setRectorPass] = useState(rectorAccount?.password || 'Rector2026');
  const [rectorSavedSuccess, setRectorSavedSuccess] = useState(false);

  React.useEffect(() => {
    if (rectorAccount) {
      setRectorName(rectorAccount.fullName || 'Humberto Quiroga Quiroga');
      setRectorDoc(rectorAccount.documentNumber || '100000001');
      setRectorEmail(rectorAccount.email || 'i.e.empresarial@dosquebradas.gov.co');
      setRectorPass(rectorAccount.password || 'Rector2026');
    }
  }, [rectorAccount]);

  React.useEffect(() => {
    if (activeUser) {
      setFullName(activeUser.fullName || '');
      setDocumentNumber(activeUser.documentNumber || '');
      setEmail(activeUser.email || 'admin@paeat.edu.co');
    }
  }, [activeUser]);

  // Resolves the expected password of the active logged in account holder (titular de la cuenta)
  const getTitularPassword = (): string => {
    if (isRectoria) {
      return rectorAccount?.password || 'Rector2026';
    }
    const foundAdmin = adminAccounts?.find(
      (a) =>
        a.documentNumber === activeUser?.documentNumber ||
        a.email?.toLowerCase() === activeUser?.email?.toLowerCase() ||
        a.id === 'admin-01'
    );
    return foundAdmin?.password || 'admin123';
  };

  // Toggle Confidential Mode
  // If confidential: requests account holder password to reveal.
  // If visible: immediately hides and locks data (no password needed to hide).
  const handleToggleConfidential = () => {
    if (isConfidential) {
      playTapSound();
      setAuthPasswordInput('');
      setAuthError('');
      setShowAuthPassword(false);
      setIsAuthModalOpen(true);
    } else {
      playTapSound();
      setIsConfidential(true);
      setPrivacyModeEnabled(true);
    }
  };

  const handleConfirmReveal = (e: React.FormEvent) => {
    e.preventDefault();
    const titularPassword = getTitularPassword();
    const entered = authPasswordInput.trim();

    if (entered && entered === titularPassword) {
      playSuccessSound();
      setIsConfidential(false);
      setPrivacyModeEnabled(false);
      setIsAuthModalOpen(false);
      setAuthPasswordInput('');
      setAuthError('');
    } else {
      playDeleteSound();
      setAuthError('Contraseña incorrecta. Solo el titular de la cuenta puede revelar los datos confidenciales.');
      setAuthPasswordInput('');
    }
  };

  const handleToggleMute = () => {
    toggleAudioMute();
  };

  const handleCategoryChange = (cat: SettingsCategory) => {
    playTapSound();
    setActiveCategory(cat);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !documentNumber.trim()) return;

    playSuccessSound();
    const updated: ActiveUserSession = {
      role: 'admin',
      fullName: fullName.trim(),
      documentNumber: documentNumber.trim(),
      email: email.trim(),
    };

    if (onUpdateActiveUser) {
      onUpdateActiveUser(updated, password.trim() || undefined);
    }

    setPassword('');
    // Re-lock to confidential mode upon saving for security
    setIsConfidential(true);
    setPrivacyModeEnabled(true);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveRectorAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rectorName.trim() || !rectorDoc.trim() || !rectorEmail.trim()) return;

    playSuccessSound();
    if (onUpdateRectorAccount) {
      onUpdateRectorAccount({
        id: rectorAccount?.id || 'admin-rectoria',
        fullName: rectorName.trim(),
        documentNumber: rectorDoc.trim(),
        email: rectorEmail.trim(),
        password: rectorPass.trim() || 'Rector2026',
        subRole: 'rectoria',
        avatarUrl: rectorAccount?.avatarUrl,
      });
    }

    // Re-lock to confidential mode upon saving
    setIsConfidential(true);
    setPrivacyModeEnabled(true);
    setRectorSavedSuccess(true);
    setTimeout(() => setRectorSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3d081b] via-[#2f0615] to-[#1e030c] flex flex-col pb-24 sm:pb-16">
      <Header showBack onBack={onBack} showSettings />

      <main className="flex-1 p-2.5 sm:p-3.5 max-w-5xl mx-auto w-full flex flex-col">
        {/* Active Session Top Bar with Direct Logout Button */}
        {activeUser && (
          <div className="bg-[#2e0513] p-2 sm:p-2.5 rounded-xl border border-amber-400/30 shadow-lg mb-2.5 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-stone-950 font-black flex items-center justify-center shadow-xs shrink-0">
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/30 flex items-center gap-0.5">
                    {isConfidential ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                    <span>{isRectoria ? '🏛️ Rectoría' : 'Administrador'}</span>
                  </span>
                  <h2 className="text-white font-black text-xs sm:text-sm truncate leading-tight">
                    {activeUser.fullName}
                  </h2>
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

            <div className="flex items-center gap-2 shrink-0">
              {/* Direct Accessible Logout Button in Top Bar */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  playDeleteSound();
                  onLogout();
                }}
                className="bg-rose-900/90 hover:bg-rose-600 text-rose-100 hover:text-white border border-rose-700/80 font-black text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-md"
                title="Cerrar la sesión actual"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2.2]" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
                <span className="sm:hidden">Salir</span>
              </motion.button>
            </div>
          </div>
        )}

        {/* Header Title */}
        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-stone-800">
          <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/50 text-amber-300 flex items-center justify-center shrink-0">
            <Sliders className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-white tracking-wide">
              Panel de Ajustes y Configuración
            </h1>
            <p className="text-stone-400 text-[11px] font-medium">
              Estructurado por secciones compactas con control estricto de confidencialidad
            </p>
          </div>
        </div>

        {/* Main Layout: Responsive Sidebar Navigation + Content Panel */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 flex-1 items-start">
          {/* Left Sidebar Menu */}
          <div className="md:col-span-4 lg:col-span-4 bg-[#2e0513] rounded-xl border border-stone-700/80 p-2 shadow-lg flex flex-col gap-1">
            <span className="text-stone-400 text-[10px] font-black uppercase tracking-wider px-2 pt-0.5 pb-0.5 block">
              Secciones del Sistema
            </span>

            {/* Tab 1: Perfil y Credenciales */}
            <button
              onClick={() => handleCategoryChange('perfil')}
              className={`flex items-center justify-between p-2 rounded-lg font-bold text-xs transition-all cursor-pointer text-left ${
                activeCategory === 'perfil'
                  ? 'bg-amber-400 text-stone-950 border border-amber-300 shadow-xs font-black'
                  : 'text-stone-300 hover:bg-[#3d081b] hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <span className="block leading-tight text-xs">
                    {isRectoria ? 'Perfil Directivo' : 'Mi Perfil & Claves'}
                  </span>
                  <span className={`text-[10px] block font-normal ${activeCategory === 'perfil' ? 'text-stone-900 font-semibold' : 'text-stone-400'}`}>
                    {isRectoria ? 'Datos del Rector' : 'Credenciales personales'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* Tab 2: Cuenta de Rectoría (Solo visible para Administradores) */}
            {!isRectoria && (
              <button
                onClick={() => handleCategoryChange('rectoria')}
                className={`flex items-center justify-between p-2 rounded-lg font-bold text-xs transition-all cursor-pointer text-left ${
                  activeCategory === 'rectoria'
                    ? 'bg-amber-400 text-stone-950 border border-amber-300 shadow-xs font-black'
                    : 'text-stone-300 hover:bg-[#3d081b] hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Landmark className="w-3.5 h-3.5 shrink-0" />
                  <div>
                    <span className="block leading-tight text-xs">Cuenta de Rectoría</span>
                    <span className={`text-[10px] block font-normal ${activeCategory === 'rectoria' ? 'text-stone-900 font-semibold' : 'text-stone-400'}`}>
                      Supervisión institucional
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            )}

            {/* Tab 3: Comunidad Escolar y Entregas */}
            <button
              onClick={() => handleCategoryChange('comunidad')}
              className={`flex items-center justify-between p-2 rounded-lg font-bold text-xs transition-all cursor-pointer text-left ${
                activeCategory === 'comunidad'
                  ? 'bg-amber-400 text-stone-950 border border-amber-300 shadow-xs font-black'
                  : 'text-stone-300 hover:bg-[#3d081b] hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <span className="block leading-tight text-xs">Estudiantes & Repartidores</span>
                  <span className={`text-[10px] block font-normal ${activeCategory === 'comunidad' ? 'text-stone-900 font-semibold' : 'text-stone-400'}`}>
                    {students.length} estudiantes registrados
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* Tab 4: Seguridad & Papelera */}
            <button
              onClick={() => handleCategoryChange('seguridad')}
              className={`flex items-center justify-between p-2 rounded-lg font-bold text-xs transition-all cursor-pointer text-left ${
                activeCategory === 'seguridad'
                  ? 'bg-amber-400 text-stone-950 border border-amber-300 shadow-xs font-black'
                  : 'text-stone-300 hover:bg-[#3d081b] hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <span className="block leading-tight text-xs">Seguridad & Papelera</span>
                  <span className={`text-[10px] block font-normal ${activeCategory === 'seguridad' ? 'text-stone-900 font-semibold' : 'text-stone-400'}`}>
                    Soft delete y privacidad
                  </span>
                </div>
              </div>
              {hiddenCount > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${activeCategory === 'seguridad' ? 'bg-stone-950 text-amber-300' : 'bg-amber-500 text-stone-950'}`}>
                  {hiddenCount}
                </span>
              )}
            </button>

            {/* Tab 5: Buzón de PQRs (y Contactos para Rectoría) */}
            <button
              onClick={() => handleCategoryChange('soporte')}
              className={`flex items-center justify-between p-2 rounded-lg font-bold text-xs transition-all cursor-pointer text-left relative ${
                activeCategory === 'soporte'
                  ? 'bg-amber-400 text-stone-950 border border-amber-300 shadow-xs font-black'
                  : 'text-stone-300 hover:bg-[#3d081b] hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <Inbox className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <span className="block leading-tight text-xs">
                    {isRectoria ? 'Buzón PQR & Ayuda' : 'Buzón de PQRs'}
                  </span>
                  <span className={`text-[10px] block font-normal ${activeCategory === 'soporte' ? 'text-stone-900 font-semibold' : 'text-stone-400'}`}>
                    {isRectoria ? 'Novedades y contactos' : 'Novedades de repartidores'}
                  </span>
                </div>
              </div>
              {pqrUnreadCount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs animate-pulse">
                  {pqrUnreadCount}
                </span>
              )}
            </button>

            {/* Sound Effects Switch */}
            <div className="pt-2 mt-0.5 border-t border-stone-800">
              <button
                onClick={handleToggleMute}
                className="w-full flex items-center justify-between p-1.5 rounded-lg bg-[#1e030c] hover:bg-[#3b0619] text-stone-300 hover:text-white border border-stone-800 text-xs font-bold transition-all cursor-pointer"
                title={muted ? 'Activar efectos de sonido' : 'Silenciar efectos de sonido'}
              >
                <div className="flex items-center gap-2">
                  {muted ? (
                    <VolumeX className="w-3.5 h-3.5 text-stone-500" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span className="text-[11px]">{muted ? 'Sonidos: Desactivados' : 'Sonidos: Activados'}</span>
                </div>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${muted ? 'bg-stone-800 text-stone-400' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                  {muted ? 'OFF' : 'ON'}
                </span>
              </button>
            </div>
          </div>

          {/* Right Content Panel */}
          <div className="md:col-span-8 lg:col-span-8 bg-[#2e0513] rounded-xl border border-stone-700/80 p-3 sm:p-3.5 shadow-lg flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* ============================================================ */}
              {/* SECCIÓN 1: PERFIL Y ACCESO */}
              {/* ============================================================ */}
              {activeCategory === 'perfil' && (
                <motion.div
                  key="perfil"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  {isRectoria ? (
                    /* Vista de Perfil para Rectoría */
                    <div className="space-y-3.5">
                      <div className="bg-[#1e030c] border border-amber-400/40 rounded-2xl p-4 shadow-xl space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 font-black flex items-center justify-center text-xl shadow-md shrink-0">
                              🏛️
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                                Acceso Directivo Oficial
                              </span>
                              <h2 className="text-white font-black text-base sm:text-lg leading-tight mt-1 truncate">
                                {activeUser?.fullName || 'Humberto Quiroga Quiroga'}
                              </h2>
                              <span className="text-stone-400 text-xs font-mono block">
                                {activeUser?.email || 'i.e.empresarial@dosquebradas.gov.co'}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black px-2.5 py-1 rounded-xl shrink-0">
                            Rector Activo
                          </span>
                        </div>

                        <div className="bg-[#2e0513] p-3.5 rounded-xl border border-stone-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400 font-bold">Cargo Directivo:</span>
                            <span className="text-white font-black">Rector Institucional</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400 font-bold">Institución Educativa:</span>
                            <span className="text-amber-300 font-black">I.E. Empresarial - Dosquebradas</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400 font-bold">Nivel de Supervisión:</span>
                            <span className="text-emerald-400 font-bold">Control & Monitoreo Global PAEAT</span>
                          </div>
                        </div>

                        <p className="text-stone-400 text-[11px] leading-relaxed">
                          ℹ️ Como Rector de la institución, usted cuenta con acceso prioritario de consulta y supervisión completa a listas de estudiantes, reportes de entrega diarios, estadísticas y buzón de PQRs.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Vista de Perfil para Administrador */
                    <div className="space-y-2.5">
                      <div>
                        <h2 className="text-sm font-black text-white flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                          <span>Mi Perfil y Credenciales de Administrador</span>
                        </h2>
                        <p className="text-stone-400 text-[11px] mt-0.5">
                          Protección confidencial de credenciales personales, cédula y correo.
                        </p>
                      </div>

                      {/* Confidentiality Status Notice */}
                      {isConfidential ? (
                        <div className="bg-[#1a0209] border border-amber-400/40 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                              <Lock className="w-3.5 h-3.5 stroke-[2.2]" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-white font-black text-xs block leading-tight">
                                Datos Protegidos en Modo Confidencial
                              </span>
                              <span className="text-stone-400 text-[10px] truncate block mt-0.5">
                                Cédula, correo y clave están ocultos con asteriscos. Se revelan exclusivamente desde la sección Seguridad con el botón de Modo Confidencial en Pantalla.
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-black px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                            Protegido
                          </span>
                        </div>
                      ) : (
                        <div className="bg-amber-950/40 border border-amber-400/60 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-black shrink-0">
                              <Unlock className="w-3.5 h-3.5 stroke-[2.5]" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-amber-300 font-black text-xs block leading-tight">
                                Modo Visible Activo (Autenticado)
                              </span>
                              <span className="text-stone-300 text-[10px] truncate block mt-0.5">
                                Sus datos están visibles para edición. Se volverán a ocultar automáticamente al guardar.
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] bg-amber-400/20 text-amber-300 font-black px-2 py-0.5 rounded border border-amber-400/40 shrink-0">
                            Visible
                          </span>
                        </div>
                      )}

                      {savedSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-emerald-950/90 border border-emerald-500/60 p-2 rounded-xl flex items-center gap-2 text-emerald-200 text-xs font-bold shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>¡Perfil actualizado y datos re-bloqueados confidencialmente con éxito!</span>
                        </motion.div>
                      )}

                      {/* Profile Edit Form */}
                      <form onSubmit={handleSaveProfile} className="bg-[#1e030c] p-3 rounded-xl border border-stone-800 space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Nombre Completo */}
                          <div>
                            <label className="block text-[10px] font-bold text-stone-300 uppercase tracking-wider mb-0.5">
                              Nombre Completo
                            </label>
                            <div className="relative">
                              <User className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                required
                                disabled={isConfidential}
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className={`w-full text-xs font-bold pl-8 pr-2.5 py-1.5 rounded-lg border transition-all ${
                                  !isConfidential
                                    ? 'bg-[#dedede] text-stone-900 border-amber-400 focus:ring-2 focus:ring-amber-400'
                                    : 'bg-[#2a0411] text-stone-300 border-stone-800 opacity-90 cursor-not-allowed'
                                }`}
                              />
                            </div>
                          </div>

                          {/* Número de Cédula */}
                          <div>
                            <label className="block text-[10px] font-bold text-stone-300 uppercase tracking-wider mb-0.5">
                              Número de Cédula
                            </label>
                            <div className="relative">
                              <Key className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                required
                                disabled={isConfidential}
                                value={isConfidential ? maskDocument(documentNumber) : documentNumber}
                                onChange={(e) => setDocumentNumber(e.target.value)}
                                className={`w-full text-xs font-bold pl-8 pr-2.5 py-1.5 rounded-lg border font-mono transition-all ${
                                  !isConfidential
                                    ? 'bg-[#dedede] text-stone-900 border-amber-400 focus:ring-2 focus:ring-amber-400'
                                    : 'bg-[#2a0411] text-stone-300 border-stone-800 opacity-90 cursor-not-allowed'
                                }`}
                              />
                            </div>
                          </div>

                          {/* Correo Electrónico */}
                          <div>
                            <label className="block text-[10px] font-bold text-stone-300 uppercase tracking-wider mb-0.5">
                              Correo Electrónico (No institucional)
                            </label>
                            <div className="relative">
                              <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                required
                                disabled={isConfidential}
                                value={isConfidential ? maskEmail(email) : email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full text-xs font-bold pl-8 pr-2.5 py-1.5 rounded-lg border transition-all ${
                                  !isConfidential
                                    ? 'bg-[#dedede] text-stone-900 border-amber-400 focus:ring-2 focus:ring-amber-400'
                                    : 'bg-[#2a0411] text-stone-300 border-stone-800 opacity-90 cursor-not-allowed'
                                }`}
                              />
                            </div>
                          </div>

                          {/* Nueva Contraseña */}
                          <div>
                            <label className="block text-[10px] font-bold text-stone-300 uppercase tracking-wider mb-0.5">
                              Nueva Contraseña (Opcional)
                            </label>
                            <div className="relative">
                              <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                disabled={isConfidential}
                                placeholder={!isConfidential ? 'Dejar en blanco para mantener actual' : '••••••••••••'}
                                value={isConfidential ? '••••••••••••' : password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full text-xs font-bold pl-8 pr-2.5 py-1.5 rounded-lg border transition-all ${
                                  !isConfidential
                                    ? 'bg-[#dedede] text-stone-900 border-amber-400 focus:ring-2 focus:ring-amber-400 placeholder-stone-500'
                                    : 'bg-[#2a0411] text-stone-300 border-stone-800 opacity-90 cursor-not-allowed placeholder-stone-600'
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {!isConfidential ? (
                          <div className="pt-1.5 flex justify-end">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="submit"
                              className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-lg py-1.5 px-4 text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Guardar Cambios de Perfil</span>
                            </motion.button>
                          </div>
                        ) : (
                          <div className="pt-1 flex items-center justify-between text-[10px] text-stone-400">
                            <span>🔒 Campos protegidos en Modo Confidencial</span>
                            <span className="text-amber-400/80 font-medium">
                              Desactivar desde sección Seguridad & Papelera
                            </span>
                          </div>
                        )}
                      </form>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ============================================================ */}
              {/* SECCIÓN 2: CUENTA DE RECTORÍA (ADMIN ONLY) */}
              {/* ============================================================ */}
              {activeCategory === 'rectoria' && !isRectoria && (
                <motion.div
                  key="rectoria"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-2.5"
                >
                  <div>
                    <h2 className="text-sm font-black text-white flex items-center gap-1.5">
                      <Landmark className="w-4 h-4 text-amber-400" />
                      <span>Gestión de Cuenta Directiva de Rectoría</span>
                    </h2>
                    <p className="text-stone-400 text-[11px] mt-0.5 leading-relaxed">
                      El Rector institucional cuenta con credenciales exclusivas de supervisión y monitoreo global del PAE.
                    </p>
                  </div>

                  {rectorSavedSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-950/90 border border-emerald-500/60 p-2 rounded-xl flex items-center gap-2 text-emerald-200 text-xs font-bold shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>¡Cuenta de Rectoría actualizada con éxito en la base de datos!</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleSaveRectorAccount} className="bg-[#1e030c] p-3 rounded-xl border border-stone-800 space-y-2.5 shadow-md">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Nombre del Rector */}
                      <div>
                        <label className="block text-[10px] font-bold text-stone-300 uppercase tracking-wider mb-0.5">
                          Nombre del Rector(a)
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isConfidential}
                          value={rectorName}
                          onChange={(e) => setRectorName(e.target.value)}
                          className={`w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border ${
                            !isConfidential
                              ? 'bg-[#dedede] text-stone-900 border-stone-400 focus:ring-2 focus:ring-amber-400'
                              : 'bg-[#2a0411] text-stone-300 border-stone-800 opacity-90 cursor-not-allowed'
                          }`}
                        />
                      </div>

                      {/* Cédula del Rector */}
                      <div>
                        <label className="block text-[10px] font-bold text-stone-300 uppercase tracking-wider mb-0.5">
                          Documento / C.C.
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isConfidential}
                          value={isConfidential ? maskDocument(rectorDoc) : rectorDoc}
                          onChange={(e) => setRectorDoc(e.target.value)}
                          className={`w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border font-mono ${
                            !isConfidential
                              ? 'bg-[#dedede] text-stone-900 border-stone-400 focus:ring-2 focus:ring-amber-400'
                              : 'bg-[#2a0411] text-stone-300 border-stone-800 opacity-90 cursor-not-allowed'
                          }`}
                        />
                      </div>

                      {/* Correo Electrónico del Rector */}
                      <div>
                        <label className="block text-[10px] font-bold text-stone-300 uppercase tracking-wider mb-0.5">
                          Correo Institucional
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isConfidential}
                          value={isConfidential ? maskEmail(rectorEmail) : rectorEmail}
                          onChange={(e) => setRectorEmail(e.target.value)}
                          className={`w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border ${
                            !isConfidential
                              ? 'bg-[#dedede] text-stone-900 border-stone-400 focus:ring-2 focus:ring-amber-400'
                              : 'bg-[#2a0411] text-stone-300 border-stone-800 opacity-90 cursor-not-allowed'
                          }`}
                        />
                      </div>

                      {/* Contraseña Oficial del Rector */}
                      <div>
                        <label className="block text-[10px] font-bold text-stone-300 uppercase tracking-wider mb-0.5">
                          Contraseña Oficial
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isConfidential}
                          value={isConfidential ? '••••••••' : rectorPass}
                          onChange={(e) => setRectorPass(e.target.value)}
                          className={`w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border font-mono ${
                            !isConfidential
                              ? 'bg-[#dedede] text-stone-900 border-stone-400 focus:ring-2 focus:ring-amber-400'
                              : 'bg-[#2a0411] text-stone-300 border-stone-800 opacity-90 cursor-not-allowed'
                          }`}
                        />
                      </div>
                    </div>

                    {!isConfidential ? (
                      <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-stone-800">
                        <span className="text-[10px] text-stone-400 font-medium">
                          🏛️ Usuario directivo: Humberto Quiroga Quiroga
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-lg py-1.5 px-4 text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Guardar Datos de Rectoría</span>
                        </motion.button>
                      </div>
                    ) : (
                      <div className="pt-1 flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-800">
                        <span>🔒 Datos confidenciales protegidos</span>
                        <span className="text-amber-400/80 font-medium">
                          Desactivar desde sección Seguridad & Papelera
                        </span>
                      </div>
                    )}
                  </form>
                </motion.div>
              )}

              {/* ============================================================ */}
              {/* SECCIÓN 3: GESTIÓN DE COMUNIDAD ESCOLAR */}
              {/* ============================================================ */}
              {activeCategory === 'comunidad' && (
                <motion.div
                  key="comunidad"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-base font-black text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-400" />
                      <span>Gestión de Estudiantes y Repartidores</span>
                    </h2>
                    <p className="text-stone-300 text-xs mt-0.5">
                      Administración central de estudiantes beneficiarios y equipo de repartidores autorizados.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Estudiantes Card */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onEditStudents}
                      className="bg-[#1e030c] hover:bg-[#3b0619] p-3 rounded-xl border border-stone-800 hover:border-amber-400/50 transition-all cursor-pointer shadow-md flex flex-col justify-between group"
                    >
                      <div>
                        <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center mb-2 group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors">
                          <User className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <h3 className="text-xs font-black text-white mb-0.5 group-hover:text-amber-300 transition-colors">
                          Editar Estudiantes
                        </h3>
                        <p className="text-stone-300 text-[11px] leading-relaxed">
                          Registrar nuevos alumnos, actualizar números de documento, grados asignados o importar masivamente desde Excel (.xlsx/.csv).
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between pt-1.5 border-t border-stone-800/80">
                        <span className="text-[10px] font-bold text-stone-400">
                          {students.length} estudiantes registrados
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-black text-amber-400">
                          <span>Gestionar</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </motion.div>

                    {/* Repartidores Card */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onEditRepartidores}
                      className="bg-[#1e030c] hover:bg-[#3b0619] p-3 rounded-xl border border-stone-800 hover:border-amber-400/50 transition-all cursor-pointer shadow-md flex flex-col justify-between group"
                    >
                      <div>
                        <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center mb-2 group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors">
                          <Truck className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <h3 className="text-xs font-black text-white mb-0.5 group-hover:text-amber-300 transition-colors">
                          Editar Repartidores
                        </h3>
                        <p className="text-stone-300 text-[11px] leading-relaxed">
                          Administrar personal de entrega, crear cuentas autorizadas, cambiar contraseñas y activar o inactivar turnos de entrega.
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between pt-1.5 border-t border-stone-800/80">
                        <span className="text-[10px] font-bold text-stone-400">
                          Equipo de Turno
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-black text-amber-400">
                          <span>Gestionar</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* ============================================================ */}
              {/* SECCIÓN 4: SEGURIDAD Y PAPELERA */}
              {/* ============================================================ */}
              {activeCategory === 'seguridad' && (
                <motion.div
                  key="seguridad"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-2.5"
                >
                  <div>
                    <h2 className="text-sm font-black text-white flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span>Seguridad y Papelera (Soft Delete)</span>
                    </h2>
                    <p className="text-stone-400 text-[11px] mt-0.5">
                      Garantía de trazabilidad inmutable, registros archivados y control de confidencialidad en pantalla.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {/* Registros Ocultos / Papelera Card */}
                    {onOpenTrash && (
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onOpenTrash}
                        className="bg-[#1e030c] hover:bg-[#3b0619] p-3 rounded-xl border border-amber-500/40 hover:border-amber-400 transition-all cursor-pointer shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 group"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                            <Archive className="w-4 h-4 stroke-[2.2]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">
                                Papelera y Registros Ocultos (Soft Delete)
                              </h3>
                              {hiddenCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-stone-950">
                                  {hiddenCount} archivados
                                </span>
                              )}
                            </div>
                            <p className="text-stone-300 text-[11px] leading-relaxed mt-0.5 max-w-xl">
                              Los registros nunca se borran físicamente: se archivan con trazabilidad para auditorías. Puede consultarlos o restaurarlos en cualquier momento.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-black text-amber-400 shrink-0 self-end sm:self-center">
                          <span>Ver Papelera</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </motion.div>
                    )}

                    {/* Modo de Privacidad en Pantalla Card */}
                    <div className="bg-[#1e030c] p-3 rounded-xl border border-stone-800 shadow-md flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
                          {isConfidential ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-black text-white">
                              Modo Confidencial en Pantalla
                            </h3>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                              isConfidential
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            }`}>
                              {isConfidential ? 'Protegido (ON)' : 'Visible (OFF)'}
                            </span>
                          </div>
                          <p className="text-stone-300 text-[11px] leading-relaxed mt-0.5">
                            Enmascara números de cédula, correos y contraseñas. <strong>Solo se puede desactivar para revelar datos ingresando la contraseña del titular.</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleToggleConfidential}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          isConfidential
                            ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 border-amber-300 shadow-md'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md'
                        }`}
                      >
                        {isConfidential ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Revelar Datos (Pide Contraseña)</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Proteger y Ocultar</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Descarga de Copia de Seguridad JSON (Exclusivo Admin - Oculto para Rectoría) */}
                    {!isRectoria && (
                      <div className="bg-[#1e030c] p-3 rounded-xl border border-amber-500/40 shadow-md space-y-2">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
                              <Download className="w-4 h-4 stroke-[2.3]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-xs font-black text-white">
                                  Copia de Seguridad Local (JSON)
                                </h3>
                                <span className="bg-amber-400/20 text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded border border-amber-400/30">
                                  Exclusivo Admin
                                </span>
                              </div>
                              <p className="text-stone-300 text-[11px] leading-relaxed mt-0.5 max-w-xl">
                                Descarga un respaldo completo e instantáneo en archivo .json con la base de datos activa ({students.length} estudiantes, {repartidores.length} repartidores y {pqrs.length} PQRs).
                              </p>
                            </div>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={handleDownloadBackup}
                            className="px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 border border-amber-300 text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md self-end sm:self-center"
                            title="Descargar respaldo local en archivo JSON"
                          >
                            <Download className="w-4 h-4 stroke-[2.5]" />
                            <span>Descargar Backup (JSON)</span>
                          </motion.button>
                        </div>

                        {backupSuccess && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-emerald-950/90 border border-emerald-500/60 p-2 rounded-lg flex items-center gap-2 text-emerald-200 text-xs font-bold"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>¡Copia de seguridad local JSON generada y descargada con éxito!</span>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ============================================================ */}
              {/* SECCIÓN 5: BUZÓN DE PQRS (Y DIRECTORIO PARA RECTORÍA) */}
              {/* ============================================================ */}
              {activeCategory === 'soporte' && (
                <motion.div
                  key="soporte"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-2.5"
                >
                  <div>
                    <h2 className="text-sm font-black text-white flex items-center gap-1.5">
                      <Inbox className="w-4 h-4 text-amber-400" />
                      <span>{isRectoria ? 'Buzón de PQRs, Canales de Atención y Directorio' : 'Buzón de PQRs y Novedades de Entrega'}</span>
                    </h2>
                    <p className="text-stone-400 text-[11px] mt-0.5">
                      {isRectoria
                        ? 'Gestione las novedades recibidas de los repartidores y acceda a los canales de soporte institucional y directorio.'
                        : 'Gestione las peticiones, reclamos y reportes de novedades remitidos en tiempo real por el equipo de repartidores.'}
                    </p>
                  </div>

                  <div className={`grid grid-cols-1 ${isRectoria ? 'sm:grid-cols-2' : ''} gap-2.5`}>
                    {/* Buzon PQR Card */}
                    {onOpenPqrInbox && (
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onOpenPqrInbox}
                        className="bg-[#1e030c] hover:bg-[#3b0619] p-3.5 rounded-xl border border-stone-800 hover:border-amber-400/50 transition-all cursor-pointer shadow-md flex flex-col justify-between group relative overflow-hidden"
                      >
                        {pqrUnreadCount > 0 && (
                          <div className="absolute top-2.5 right-2.5 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs animate-pulse">
                            {pqrUnreadCount} {pqrUnreadCount === 1 ? 'nuevo' : 'nuevos'}
                          </div>
                        )}
                        <div>
                          <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center mb-2 group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors shadow-xs">
                            <Inbox className="w-4 h-4 stroke-[2.2]" />
                          </div>
                          <h3 className="text-xs sm:text-sm font-black text-white mb-0.5 group-hover:text-amber-300 transition-colors">
                            Buzón de PQRs
                          </h3>
                          <p className="text-stone-300 text-[11px] leading-relaxed">
                            Consultar peticiones, quejas y novedades de entrega remitidas en tiempo real por los repartidores de cada sede.
                          </p>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-[11px] font-black text-amber-400 group-hover:text-amber-300">
                          <span>Abrir Bandeja PQR</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </motion.div>
                    )}

                    {/* Direct Contact Channels Screen Link - Visible Únicamente para Rectoría */}
                    {isRectoria && (
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onPqrHelp}
                        className="bg-[#1e030c] hover:bg-[#3b0619] p-3.5 rounded-xl border border-stone-800 hover:border-amber-400/50 transition-all cursor-pointer shadow-md flex flex-col justify-between group"
                      >
                        <div>
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center mb-2 group-hover:bg-emerald-500 group-hover:text-stone-950 transition-colors shadow-xs">
                            <PhoneCall className="w-4 h-4 stroke-[2.2]" />
                          </div>
                          <h3 className="text-xs sm:text-sm font-black text-white mb-0.5 group-hover:text-amber-300 transition-colors">
                            Directorio de Contactos & Ayuda
                          </h3>
                          <p className="text-stone-300 text-[11px] leading-relaxed">
                            Canales directos de soporte técnico (WhatsApp institucional y correo) y créditos de desarrollo del sistema.
                          </p>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-[11px] font-black text-amber-400 group-hover:text-amber-300">
                          <span>Ver Directorio y Créditos</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Footer Note */}
            <div className="pt-2 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-1 text-stone-400 text-[10px] font-semibold mt-2.5">
              <div className="flex items-center gap-1 flex-wrap justify-center sm:justify-start">
                <span>{APP_VERSION_LABEL} · Sistema de Alimentación Escolar</span>
              </div>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Base de Datos Conectada</span>
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* MODAL DE AUTENTICACIÓN: CONTRASEÑA DEL TITULAR DE LA CUENTA */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="bg-[#2e0513] border-2 border-amber-400/70 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-white"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setIsAuthModalOpen(false);
                  setAuthPasswordInput('');
                  setAuthError('');
                }}
                className="absolute top-4 right-4 text-stone-400 hover:text-white bg-stone-900/60 p-2 rounded-xl transition cursor-pointer"
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 font-black flex items-center justify-center shadow-lg shrink-0">
                  <Lock className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">
                    Autenticación del Titular
                  </h3>
                  <span className="text-[11px] text-amber-300 font-bold block mt-0.5">
                    Revelar datos confidenciales en pantalla
                  </span>
                </div>
              </div>

              {/* Titular Badge */}
              <div className="bg-[#1e030c] p-2.5 rounded-xl border border-stone-800 mb-3 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[10px] text-stone-400 font-bold block">
                    Titular de la sesión activa:
                  </span>
                  <span className="text-xs font-black text-white truncate block">
                    {activeUser?.fullName || 'Administrador'}
                  </span>
                </div>
                <span className="text-[10px] font-black bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/40">
                  {isRectoria ? '🏛️ Rector' : 'Administrador'}
                </span>
              </div>

              <p className="text-stone-300 text-xs leading-relaxed mb-3">
                Para proteger la confidencialidad frente a terceros o proyectores, ingrese la <strong>contraseña del titular de la cuenta</strong> para desactivar el Modo Confidencial y revelar los datos:
              </p>

              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-950/90 border border-rose-500/70 p-2.5 rounded-xl flex items-center gap-2 text-rose-200 text-xs font-bold mb-3 shadow-md"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{authError}</span>
                </motion.div>
              )}

              <form onSubmit={handleConfirmReveal} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-stone-300 uppercase tracking-wider mb-1">
                    Contraseña de la cuenta
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showAuthPassword ? 'text' : 'password'}
                      autoFocus
                      required
                      placeholder="Ingrese su contraseña..."
                      value={authPasswordInput}
                      onChange={(e) => {
                        setAuthPasswordInput(e.target.value);
                        if (authError) setAuthError('');
                      }}
                      className="w-full bg-[#dedede] text-stone-900 text-xs font-bold pl-9 pr-10 py-2.5 rounded-xl border border-stone-400 outline-hidden focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthPassword(!showAuthPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-900 transition cursor-pointer p-1"
                      title={showAuthPassword ? 'Ocultar' : 'Ver'}
                    >
                      {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setIsAuthModalOpen(false);
                      setAuthPasswordInput('');
                      setAuthError('');
                    }}
                    className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black py-2.5 rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirmar y Revelar</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
