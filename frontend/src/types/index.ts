export type Role = "ADMIN" | "PATIENT";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
}

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface DoctorAvailability {
  id: number;
  doctorId: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface DoctorBreak {
  id: number;
  doctorId: number;
  date: string;
  startTime: string;
  endTime: string;
}

export interface CreateBreakResult {
  break: DoctorBreak;
  rescheduled: Array<{ id: number; from: string; to: string }>;
}

export type AppointmentStatus = "BOOKED" | "CANCELLED";

export interface Appointment {
  id: number;
  doctorId: number;
  patientId: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  doctor: Doctor;
}

export interface SlotsResponse {
  doctorId: number;
  date: string;
  slots: string[];
}
