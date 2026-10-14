/**
 * Copyright 2026
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Student, Repartidor, AdminAccount, PQRMessage, DailyHistoryRecord } from '../types';
import { INITIAL_STUDENTS, INITIAL_REPARTIDORES, INITIAL_ADMINS } from '../data/initialData';
import { INITIAL_DAILY_HISTORY } from '../data/initialHistory';

// Clean document data to prevent undefined values in Firestore
function sanitizeDoc<T extends Record<string, any>>(data: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Real-time subscription to Students collection in Firestore.
 * Automatically seeds the cloud database if initially empty.
 */
export function subscribeStudents(
  onUpdate: (students: Student[]) => void,
  onLoaded?: () => void
): Unsubscribe {
  const path = 'students';
  let isInitial = true;

  const unsubscribe = onSnapshot(
    collection(db, path),
    async (snapshot) => {
      if (snapshot.empty && isInitial) {
        isInitial = false;
        try {
          // Seed cloud database in chunks of 300 (Firestore limit is 500 per batch)
          const chunkSize = 250;
          for (let i = 0; i < INITIAL_STUDENTS.length; i += chunkSize) {
            const batch = writeBatch(db);
            const chunk = INITIAL_STUDENTS.slice(i, i + chunkSize);
            for (const s of chunk) {
              const ref = doc(db, path, s.id);
              batch.set(ref, sanitizeDoc(s));
            }
            await batch.commit();
          }
          if (onLoaded) onLoaded();
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
        return;
      }

      isInitial = false;
      const list: Student[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Student);
      });

      // Sort alphabetically by full name
      list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
      onUpdate(list);
      if (onLoaded) onLoaded();
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );

  return unsubscribe;
}

/**
 * Real-time subscription to Repartidores collection in Firestore.
 */
