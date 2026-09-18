import { api } from "./api";
import { Appointment } from "../types";

export function bookAppointment(doctorId: number, date: string, time: string) {
  return api.post<Appointment>("/appointments", { doctorId, date, time }).then((r) => r.data);
}

export function listMyAppointments() {
  return api.get<Appointment[]>("/appointments").then((r) => r.data);
}

export function cancelAppointment(id: number) {
  return api.patch<Appointment>(`/appointments/${id}/cancel`).then((r) => r.data);
}
