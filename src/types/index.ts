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
  id: string;
  name: string;
  specialization: string;
}

export interface Schedule {
  timeEnd: string;
  timeStart: string;
  status: string;
  holidayReason: string;
  holidayStartDate: string;
  holidayEndDate: string;
  id: string;
  doctorId: string;
  doctorName: string;
  poly: string;
  days: string[];
  day?: string;
  startTime: string;
  endTime: string;
  createdAt: string;
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
}