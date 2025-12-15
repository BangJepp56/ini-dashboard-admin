export type PatientStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Completed'
  | 'Cancelled'
  | 'Terjadwal'
  | 'Dalam Antrian'
  | 'Selesai'
  | 'Dibatalkan';

export interface PatientRegistration {
  id: string;
  nama: string;
  nik: string;
  telepon: string;
  jenis_kelamin: string;
  alamat: string;
  layanan: string;
  spesialisasi_dokter?: string;
  dokter?: string;
  tanggal: string;
  estimated_time?: string;
  status: PatientStatus;
  queue_status?: string;
  queue_number?: number;
  keluhan?: string;
  booking_source?: string;
  tanggal_daftar?: string;
  updated_at?: Date;
}

export interface Doctor {
  poly: string;
  id: string;
  name: string;
  specialization: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  maxPatients?: number;
}

export interface Schedule {
  id: string;
  doctorId?: string;
  doctorName: string;
  poly: string;
  days: string[];
  shifts: Shift[];
  status: 'active' | 'holiday' | 'inactive';
  holidayReason?: string;
  holidayStartDate?: string;
  holidayEndDate?: string;
  createdAt?: string;
  lastUpdated?: string;
}

export interface FollowUpAppointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
  createdAt: string;
  status?: string;
  updatedAt?: string;
}