export function subscribeRepartidores(
  onUpdate: (repartidores: Repartidor[]) => void
): Unsubscribe {
  const path = 'repartidores';
  let isInitial = true;

  return onSnapshot(
    collection(db, path),
    async (snapshot) => {
      if (snapshot.empty && isInitial) {
        isInitial = false;
        try {
          const batch = writeBatch(db);
          for (const r of INITIAL_REPARTIDORES) {
            const ref = doc(db, path, r.id);
            batch.set(ref, sanitizeDoc(r));
          }
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
        return;
      }

      isInitial = false;
      const list: Repartidor[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Repartidor);
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Real-time subscription to Admins collection in Firestore.
 */
export function subscribeAdmins(
  onUpdate: (admins: AdminAccount[]) => void
): Unsubscribe {
  const path = 'admins';
  let isInitial = true;

  return onSnapshot(
    collection(db, path),
    async (snapshot) => {
      if (snapshot.empty && isInitial) {
        isInitial = false;
        try {
          const batch = writeBatch(db);
          for (const a of INITIAL_ADMINS) {
            const ref = doc(db, path, a.id);
            batch.set(ref, sanitizeDoc(a));
          }
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
        return;
      }

      isInitial = false;
      const list: AdminAccount[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as AdminAccount);
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Real-time subscription to PQRs collection in Firestore.
 */
export function subscribePqrs(
  onUpdate: (pqrs: PQRMessage[]) => void
): Unsubscribe {
  const path = 'pqrs';

  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: PQRMessage[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as PQRMessage);
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Real-time subscription to Daily History collection in Firestore.
 */
export function subscribeDailyHistory(
  onUpdate: (history: DailyHistoryRecord[]) => void
): Unsubscribe {
  const path = 'daily_history';
  let isInitial = true;

  return onSnapshot(
    collection(db, path),
    async (snapshot) => {
      if (snapshot.empty && isInitial) {
        isInitial = false;
        try {
          const batch = writeBatch(db);
          for (const h of INITIAL_DAILY_HISTORY) {
            const ref = doc(db, path, h.id);
            batch.set(ref, sanitizeDoc(h));
          }
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
        return;
      }

      isInitial = false;
      const list: DailyHistoryRecord[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as DailyHistoryRecord);
      });
      list.sort((a, b) => (b.dateStr || '').localeCompare(a.dateStr || ''));
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ----------------- Mutations -----------------

export async function saveStudentToCloud(student: Student): Promise<void> {
  const path = 'students';
  try {
    const ref = doc(db, path, student.id);
    await setDoc(ref, sanitizeDoc(student), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${student.id}`);
  }
}

export async function saveMultipleStudentsToCloud(students: Student[]): Promise<void> {
  const path = 'students';
  try {
    const chunkSize = 250;
    for (let i = 0; i < students.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = students.slice(i, i + chunkSize);
      for (const s of chunk) {
        const ref = doc(db, path, s.id);
        batch.set(ref, sanitizeDoc(s), { merge: true });
      }
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteStudentFromCloud(studentId: string): Promise<void> {
  const path = 'students';
  try {
    const ref = doc(db, path, studentId);
    // Soft-delete: Mark as deleted in cloud without physically destroying the record
    await setDoc(ref, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${studentId}`);
  }
}

export async function restoreStudentInCloud(studentId: string): Promise<void> {
  const path = 'students';
  try {
    const ref = doc(db, path, studentId);
    await setDoc(ref, {
      isDeleted: false,
      deletedAt: null,
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${studentId}`);
  }
}

export async function saveRepartidorToCloud(repartidor: Repartidor): Promise<void> {
  const path = 'repartidores';
  try {
    const ref = doc(db, path, repartidor.id);
    await setDoc(ref, sanitizeDoc(repartidor), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${repartidor.id}`);
  }
}

export async function saveMultipleRepartidoresToCloud(repartidores: Repartidor[]): Promise<void> {
  const path = 'repartidores';
  try {
    const chunkSize = 250;
    for (let i = 0; i < repartidores.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = repartidores.slice(i, i + chunkSize);
      for (const r of chunk) {
        const ref = doc(db, path, r.id);
        batch.set(ref, sanitizeDoc(r), { merge: true });
      }
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteRepartidorFromCloud(repartidorId: string): Promise<void> {
  const path = 'repartidores';
  try {
    const ref = doc(db, path, repartidorId);
    // Soft-delete: Mark as hidden and inactive
    await setDoc(ref, {
      isDeleted: true,
      isActive: false,
      deletedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${repartidorId}`);
  }
}

export async function restoreRepartidorInCloud(repartidorId: string): Promise<void> {
  const path = 'repartidores';
  try {
    const ref = doc(db, path, repartidorId);
    await setDoc(ref, {
      isDeleted: false,
      isActive: true,
      deletedAt: null,
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${repartidorId}`);
  }
}

export async function saveAdminToCloud(admin: AdminAccount): Promise<void> {
  const path = 'admins';
  try {
    const ref = doc(db, path, admin.id);
    await setDoc(ref, sanitizeDoc(admin), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${admin.id}`);
  }
}

export async function savePqrToCloud(pqr: PQRMessage): Promise<void> {
  const path = 'pqrs';
  try {
    const ref = doc(db, path, pqr.id);
    await setDoc(ref, sanitizeDoc(pqr), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${pqr.id}`);
  }
}

export async function deletePqrFromCloud(pqrId: string): Promise<void> {
  const path = 'pqrs';
  try {
    const ref = doc(db, path, pqrId);
    // Soft-delete: Mark as deleted/archived
    await setDoc(ref, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${pqrId}`);
  }
}

export async function restorePqrInCloud(pqrId: string): Promise<void> {
  const path = 'pqrs';
  try {
    const ref = doc(db, path, pqrId);
    await setDoc(ref, {
      isDeleted: false,
      deletedAt: null,
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${pqrId}`);
  }
}

export async function saveDailyHistoryToCloud(record: DailyHistoryRecord): Promise<void> {
  const path = 'daily_history';
  try {
    const ref = doc(db, path, record.id);
    await setDoc(ref, sanitizeDoc(record), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${record.id}`);
  }
}

export async function resetDailyDeliveriesInCloud(currentStudents: Student[]): Promise<void> {
  const path = 'students';
  try {
    const chunkSize = 250;
    for (let i = 0; i < currentStudents.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = currentStudents.slice(i, i + chunkSize);
      for (const s of chunk) {
        const ref = doc(db, path, s.id);
        batch.update(ref, {
          status: 'Pendiente',
          deliveryTimestamp: null,
          deliveredById: null,
          deliveredByName: null,
          deliveredByDoc: null,
          deliveredByRole: null,
        });
      }
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

