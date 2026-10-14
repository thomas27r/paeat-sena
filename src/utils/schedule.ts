import { Repartidor } from '../types';

export interface ShiftPreset {
  id: string;
  name: string;
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
  days: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  description: string;
}

export const SHIFT_PRESETS: ShiftPreset[] = [
  {
    id: 'manana',
    name: 'Jornada Mañana',
    start: '06:00',
    end: '12:00',
    days: [1, 2, 3, 4, 5],
    description: 'Horario matutino de entrega de refrigerios (06:00 a 12:00, Lun a Vie)',
  },
  {
    id: 'tarde',
    name: 'Jornada Tarde',
    start: '12:30',
    end: '18:30',
    days: [1, 2, 3, 4, 5],
    description: 'Horario vespertino de entrega de refrigerios (12:30 a 18:30, Lun a Vie)',
  },
  {
    id: 'completa',
    name: 'Jornada Completa',
    start: '06:00',
    end: '18:30',
    days: [1, 2, 3, 4, 5],
    description: 'Jornada completa continua (06:00 a 18:30, Lun a Vie)',
  },
  {
    id: 'libre',
    name: 'Sin Restricción (24h)',
    start: '00:00',
    end: '23:59',
    days: [0, 1, 2, 3, 4, 5, 6],
    description: 'Acceso habilitado en cualquier momento las 24 horas todos los días',
  },
];

export const DAY_NAMES: { [key: number]: string } = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

export const SHORT_DAY_NAMES: { [key: number]: string } = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
};

export interface ScheduleCheckResult {
  allowed: boolean;
  status: 'active' | 'outside_hours' | 'wrong_day' | 'inactive_account';
  message: string;
  detail: string;
  currentTimeStr: string;
  currentDayName: string;
  shiftStart: string;
  shiftEnd: string;
  shiftName: string;
  shiftDaysStr: string;
}

/**
 * Converts a 24-hour time string ("HH:mm") into total minutes from midnight.
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

/**
 * Formats a 24h string into 12h with AM/PM for user-friendly display.
 */
export function formatTime12h(time24: string): string {
  if (!time24) return '--:--';
  const [h, m] = time24.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minStr = m < 10 ? `0${m}` : `${m}`;
  return `${hour12}:${minStr} ${period}`;
}

/**
 * Returns a human-friendly string for the array of permitted days.
 */
export function formatDaysOfWeek(days?: number[]): string {
  if (!days || days.length === 0) return 'Lunes a Viernes';
  if (days.length === 7) return 'Todos los días';
  if (
    days.length === 5 &&
    [1, 2, 3, 4, 5].every((d) => days.includes(d))
  ) {
    return 'Lunes a Viernes';
  }
  if (
    days.length === 6 &&
    [1, 2, 3, 4, 5, 6].every((d) => days.includes(d))
  ) {
    return 'Lunes a Sábado';
  }
  return days.map((d) => SHORT_DAY_NAMES[d] || `${d}`).join(', ');
}

/**
 * Checks whether a given repartidor is currently permitted to access their account
 * based on their configured shift times and permitted days.
 */
export function checkDriverScheduleAccess(
  repartidor: Partial<Repartidor>,
  referenceDate: Date = new Date()
): ScheduleCheckResult {
  const currentHours = referenceDate.getHours();
  const currentMinutes = referenceDate.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  const currentDayOfWeek = referenceDate.getDay(); // 0 = Sunday, 1 = Monday...

  const currentTimeStr = `${currentHours < 10 ? '0' : ''}${currentHours}:${
    currentMinutes < 10 ? '0' : ''
  }${currentMinutes}`;
  const currentDayName = DAY_NAMES[currentDayOfWeek] || 'Hoy';

  // Check if account is inactive
  if (repartidor.isActive === false) {
    return {
      allowed: false,
      status: 'inactive_account',
      message: 'Cuenta de repartidor inactiva',
      detail: 'Esta cuenta ha sido desactivada temporalmente por el Administrador.',
      currentTimeStr,
      currentDayName,
      shiftStart: repartidor.shiftStart || '06:00',
      shiftEnd: repartidor.shiftEnd || '12:00',
      shiftName: repartidor.shiftName || 'Turno no asignado',
      shiftDaysStr: formatDaysOfWeek(repartidor.shiftDays),
    };
  }

  // If schedule restriction is explicitly disabled, allow anytime
  if (repartidor.hasScheduleRestriction === false) {
    return {
      allowed: true,
      status: 'active',
      message: 'Acceso permitido (Sin restricción de horario)',
      detail: 'Esta cuenta tiene autorización permanente de acceso.',
      currentTimeStr,
      currentDayName,
      shiftStart: '00:00',
      shiftEnd: '23:59',
      shiftName: 'Acceso 24 Horas',
      shiftDaysStr: 'Todos los días',
    };
  }

  const shiftStart = repartidor.shiftStart || '06:00';
  const shiftEnd = repartidor.shiftEnd || '12:00';
  const shiftDays = repartidor.shiftDays && repartidor.shiftDays.length > 0
    ? repartidor.shiftDays
    : [1, 2, 3, 4, 5]; // Default Mon to Fri
  const shiftName = repartidor.shiftName || 'Jornada Mañana';
  const shiftDaysStr = formatDaysOfWeek(shiftDays);

  // 1. Day of week check
  if (!shiftDays.includes(currentDayOfWeek)) {
    return {
      allowed: false,
      status: 'wrong_day',
      message: 'Acceso no disponible en este día',
      detail: `Hoy es ${currentDayName}, y su turno laboral está programado exclusivamente para: ${shiftDaysStr}.`,
      currentTimeStr,
      currentDayName,
      shiftStart,
      shiftEnd,
      shiftName,
      shiftDaysStr,
    };
  }

  // 2. Hours check
  const startMin = timeToMinutes(shiftStart);
  const endMin = timeToMinutes(shiftEnd);

  let isWithinHours = false;
  if (startMin <= endMin) {
    // Normal daytime shift (e.g. 06:30 to 13:30)
    isWithinHours = currentTotalMinutes >= startMin && currentTotalMinutes <= endMin;
  } else {
    // Overnight shift crossing midnight (e.g. 22:00 to 06:00)
    isWithinHours = currentTotalMinutes >= startMin || currentTotalMinutes <= endMin;
  }

  if (!isWithinHours) {
    const formattedRange = `${formatTime12h(shiftStart)} a ${formatTime12h(shiftEnd)} (${shiftStart} - ${shiftEnd})`;
    return {
      allowed: false,
      status: 'outside_hours',
      message: 'Fuera del horario de turno autorizado',
      detail: `Su horario de acceso asignado es de ${formattedRange}. La hora actual es ${currentTimeStr} (${formatTime12h(currentTimeStr)}).`,
      currentTimeStr,
      currentDayName,
      shiftStart,
      shiftEnd,
      shiftName,
      shiftDaysStr,
    };
  }

  return {
    allowed: true,
    status: 'active',
    message: 'Turno activo',
    detail: `Acceso autorizado dentro de su horario (${shiftStart} - ${shiftEnd}).`,
    currentTimeStr,
    currentDayName,
    shiftStart,
    shiftEnd,
    shiftName,
    shiftDaysStr,
  };
}
