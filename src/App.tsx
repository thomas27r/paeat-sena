/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UserRole,
  Student,
  Repartidor,
  AdminAccount,
  Grade,
  ScreenId,
  PQRMessage,
  DailyHistoryRecord,
} from './types';
import { INITIAL_STUDENTS, INITIAL_REPARTIDORES, INITIAL_ADMINS } from './data/initialData';
import { INITIAL_DAILY_HISTORY } from './data/initialHistory';

// Unique Tab Session ID to prevent self-echo loops in BroadcastChannel
const TAB_SESSION_ID = typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// View Imports
import { WelcomeView } from './views/WelcomeView';
import { RoleSelectView } from './views/RoleSelectView';
import { LoginView, ActiveUserSession } from './views/LoginView';
import { AdminHomeView } from './views/AdminHomeView';
import { AdminStudentListView } from './views/AdminStudentListView';
import { AdminSettingsView } from './views/AdminSettingsView';
import { ContactsView } from './views/ContactsView';
import { EditRepartidoresListView } from './views/EditRepartidoresListView';
import { RepartidorFormView } from './views/RepartidorFormView';
import { EditStudentsListView } from './views/EditStudentsListView';
import { StudentFormView } from './views/StudentFormView';
import { DeliveryStudentListView } from './views/DeliveryStudentListView';
import { GradeSelectView } from './views/GradeSelectView';
import { PqrFormView } from './views/PqrFormView';
import { PqrSentView } from './views/PqrSentView';
import { AdminPqrInboxView } from './views/AdminPqrInboxView';
import { AdminStatsView } from './views/AdminStatsView';
import { AdminHistoryView } from './views/AdminHistoryView';
import { AdminTrashView } from './views/AdminTrashView';
import { Drawer } from './components/Drawer';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Modal } from './components/Modal';
import { toTitleCase } from './utils/search';
import {
  playNavSound,
  playDeliverySuccessSound,
  playToggleOffSound,
  playSuccessSound,
  playDeleteSound,
  playNotificationSound,
} from './utils/audio';
import { testConnection } from './services/firebase';
import {
  subscribeStudents,
  subscribeRepartidores,
  subscribeAdmins,
  subscribePqrs,
  subscribeDailyHistory,
  saveStudentToCloud,
  saveMultipleStudentsToCloud,
  deleteStudentFromCloud,
  restoreStudentInCloud,
  saveRepartidorToCloud,
  saveMultipleRepartidoresToCloud,
  deleteRepartidorFromCloud,
  restoreRepartidorInCloud,
  saveAdminToCloud,
  savePqrToCloud,
  deletePqrFromCloud,
  restorePqrInCloud,
  saveDailyHistoryToCloud,
  resetDailyDeliveriesInCloud,
} from './services/dataService';

