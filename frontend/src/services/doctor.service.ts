import { api } from "./api";
import { CreateBreakResult, Doctor, DoctorAvailability, DoctorBreak, SlotsResponse } from "../types";

export function listDoctors() {
  return api.get<Doctor[]>("/doctors").then((r) => r.data);
}

export function getDoctor(id: number) {
  return api.get<Doctor>(`/doctors/${id}`).then((r) => r.data);
}

export function createDoctor(data: { name: string; specialization: string }) {
  return api.post<Doctor>("/doctors", data).then((r) => r.data);
}

export function updateDoctor(id: number, data: { name: string; specialization: string }) {
  return api.put<Doctor>(`/doctors/${id}`, data).then((r) => r.data);
}

export function deleteDoctor(id: number) {
  return api.delete(`/doctors/${id}`);
}

export function listAvailability(doctorId: number) {
  return api.get<DoctorAvailability[]>(`/doctors/${doctorId}/availability`).then((r) => r.data);
}

export function addAvailability(
  doctorId: number,
  data: { dayOfWeek: string; startTime: string; endTime: string }
) {
  return api
    .post<DoctorAvailability>(`/doctors/${doctorId}/availability`, data)
    .then((r) => r.data);
}

export function deleteAvailability(doctorId: number, availabilityId: number) {
  return api.delete(`/doctors/${doctorId}/availability/${availabilityId}`);
}

export function getSlots(doctorId: number, date: string) {
  return api.get<SlotsResponse>(`/doctors/${doctorId}/slots`, { params: { date } }).then((r) => r.data);
}

export function listBreaks(doctorId: number) {
  return api.get<DoctorBreak[]>(`/doctors/${doctorId}/breaks`).then((r) => r.data);
}

export function createBreak(doctorId: number, data: { date: string; startTime: string; endTime: string }) {
  return api.post<CreateBreakResult>(`/doctors/${doctorId}/breaks`, data).then((r) => r.data);
}

export function deleteBreak(doctorId: number, breakId: number) {
  return api.delete(`/doctors/${doctorId}/breaks/${breakId}`);
}
