export type UserRole = 'guest' | 'admin' | 'repartidor';

export type Grade = '5' | '6' | '7' | '8' | '9' | '10' | '11';

export type DeliveryStatus = 'Recibido' | 'Pendiente';

export interface Student {
  id: string;
  fullName: string;
  documentNumber: string;
  grade: Grade;
  status: DeliveryStatus;
  deliveryTimestamp?: string;
  deliveredById?: string;
  deliveredByName?: string;
  deliveredByDoc?: string;
  deliveredByRole?: string;
  avatarUrl?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface AdminAccount {
  id: string;
  fullName: string;
  documentNumber: string;
  email: string;
  password: string;
  avatarUrl?: string;
  subRole?: 'admin' | 'rectoria';
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface Repartidor {
  id: string;
  fullName: string;
  documentNumber: string;
  avatarUrl?: string;
  password?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  // Shift & Access Schedule Restrictions
  hasScheduleRestriction?: boolean;
  shiftStart?: string; // "06:30"
  shiftEnd?: string;   // "13:30"
  shiftName?: string;  // e.g. "Jornada Mañana"
  shiftDays?: number[]; // [1, 2, 3, 4, 5]
}

export interface ActiveUserSession {
  role: 'admin' | 'repartidor';
  subRole?: 'admin' | 'rectoria';
  fullName: string;
  documentNumber: string;
  avatarUrl?: string;
  email?: string;
  assignedGrades?: string[];
  shiftStart?: string;
  shiftEnd?: string;
  shiftName?: string;
  hasScheduleRestriction?: boolean;
}

export interface PQRMessage {
  id: string;
  email: string;
  senderName?: string;
  senderDoc?: string;
  senderRole?: string;
  message: string;
  createdAt: string;
  status: 'enviado' | 'leido';
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface DailyStudentSnapshot {
  studentId: string;
  fullName: string;
  documentNumber: string;
  grade: Grade;
  status: DeliveryStatus;
  deliveryTimestamp?: string;
  deliveredById?: string;
  deliveredByName?: string;
  deliveredByDoc?: string;
  deliveredByRole?: string;
  avatarUrl?: string;
}

export interface DailyHistoryRecord {
  id: string;
  dateStr: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "28 de Julio, 2026"
  totalStudents: number;
  recibidosCount: number;
  pendientesCount: number;
  percentage: number;
  students: DailyStudentSnapshot[];
}

export type ScreenId =
  | 'welcome'           // Screen 1
  | 'role_select'       // Screen 2
  | 'admin_login'       // Screen 3
  | 'repartidor_login'  // Screen 4
  | 'admin_home'        // Screen 5
  | 'admin_student_list'// Screen 6
  | 'admin_settings'    // Screen 7
  | 'contacts'          // Screen 8
  | 'edit_repartidores' // Screen 9
  | 'edit_repartidor_detail' // Screen 10
  | 'add_repartidor'    // Screen 11
  | 'edit_students'     // Screen 12
  | 'edit_student_detail'  // Screen 13
  | 'add_student'       // Screen 14
  | 'delivery_students' // Screen 15 / 18
  | 'grade_select'      // Screen 17
  | 'pqr_form'          // Screen 19
  | 'pqr_sent'          // Screen 20
  | 'admin_pqrs'        // Admin PQR Inbox
  | 'admin_stats'       // Admin Stats View
  | 'admin_history'     // Admin Daily History View
  | 'admin_trash';      // Admin Soft-Deleted / Hidden Records View