export default function App() {
  // Purge any residual local storage data on initial mount to guarantee no data is stored locally
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('paeat_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch {
      // Ignore storage cleanup errors
    }
  }, []);

  // Navigation State (in-memory state, not saved locally)
  const [activeUser, setActiveUser] = useState<ActiveUserSession | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('welcome');
  const [screenHistory, setScreenHistory] = useState<ScreenId[]>([]);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>(INITIAL_ADMINS);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleUpdateAdminProfile = (updatedUser: ActiveUserSession, newPassword?: string) => {
    setActiveUser(updatedUser);
    setAdminAccounts((prev) =>
      prev.map((adm) => {
        if (adm.documentNumber === updatedUser.documentNumber || adm.email === updatedUser.email) {
          const updatedAdm: AdminAccount = {
            ...adm,
            fullName: updatedUser.fullName,
            documentNumber: updatedUser.documentNumber,
            email: updatedUser.email || adm.email,
            avatarUrl: updatedUser.avatarUrl,
            password: newPassword && newPassword.trim() !== '' ? newPassword.trim() : adm.password,
          };
          saveAdminToCloud(updatedAdm).catch(console.error);
          return updatedAdm;
        }
        return adm;
      })
    );
    addToast('Perfil de Administrador actualizado con éxito', 'success');
  };

  const rectorAccount = adminAccounts.find(
    (a) => a.subRole === 'rectoria' || a.id === 'admin-rectoria'
  ) || {
    id: 'admin-rectoria',
    fullName: 'Humberto Quiroga Quiroga',
    documentNumber: '100000001',
    email: 'i.e.empresarial@dosquebradas.gov.co',
    password: 'Rector2026',
    subRole: 'rectoria' as const,
  };

  const handleUpdateRectorAccount = (updatedRector: AdminAccount) => {
    setAdminAccounts((prev) => {
      const exists = prev.some((a) => a.id === updatedRector.id || a.subRole === 'rectoria');
      if (exists) {
        return prev.map((a) =>
          a.id === updatedRector.id || a.subRole === 'rectoria' ? { ...a, ...updatedRector } : a
        );
      }
      return [...prev, updatedRector];
    });

    saveAdminToCloud(updatedRector).catch(console.error);

    if (activeUser?.subRole === 'rectoria') {
      setActiveUser({
        ...activeUser,
        fullName: updatedRector.fullName,
        documentNumber: updatedRector.documentNumber,
        email: updatedRector.email,
      });
    }

    addToast('Datos de la Rectoría actualizados con éxito', 'success');
  };

  // App Data States (in-memory state, not saved locally)
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [repartidores, setRepartidores] = useState<Repartidor[]>(INITIAL_REPARTIDORES);
  const [pqrs, setPqrs] = useState<PQRMessage[]>([]);
  const [dailyHistory, setDailyHistory] = useState<DailyHistoryRecord[]>(INITIAL_DAILY_HISTORY);

  // Toasts State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Helper to get today's calendar date in GMT-5 (Colombia time, UTC-5)
  const getTodayDateStrGMT5 = (): string => {
    try {
      // Intl format with America/Bogota (UTC-5)
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(new Date()); // Formats as YYYY-MM-DD
    } catch {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const gmt5 = new Date(utc - 5 * 3600000);
      const year = gmt5.getFullYear();
      const month = String(gmt5.getMonth() + 1).padStart(2, '0');
      const day = String(gmt5.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  };

  const formatJornadaDateGMT5 = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dt = new Date(year, month, day);
      return dt.toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return dateStr;
  };

  // Active filters and item selections
  const [adminFilters, setAdminFilters] = useState<{
    nombre: string;
    documento: string;
    grupo: string;
  }>({ nombre: '', documento: '', grupo: '' });

  const [selectedGradeFilter, setSelectedGradeFilter] = useState<Grade | null>(
    null
  );
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingRepartidor, setEditingRepartidor] =
    useState<Repartidor | null>(null);

  // Toast Trigger Helper
  const addToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    playNotificationSound();
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Connect to Firestore and subscribe to real-time updates across the world
  useEffect(() => {
    testConnection().catch(() => {});

    const unsubStudents = subscribeStudents((cloudStudents) => {
      if (cloudStudents && cloudStudents.length > 0) {
        setStudents(cloudStudents);
      }
    });

    const unsubRepartidores = subscribeRepartidores((cloudReps) => {
      if (cloudReps && cloudReps.length > 0) {
        setRepartidores(cloudReps);
      }
    });

    const unsubAdmins = subscribeAdmins((cloudAdmins) => {
      if (cloudAdmins && cloudAdmins.length > 0) {
        setAdminAccounts(cloudAdmins);
      }
    });

    const unsubPqrs = subscribePqrs((cloudPqrs) => {
      setPqrs(cloudPqrs || []);
    });

    const unsubHistory = subscribeDailyHistory((cloudHistory) => {
      if (cloudHistory && cloudHistory.length > 0) {
        setDailyHistory(cloudHistory);
      }
    });

    return () => {
      unsubStudents();
      unsubRepartidores();
      unsubAdmins();
      unsubPqrs();
      unsubHistory();
    };
  }, []);

  // In-memory BroadcastChannel sync across open tabs (no local storage persistence)
  useEffect(() => {
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('paeat_sync_channel');
        bc.postMessage({ type: 'SYNC_STUDENTS', payload: students, sender: TAB_SESSION_ID });
        bc.close();
      }
    } catch {
      // ignore
    }
  }, [students]);

  useEffect(() => {
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('paeat_sync_channel');
        bc.postMessage({ type: 'SYNC_REPARTIDORES', payload: repartidores, sender: TAB_SESSION_ID });
        bc.close();
      }
    } catch {
      // ignore
    }
  }, [repartidores]);

  useEffect(() => {
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('paeat_sync_channel');
        bc.postMessage({ type: 'SYNC_PQRS', payload: pqrs, sender: TAB_SESSION_ID });
        bc.close();
      }
    } catch {
      // ignore
    }
  }, [pqrs]);

  useEffect(() => {
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('paeat_sync_channel');
        bc.postMessage({ type: 'SYNC_DAILY_HISTORY', payload: dailyHistory, sender: TAB_SESSION_ID });
        bc.close();
      }
    } catch {
      // ignore
    }
  }, [dailyHistory]);

  // Real-time synchronization across browser tabs (in-memory)
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('paeat_sync_channel');
        bc.onmessage = (event) => {
          const { type, payload, sender } = event.data || {};
          // Ignore messages sent from this exact same tab to prevent loops
          if (sender === TAB_SESSION_ID) return;

          if (type === 'SYNC_STUDENTS' && Array.isArray(payload)) {
            setStudents(payload);
          } else if (type === 'SYNC_REPARTIDORES' && Array.isArray(payload)) {
            setRepartidores(payload);
          } else if (type === 'SYNC_PQRS' && Array.isArray(payload)) {
            setPqrs(payload);
          } else if (type === 'SYNC_DAILY_HISTORY' && Array.isArray(payload)) {
            setDailyHistory(payload);
          }
        };
      } catch {
        // BroadcastChannel unavailable
      }
    }

    return () => {
      if (bc) {
        bc.close();
      }
    };
  }, []);

  const lastActiveDateRef = useRef<string>(getTodayDateStrGMT5());

  // Automatic daily closing and reset check at midnight (GMT-5 / Colombia standard time)
  useEffect(() => {
    const performAutoDailyCheck = () => {
      const todayGMT5 = getTodayDateStrGMT5();
      const lastActiveDate = lastActiveDateRef.current;

      if (lastActiveDate && lastActiveDate !== todayGMT5) {
        // Build snapshot for the concluded day
        const formattedPastDate = formatJornadaDateGMT5(lastActiveDate);
        const recibidosCount = students.filter((s) => s.status === 'Recibido').length;
        const percentage =
          students.length > 0
            ? Math.round((recibidosCount / students.length) * 100)
            : 0;

        const pastSnapshot: DailyHistoryRecord = {
          id: `hist-${lastActiveDate}`,
          dateStr: lastActiveDate,
          formattedDate: `Jornada del ${formattedPastDate} (GMT-5)`,
          totalStudents: students.length,
          recibidosCount,
          pendientesCount: students.length - recibidosCount,
          percentage,
          students: students.map((s) => ({
            studentId: s.id,
            fullName: s.fullName,
            documentNumber: s.documentNumber,
            grade: s.grade,
            status: s.status,
            deliveryTimestamp: s.deliveryTimestamp,
            avatarUrl: s.avatarUrl,
          })),
        };

        setDailyHistory((prev) => [
          pastSnapshot,
          ...prev.filter((p) => p.dateStr !== lastActiveDate),
        ]);

        saveDailyHistoryToCloud(pastSnapshot).catch(console.error);

        // Reset all deliveries to 'Pendiente' for the new day
        setStudents((prev) =>
          prev.map((s) => ({
            ...s,
            status: 'Pendiente',
            deliveryTimestamp: undefined,
          }))
        );

        resetDailyDeliveriesInCloud(students).catch(console.error);

        addToast(
          `Cierre automático de jornada a las 11:59 PM (GMT-5). ¡Iniciada la jornada del ${todayGMT5}!`,
          'info'
        );

        lastActiveDateRef.current = todayGMT5;
      }
    };

    performAutoDailyCheck();

    // Check periodically to catch midnight rollover in real-time
    const interval = setInterval(performAutoDailyCheck, 15000);
    return () => clearInterval(interval);
  }, [students]);

  // Screen Navigation Helper
  const navigateTo = (screen: ScreenId) => {
    playNavSound();
    setScreenHistory((prev) => {
      // Avoid pushing duplicate consecutive screens
      if (prev.length > 0 && prev[prev.length - 1] === currentScreen) {
        return prev;
      }
      return [...prev, currentScreen];
    });
    setCurrentScreen(screen);
  };

  const handleOpenSettings = () => {
    if (userRole === 'admin') {
      navigateTo('admin_settings');
    } else if (userRole === 'repartidor') {
      setIsDrawerOpen(true);
    } else {
      navigateTo('contacts');
    }
  };

  const handleGoDashboard = () => {
    if (activeUser && (activeUser.role === 'admin' || userRole === 'admin')) {
      navigateTo('admin_home');
    } else if (activeUser && (activeUser.role === 'repartidor' || userRole === 'repartidor')) {
      navigateTo('delivery_students');
    } else {
      navigateTo('welcome');
    }
  };

  const handleBack = () => {
    // If user is at their home dashboard, stay on dashboard
    if (currentScreen === 'admin_home' && userRole === 'admin') return;
    if (currentScreen === 'delivery_students' && userRole === 'repartidor') return;

    // Filter out pre-login screens if user is currently logged in
    const preLoginScreens: ScreenId[] = ['welcome', 'role_select', 'admin_login', 'repartidor_login'];

    // Parent fallback mapping for logical screen hierarchy
    const parentMap: Partial<Record<ScreenId, ScreenId>> = {
      role_select: 'welcome',
      admin_login: 'role_select',
      repartidor_login: 'role_select',
      admin_home: 'admin_home',
      admin_student_list: 'admin_home',
      admin_settings: 'admin_home',
      contacts: userRole === 'admin' ? 'admin_settings' : 'delivery_students',
      edit_repartidores: 'admin_settings',
      edit_repartidor_detail: 'edit_repartidores',
      add_repartidor: 'edit_repartidores',
      edit_students: 'admin_settings',
      edit_student_detail: 'edit_students',
      add_student: 'edit_students',
      delivery_students: 'delivery_students',
      grade_select: 'delivery_students',
      pqr_form: 'contacts',
      pqr_sent: userRole === 'admin' ? 'admin_home' : userRole === 'repartidor' ? 'delivery_students' : 'welcome',
      admin_pqrs: 'admin_settings',
      admin_stats: 'admin_home',
      admin_history: 'admin_home',
      admin_trash: 'admin_settings',
    };

    if (screenHistory.length > 0) {
      let newHistory = [...screenHistory];
      // If logged in, strip pre-login screens from back stack
      if (userRole !== 'guest') {
        newHistory = newHistory.filter((s) => !preLoginScreens.includes(s));
      }

      let prevScreen = newHistory.pop();
      while (prevScreen && prevScreen === currentScreen && newHistory.length > 0) {
        prevScreen = newHistory.pop();
      }

      setScreenHistory(newHistory);
      if (prevScreen && prevScreen !== currentScreen) {
        setCurrentScreen(prevScreen);
      } else {
        const defaultHome = userRole === 'admin' ? 'admin_home' : userRole === 'repartidor' ? 'delivery_students' : 'welcome';
        const fallback = parentMap[currentScreen] || defaultHome;
        setCurrentScreen(fallback);
      }
    } else {
      const defaultHome = userRole === 'admin' ? 'admin_home' : userRole === 'repartidor' ? 'delivery_students' : 'welcome';
      const fallback = parentMap[currentScreen] || defaultHome;
      setCurrentScreen(fallback);
    }
  };

  const handleLogout = () => {
    setUserRole('guest');
    setActiveUser(null);
    setSelectedGradeFilter(null);
    setScreenHistory([]);
    setCurrentScreen('welcome');
    addToast('Sesión cerrada correctamente', 'info');
  };

  // Student Actions
  const handleToggleStudentStatus = (studentId: string) => {
    const targetStudent = students.find((st) => st.id === studentId);
    if (!targetStudent) return;

    // Security Check: If attempting to undo an already received delivery, only the original deliverer or an admin can undo
    if (targetStudent.status === 'Recibido') {
      const isOriginalDeliverer =
        activeUser?.role === 'admin' ||
        (activeUser?.documentNumber && targetStudent.deliveredByDoc === activeUser.documentNumber) ||
        (activeUser?.fullName && targetStudent.deliveredByName?.trim().toLowerCase() === activeUser.fullName.trim().toLowerCase());

      if (!isOriginalDeliverer) {
        playToggleOffSound();
        addToast(`No puedes anular esta entrega: solo ${targetStudent.deliveredByName || 'el repartidor que la registró'} (o un Administrador) puede anularla.`, 'warning');
        return;
      }
    }

    const nextStatus = targetStudent.status === 'Recibido' ? 'Pendiente' : 'Recibido';
    const updatedName = targetStudent.fullName.split(' ')[0];

    const deliveryRepartidorName = activeUser?.fullName || 'Repartidor Autorizado';
    const deliveryRepartidorDoc = activeUser?.documentNumber || '';
    const deliveryRepartidorRole =
      activeUser?.role === 'admin'
        ? activeUser.subRole === 'rectoria'
          ? 'Rectoría'
          : 'Administrador'
        : 'Repartidor';

    // Trigger toast & sound once outside state updater callback
    if (nextStatus === 'Recibido') {
      playDeliverySuccessSound();
      addToast(`Entrega registrada para ${updatedName} por ${deliveryRepartidorName}`, 'success');
    } else {
      playToggleOffSound();
      addToast(`Entrega anulada y marcada como Pendiente para ${updatedName}`, 'info');
    }

    const updatedStudent: Student = {
      ...targetStudent,
      status: nextStatus,
      deliveryTimestamp:
        nextStatus === 'Recibido'
          ? new Date().toLocaleString('es-CO')
          : undefined,
      deliveredById:
        nextStatus === 'Recibido'
          ? deliveryRepartidorDoc || 'rep-auth'
          : undefined,
      deliveredByName:
        nextStatus === 'Recibido'
          ? deliveryRepartidorName
          : undefined,
      deliveredByDoc:
        nextStatus === 'Recibido'
          ? deliveryRepartidorDoc
          : undefined,
      deliveredByRole:
        nextStatus === 'Recibido'
          ? deliveryRepartidorRole
          : undefined,
    };

    setStudents((prev) =>
      prev.map((st) => (st.id === studentId ? updatedStudent : st))
    );

    saveStudentToCloud(updatedStudent).catch(console.error);
  };

  const handleSaveStudent = (data: {
    id?: string;
    fullName: string;
    documentNumber: string;
    grade: Grade;
    avatarUrl?: string;
  }) => {
    playSuccessSound();
    const formattedName = toTitleCase(data.fullName.trim());
    if (data.id) {
      // Update
      const existing = students.find((st) => st.id === data.id);
      const updatedStudent: Student = {
        id: data.id,
        fullName: formattedName,
        documentNumber: data.documentNumber,
        grade: data.grade,
        status: existing?.status || 'Pendiente',
        deliveryTimestamp: existing?.deliveryTimestamp,
        avatarUrl: data.avatarUrl,
      };

      setStudents((prev) =>
        prev.map((st) => (st.id === data.id ? updatedStudent : st))
      );
      saveStudentToCloud(updatedStudent).catch(console.error);
      addToast('Estudiante actualizado correctamente', 'success');
    } else {
      // Create
      const newStudent: Student = {
        id: `st-${Date.now()}`,
        fullName: formattedName,
        documentNumber: data.documentNumber,
        grade: data.grade,
        status: 'Pendiente',
        avatarUrl: data.avatarUrl,
      };
      setStudents((prev) => [newStudent, ...prev]);
      saveStudentToCloud(newStudent).catch(console.error);
      addToast('Nuevo estudiante creado', 'success');
    }
    navigateTo('edit_students');
  };

  const handleDeleteStudent = (id: string) => {
    playDeleteSound();
    // Soft-delete: Hide student from active list while preserving in database
    setStudents((prev) =>
      prev.map((st) =>
        st.id === id
          ? { ...st, isDeleted: true, deletedAt: new Date().toISOString() }
          : st
      )
    );
    deleteStudentFromCloud(id).catch(console.error);
    addToast('Estudiante archivado y ocultado (permanece protegido en base de datos)', 'info');
    navigateTo('edit_students');
  };

  const handleRestoreStudent = (id: string) => {
    playSuccessSound();
    setStudents((prev) =>
      prev.map((st) =>
        st.id === id
          ? { ...st, isDeleted: false, deletedAt: undefined }
          : st
      )
    );
    restoreStudentInCloud(id).catch(console.error);
    addToast('Estudiante restaurado y reactivado con éxito', 'success');
  };

  // Import students in batch from Excel
  const handleImportStudents = (newStudents: Student[], mode: 'append' | 'replace' = 'append') => {
    playSuccessSound();
    const formattedNewStudents = newStudents.map((st) => ({
      ...st,
      fullName: toTitleCase(st.fullName),
    }));

    if (mode === 'replace') {
      setStudents(formattedNewStudents);
      saveMultipleStudentsToCloud(formattedNewStudents).catch(console.error);
      addToast(`Se importaron ${formattedNewStudents.length} estudiantes desde Excel`, 'success');
    } else {
      let finalBatch: Student[] = [];
      setStudents((prev) => {
        const existingMap = new Map<string, Student>();
        prev.forEach((s) => existingMap.set(s.documentNumber, s));

        formattedNewStudents.forEach((newSt) => {
          if (existingMap.has(newSt.documentNumber)) {
            const existing = existingMap.get(newSt.documentNumber)!;
            existingMap.set(newSt.documentNumber, {
              ...existing,
              fullName: newSt.fullName,
              grade: newSt.grade,
              isDeleted: false, // Reactivate if re-imported
            });
          } else {
            existingMap.set(newSt.documentNumber, newSt);
          }
        });

        finalBatch = Array.from(existingMap.values());
        return finalBatch;
      });
      saveMultipleStudentsToCloud(formattedNewStudents).catch(console.error);
      addToast(`Se importaron estudiantes desde Excel (${formattedNewStudents.length} registros)`, 'success');
    }
  };

  // Import repartidores in batch from Excel
  const handleImportRepartidores = (newRepartidores: Repartidor[], mode: 'append' | 'replace' = 'append') => {
    playSuccessSound();
    const formattedNewReps = newRepartidores.map((rep) => ({
      ...rep,
      fullName: toTitleCase(rep.fullName),
    }));

    if (mode === 'replace') {
      setRepartidores(formattedNewReps);
      saveMultipleRepartidoresToCloud(formattedNewReps).catch(console.error);
      addToast(`Se importaron ${formattedNewReps.length} repartidores desde Excel`, 'success');
    } else {
      let finalBatch: Repartidor[] = [];
      setRepartidores((prev) => {
        const existingMap = new Map<string, Repartidor>();
        prev.forEach((r) => existingMap.set(r.documentNumber, r));

        formattedNewReps.forEach((newRep) => {
          if (existingMap.has(newRep.documentNumber)) {
            const existing = existingMap.get(newRep.documentNumber)!;
            existingMap.set(newRep.documentNumber, {
              ...existing,
              fullName: newRep.fullName,
              password: newRep.password || existing.password,
              isActive: true,
              isDeleted: false,
              hasScheduleRestriction: existing.hasScheduleRestriction ?? true,
              shiftStart: existing.shiftStart || '06:00',
              shiftEnd: existing.shiftEnd || '12:00',
              shiftName: existing.shiftName || 'Jornada Mañana',
              shiftDays: existing.shiftDays || [1, 2, 3, 4, 5],
            });
          } else {
            existingMap.set(newRep.documentNumber, {
              ...newRep,
              hasScheduleRestriction: newRep.hasScheduleRestriction ?? true,
              shiftStart: newRep.shiftStart || '06:00',
              shiftEnd: newRep.shiftEnd || '12:00',
              shiftName: newRep.shiftName || 'Jornada Mañana',
              shiftDays: newRep.shiftDays || [1, 2, 3, 4, 5],
            });
          }
        });

        finalBatch = Array.from(existingMap.values());
        return finalBatch;
      });
      saveMultipleRepartidoresToCloud(formattedNewReps).catch(console.error);
      addToast(`Se importaron repartidores desde Excel (${formattedNewReps.length} registros)`, 'success');
    }
  };

  // Repartidor Actions
  const handleSaveRepartidor = (data: {
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
  }) => {
    if (data.id) {
      const existing = repartidores.find((r) => r.id === data.id);
      const updatedRepartidor: Repartidor = {
        id: data.id,
        fullName: data.fullName,
        documentNumber: data.documentNumber,
        avatarUrl: data.avatarUrl,
        password: data.password || existing?.password || 'repartidor123',
        isActive: existing?.isActive ?? true,
        hasScheduleRestriction: data.hasScheduleRestriction ?? existing?.hasScheduleRestriction ?? true,
        shiftStart: data.shiftStart || existing?.shiftStart || '06:00',
        shiftEnd: data.shiftEnd || existing?.shiftEnd || '12:00',
        shiftName: data.shiftName || existing?.shiftName || 'Jornada Mañana',
        shiftDays: data.shiftDays || existing?.shiftDays || [1, 2, 3, 4, 5],
      };
      setRepartidores((prev) =>
        prev.map((r) => (r.id === data.id ? updatedRepartidor : r))
      );
      saveRepartidorToCloud(updatedRepartidor).catch(console.error);
      addToast('Repartidor y turno actualizados correctamente', 'success');
    } else {
      const newRepartidor: Repartidor = {
        id: `rep-${Date.now()}`,
        fullName: data.fullName,
        documentNumber: data.documentNumber,
        avatarUrl: data.avatarUrl,
        password: data.password || 'repartidor123',
        isActive: true,
        hasScheduleRestriction: data.hasScheduleRestriction ?? true,
        shiftStart: data.shiftStart || '06:00',
        shiftEnd: data.shiftEnd || '12:00',
        shiftName: data.shiftName || 'Jornada Mañana',
        shiftDays: data.shiftDays || [1, 2, 3, 4, 5],
      };
      setRepartidores((prev) => [newRepartidor, ...prev]);
      saveRepartidorToCloud(newRepartidor).catch(console.error);
      addToast('Nuevo repartidor registrado con turno de horario', 'success');
    }
    navigateTo('edit_repartidores');
  };

  const handleDeleteRepartidor = (id: string) => {
    // Soft-delete: Mark as inactive and hidden
    setRepartidores((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, isDeleted: true, isActive: false, deletedAt: new Date().toISOString() }
          : r
      )
    );
    deleteRepartidorFromCloud(id).catch(console.error);
    addToast('Repartidor ocultado e inactivado (permanece protegido en base de datos)', 'info');
    navigateTo('edit_repartidores');
  };

  const handleRestoreRepartidor = (id: string) => {
    playSuccessSound();
    setRepartidores((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, isDeleted: false, isActive: true, deletedAt: undefined }
          : r
      )
    );
    restoreRepartidorInCloud(id).catch(console.error);
    addToast('Repartidor restaurado y reactivado con éxito', 'success');
  };

  // PQR Action
  const handleSendPqr = (
    messageText: string,
    titularData?: { name: string; document: string; role: string }
  ) => {
    const senderName = titularData?.name || activeUser?.fullName || 'Repartidor Autorizado';
    const senderDoc = titularData?.document || activeUser?.documentNumber || '1140065531';
    const senderRole = titularData?.role || (activeUser?.role === 'admin' ? 'Administrador' : 'Repartidor');
    const fallbackEmail = `${senderName.toLowerCase().replace(/\s+/g, '.')}@paeat.edu.co`;

    const newPqr: PQRMessage = {
      id: `pqr-${Date.now()}`,
      email: fallbackEmail,
      senderName,
      senderDoc,
      senderRole,
      message: messageText,
      createdAt: new Date().toISOString(),
      status: 'enviado',
    };
    setPqrs((prev) => [newPqr, ...prev]);
    savePqrToCloud(newPqr).catch(console.error);
    addToast('Reporte PQR registrado con éxito', 'success');

    // Automatically redirect without requiring manual clicks
    if (userRole === 'admin') {
      navigateTo('admin_pqrs');
    } else {
      navigateTo('delivery_students');
    }
  };

  const handleTogglePqrStatus = (pqrId: string) => {
    const target = pqrs.find((p) => p.id === pqrId);
    if (!target) return;
    const nextStatus = target.status === 'leido' ? 'enviado' : 'leido';
    if (nextStatus === 'leido') {
      addToast('PQR marcado como Atendido', 'success');
    } else {
      addToast('PQR marcado como Pendiente', 'info');
    }
    const updated: PQRMessage = { ...target, status: nextStatus };
    setPqrs((prev) => prev.map((p) => (p.id === pqrId ? updated : p)));
    savePqrToCloud(updated).catch(console.error);
  };

  const handleDeletePqr = (pqrId: string) => {
    // Soft-delete PQR: Mark as deleted/archived without destroying it
    setPqrs((prev) =>
      prev.map((p) =>
        p.id === pqrId
          ? { ...p, isDeleted: true, deletedAt: new Date().toISOString() }
          : p
      )
    );
    deletePqrFromCloud(pqrId).catch(console.error);
    addToast('Reporte PQR archivado/ocultado (permanece protegido en base de datos)', 'info');
  };

  const handleRestorePqr = (pqrId: string) => {
    playSuccessSound();
    setPqrs((prev) =>
      prev.map((p) =>
        p.id === pqrId
          ? { ...p, isDeleted: false, deletedAt: undefined }
          : p
      )
    );
    restorePqrInCloud(pqrId).catch(console.error);
    addToast('PQR restaurado a la bandeja con éxito', 'success');
  };

  // Active (non-deleted) data sets for all operational screens
  const activeStudents = students.filter((s) => !s.isDeleted);
  const activeRepartidores = repartidores.filter((r) => !r.isDeleted);
  const activePqrs = pqrs.filter((p) => !p.isDeleted);

  // Hidden (soft-deleted) records for audit and restoration
  const hiddenStudents = students.filter((s) => s.isDeleted);
  const hiddenRepartidores = repartidores.filter((r) => r.isDeleted);
  const hiddenPqrs = pqrs.filter((p) => p.isDeleted);
  const totalHiddenCount = hiddenStudents.length + hiddenRepartidores.length + hiddenPqrs.length;

  const unreadPqrCount = activePqrs.filter((p) => p.status === 'enviado').length;

  return (
    <div className="min-h-screen bg-[#3d081b] text-stone-900 font-sans antialiased select-none">
      {/* Toast Notifications Overlay */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Side Drawer for Repartidor Menu (Screen 16) */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentRepartidorName={activeUser?.fullName}
        currentRepartidorDoc={activeUser?.documentNumber}
        userRole={activeUser?.role || userRole}
        onToast={addToast}
        onNavigate={(target) => {
          if (target === 'logout') {
            handleLogout();
          } else {
            navigateTo(target);
          }
        }}
      />

      {/* Screen 1: Welcome Splash */}
      {currentScreen === 'welcome' && (
        <WelcomeView onEnter={() => navigateTo('role_select')} />
      )}

      {/* Screen 2: Role Selection */}
      {currentScreen === 'role_select' && (
        <RoleSelectView
          onBack={handleBack}
          onSelectRole={(role) => {
            setUserRole(role);
            if (role === 'admin') {
              navigateTo('admin_login');
            } else {
              navigateTo('repartidor_login');
            }
          }}
        />
      )}

      {/* Screen 3: Admin Login */}
      {currentScreen === 'admin_login' && (
        <LoginView
          role="admin"
          admins={adminAccounts}
          onBack={handleBack}
          onLoginSuccess={(role, userObj) => {
            setUserRole('admin');
            if (userObj) setActiveUser(userObj);
            setScreenHistory([]);
            addToast(`Bienvenido, ${userObj?.fullName || 'Administrador'}`, 'success');
            setCurrentScreen('admin_home');
          }}
        />
      )}

      {/* Screen 4: Repartidor Login */}
      {currentScreen === 'repartidor_login' && (
        <LoginView
          role="repartidor"
          repartidores={activeRepartidores}
          onBack={handleBack}
          onLoginSuccess={(role, userObj) => {
            setUserRole('repartidor');
            if (userObj) setActiveUser(userObj);
            setScreenHistory([]);
            addToast(`Bienvenido, ${userObj?.fullName || 'Repartidor'}`, 'success');
            setCurrentScreen('delivery_students');
          }}
        />
      )}

      {/* Screen 5: Admin Home / Dashboard */}
      {currentScreen === 'admin_home' && (
        <AdminHomeView
          students={activeStudents}
          activeUser={activeUser}
          onOpenSettings={() => navigateTo('admin_settings')}
          onGoToStats={() => navigateTo('admin_stats')}
          onGoToHistory={() => navigateTo('admin_history')}
          onGoHome={handleGoDashboard}
          onGoToStudentList={(filters) => {
            setAdminFilters(filters);
            navigateTo('admin_student_list');
          }}
        />
      )}

      {/* Admin Statistics View */}
      {currentScreen === 'admin_stats' && (
        <AdminStatsView
          students={activeStudents}
          onBack={handleBack}
          onOpenSettings={() => navigateTo('admin_settings')}
          onGoHome={handleGoDashboard}
        />
      )}

      {/* Admin Daily History View */}
      {currentScreen === 'admin_history' && (
        <AdminHistoryView
          historyRecords={dailyHistory}
          currentStudents={activeStudents}
          onBack={handleBack}
          onOpenSettings={() => navigateTo('admin_settings')}
          onGoHome={handleGoDashboard}
        />
      )}

      {/* Screen 6: Admin Student List */}
      {currentScreen === 'admin_student_list' && (
        <AdminStudentListView
          students={activeStudents}
          initialFilters={adminFilters}
          onBack={handleBack}
          onOpenSettings={() => navigateTo('admin_settings')}
        />
      )}

      {/* Screen 7: Admin Settings */}
      {currentScreen === 'admin_settings' && (
        <AdminSettingsView
          onBack={handleBack}
          activeUser={activeUser}
          adminAccounts={adminAccounts}
          onUpdateActiveUser={handleUpdateAdminProfile}
          rectorAccount={rectorAccount}
          onUpdateRectorAccount={handleUpdateRectorAccount}
          onEditStudents={() => navigateTo('edit_students')}
          onEditRepartidores={() => navigateTo('edit_repartidores')}
          onPqrHelp={() => navigateTo('contacts')}
          onOpenPqrInbox={() => navigateTo('admin_pqrs')}
          onOpenHistory={() => navigateTo('admin_history')}
          onOpenTrash={() => navigateTo('admin_trash')}
          hiddenCount={totalHiddenCount}
          pqrUnreadCount={unreadPqrCount}
          students={activeStudents}
          repartidores={activeRepartidores}
          pqrs={activePqrs}
          dailyHistory={dailyHistory}
          onImportStudents={handleImportStudents}
          onLogout={handleLogout}
        />
      )}

      {/* Admin Trash & Soft-Deleted Records View */}
      {currentScreen === 'admin_trash' && (
        <AdminTrashView
          hiddenStudents={hiddenStudents}
          hiddenRepartidores={hiddenRepartidores}
          hiddenPqrs={hiddenPqrs}
          onRestoreStudent={handleRestoreStudent}
          onRestoreRepartidor={handleRestoreRepartidor}
          onRestorePqr={handleRestorePqr}
          onBack={handleBack}
          onGoHome={handleGoDashboard}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {/* Admin PQR Inbox */}
      {currentScreen === 'admin_pqrs' && (
        <AdminPqrInboxView
          pqrs={activePqrs}
          onBack={handleBack}
          onToggleStatus={handleTogglePqrStatus}
          onDeletePqr={handleDeletePqr}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {/* Screen 8: Contacts / Help */}
      {currentScreen === 'contacts' && (
        <ContactsView
          onBack={handleBack}
          userRole={userRole}
          onOpenPqrForm={() => navigateTo('pqr_form')}
          onOpenPqrInbox={() => navigateTo('admin_pqrs')}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {/* Screen 9: Edit Repartidores List */}
      {currentScreen === 'edit_repartidores' && (
        <EditRepartidoresListView
          repartidores={activeRepartidores}
          onBack={handleBack}
          onGoHome={handleGoDashboard}
          onEditRepartidor={(rep) => {
            setEditingRepartidor(rep);
            navigateTo('edit_repartidor_detail');
          }}
          onAddRepartidor={() => {
            setEditingRepartidor(null);
            navigateTo('add_repartidor');
          }}
          onDeleteRepartidor={handleDeleteRepartidor}
          onImportRepartidores={handleImportRepartidores}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {/* Screen 10 & 11: Edit/Add Repartidor Detail */}
      {(currentScreen === 'edit_repartidor_detail' ||
        currentScreen === 'add_repartidor') && (
        <RepartidorFormView
          repartidorToEdit={editingRepartidor}
          onBack={handleBack}
          onGoHome={handleGoDashboard}
          onSave={handleSaveRepartidor}
          onDelete={handleDeleteRepartidor}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {/* Screen 12: Edit Students List */}
      {currentScreen === 'edit_students' && (
        <EditStudentsListView
          students={activeStudents}
          onBack={handleBack}
          onEditStudent={(st) => {
            setEditingStudent(st);
            navigateTo('edit_student_detail');
          }}
          onAddStudent={() => {
            setEditingStudent(null);
            navigateTo('add_student');
          }}
          onDeleteStudent={handleDeleteStudent}
          onImportStudents={handleImportStudents}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {/* Screen 13 & 14: Edit/Add Student Detail */}
      {(currentScreen === 'edit_student_detail' ||
        currentScreen === 'add_student') && (
        <StudentFormView
          studentToEdit={editingStudent}
          onBack={handleBack}
          onSave={handleSaveStudent}
          onDelete={handleDeleteStudent}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {/* Screen 15 & 18: Delivery Student List (Repartidor view) */}
      {currentScreen === 'delivery_students' && (
        <DeliveryStudentListView
          students={activeStudents}
          activeUser={activeUser}
          selectedGradeFilter={selectedGradeFilter}
          onOpenMenu={() => setIsDrawerOpen(true)}
          onOpenGradeSelect={() => navigateTo('grade_select')}
          onSelectGrade={(grade) => setSelectedGradeFilter(grade)}
          onToggleStatus={handleToggleStudentStatus}
          onClearGradeFilter={() => setSelectedGradeFilter(null)}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {/* Screen 17: Grade Selection */}
      {currentScreen === 'grade_select' && (
        <GradeSelectView
          students={activeStudents}
          onBack={handleBack}
          onSelectGrade={(grade) => {
            setSelectedGradeFilter(grade);
            navigateTo('delivery_students');
          }}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {/* Screen 19: PQR Form */}
      {currentScreen === 'pqr_form' && (
        <PqrFormView
          activeUser={activeUser}
          onBack={handleBack}
          onSend={handleSendPqr}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {/* Screen 20: PQR Sent */}
      {currentScreen === 'pqr_sent' && (
        <PqrSentView
          onBack={() => {
            if (userRole === 'admin') {
              navigateTo('admin_home');
            } else if (userRole === 'repartidor') {
              navigateTo('delivery_students');
            } else {
              navigateTo('welcome');
            }
          }}
        />
      )}
    </div>
  );
}
