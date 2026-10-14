import React, { useState } from 'react';
import { Header } from '../components/Header';
import { KeyRound, ShieldCheck, Truck, Eye, EyeOff, User, Lock, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Repartidor, AdminAccount, ActiveUserSession } from '../types';
import { INITIAL_ADMINS } from '../data/initialData';
import { motion, AnimatePresence } from 'motion/react';
import { checkDriverScheduleAccess, ScheduleCheckResult, formatTime12h } from '../utils/schedule';

export type { ActiveUserSession };

interface LoginViewProps {
  role: 'admin' | 'repartidor';
  repartidores?: Repartidor[];
  admins?: AdminAccount[];
  onBack: () => void;
  onLoginSuccess: (role: 'admin' | 'repartidor', userObj?: ActiveUserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  role,
  repartidores = [],
  admins = INITIAL_ADMINS,
  onBack,
  onLoginSuccess,
}) => {
  const [documento, setDocumento] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [scheduleAlert, setScheduleAlert] = useState<ScheduleCheckResult | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleAlert(null);
    const docClean = documento.trim();
    const passClean = contrasena.trim();

    if (!docClean || !passClean) {
      setError('Por favor ingrese su usuario y contraseña');
      return;
    }

    if (role === 'admin') {
      const inputLower = docClean.toLowerCase();
      const foundAdmin = admins.find((a) => {
        if (a.isDeleted) return false;
        const matchesDoc = (a.documentNumber || '').trim() === docClean;
        const matchesEmail = (a.email || '').trim().toLowerCase() === inputLower;
        const matchesFullName = (a.fullName || '').trim().toLowerCase() === inputLower;
        const matchesAlias =
          (inputLower === 'admin' && a.subRole !== 'rectoria') ||
          ((inputLower === 'rector' || inputLower === 'rectoria') && a.subRole === 'rectoria');
        return (matchesDoc || matchesEmail || matchesFullName || matchesAlias) && a.password === passClean;
      });
      if (!foundAdmin) {
        setError('Usuario o contraseña incorrectos');
        return;
      }
      setError('');
      onLoginSuccess('admin', {
        role: 'admin',
        subRole: foundAdmin.subRole || (foundAdmin.id === 'admin-rectoria' ? 'rectoria' : 'admin'),
        fullName: foundAdmin.fullName,
        documentNumber: foundAdmin.documentNumber,
        email: foundAdmin.email,
        avatarUrl: foundAdmin.avatarUrl,
      });
      return;
    }

    // Role is repartidor: Strict exact matching by Document Number (C.C.) or Full Name
    const inputRepLower = docClean.toLowerCase();
    const foundRep = repartidores.find((r) => {
      if (r.isDeleted || r.isActive === false) return false;
      const matchesDoc = (r.documentNumber || '').trim() === docClean;
      const matchesFullName = (r.fullName || '').trim().toLowerCase() === inputRepLower;
      return matchesDoc || matchesFullName;
    });
    if (!foundRep) {
      setError('Usuario o contraseña incorrectos');
      return;
    }

    const expectedPassword = foundRep.password || 'repartidor123';
    if (passClean !== expectedPassword) {
      setError('Usuario o contraseña incorrectos');
      return;
    }

    // Schedule Restriction Check: verify if current time is within driver's shift
    const scheduleCheck = checkDriverScheduleAccess(foundRep);
    if (!scheduleCheck.allowed) {
      setError('');
      setScheduleAlert(scheduleCheck);
      return;
    }

    setError('');
    setScheduleAlert(null);
    onLoginSuccess('repartidor', {
      role: 'repartidor',
      fullName: foundRep.fullName,
      documentNumber: foundRep.documentNumber,
      avatarUrl: foundRep.avatarUrl,
      shiftStart: foundRep.shiftStart || '06:30',
      shiftEnd: foundRep.shiftEnd || '13:30',
      shiftName: foundRep.shiftName || 'Jornada Mañana',
      hasScheduleRestriction: foundRep.hasScheduleRestriction !== false,
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#3d081b] via-[#2f0615] to-[#1e030c] flex flex-col pb-16">
      <Header showBack onBack={onBack} />

      <main className="flex-1 flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 py-6 max-w-md mx-auto w-full overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full bg-[#2e0513] p-4 sm:p-5 rounded-2xl border border-stone-700/70 shadow-2xl flex flex-col items-center relative overflow-hidden"
        >
          {/* Role Badge Icon */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shadow-md ring-2 ring-amber-400/20">
              {role === 'admin' ? (
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <Truck className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>
          </div>

          <h2 className="text-white text-lg sm:text-xl font-black tracking-wide text-center">
            {role === 'admin' ? 'Acceso Rectoría' : 'Acceso Repartidor'}
          </h2>
          <p className="text-stone-300 text-[11px] sm:text-xs font-medium mt-0.5 mb-3 text-center">
            Ingrese su usuario y contraseña para acceder
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-rose-950/90 border border-rose-500/80 text-rose-200 text-xs font-bold rounded-lg p-2.5 mb-3 text-center shadow-xs flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Schedule Restriction Block Alert */}
          <AnimatePresence>
            {scheduleAlert && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full bg-gradient-to-br from-amber-950/90 via-[#3a0815] to-[#26040e] border-2 border-amber-500/80 text-white rounded-xl p-3 mb-3 shadow-xl"
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 shadow-xs">
                    <Clock className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/40">
                        Restricción de Horario
                      </span>
                    </div>
                    <h3 className="text-white text-xs sm:text-sm font-black leading-tight mt-0.5">
                      {scheduleAlert.message}
                    </h3>
                  </div>
                </div>

                <div className="bg-[#180208]/90 rounded-lg p-2 border border-amber-500/30 text-xs space-y-1.5 mb-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-400 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Horario de Turno:
                    </span>
                    <span className="text-amber-300 font-black font-mono">
                      {scheduleAlert.shiftStart} - {scheduleAlert.shiftEnd}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-400 font-bold">Días Habilitados:</span>
                    <span className="text-stone-200 font-semibold">{scheduleAlert.shiftDaysStr}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-800">
                    <span className="text-stone-400 font-bold">Hora Actual:</span>
                    <span className="text-rose-400 font-black font-mono">
                      {scheduleAlert.currentDayName}, {scheduleAlert.currentTimeStr} ({formatTime12h(scheduleAlert.currentTimeStr)})
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-[10px] text-stone-300 leading-snug">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-amber-200 font-bold">Seguridad de cuenta:</strong> Esta medida impide que otros repartidores o terceros ingresen con sus datos fuera de la jornada de entrega de refrigerios. Si necesita ingresar extraordinariamente, solicite autorización a un Administrador.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2.5">
            <div>
              <label className="text-stone-300 text-[10px] font-black uppercase tracking-wider mb-1 block">
                Usuario
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ingrese su usuario"
                  value={documento}
                  onChange={(e) => {
                    setDocumento(e.target.value);
                    if (scheduleAlert) setScheduleAlert(null);
                  }}
                  className="w-full bg-[#dedede] text-stone-900 placeholder-stone-500 rounded-lg pl-9 pr-3 py-2 text-sm font-bold outline-hidden focus:ring-2 focus:ring-amber-400 shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="text-stone-300 text-[10px] font-black uppercase tracking-wider mb-1 block">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingrese su contraseña"
                  value={contrasena}
                  onChange={(e) => {
                    setContrasena(e.target.value);
                    if (scheduleAlert) setScheduleAlert(null);
                  }}
                  className="w-full bg-[#dedede] text-stone-900 placeholder-stone-500 rounded-lg pl-9 pr-9 py-2 text-sm font-bold outline-hidden focus:ring-2 focus:ring-amber-400 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-950 transition p-1 cursor-pointer rounded-md hover:bg-stone-300/60"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 mt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black rounded-lg py-2.5 px-6 text-sm sm:text-base transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg border border-amber-300"
              >
                <KeyRound className="w-4 h-4 stroke-[2.5]" />
                <span>Ingresar al Sistema</span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
};



