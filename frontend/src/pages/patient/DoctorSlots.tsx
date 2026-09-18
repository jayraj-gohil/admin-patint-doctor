import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Doctor } from "../../types";
import { getDoctor, getSlots } from "../../services/doctor.service";
import { bookAppointment } from "../../services/appointment.service";
import { Alert } from "../../components/Alert";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(
    2,
    "0"
  )}`;
}

export function DoctorSlots() {
  const { id } = useParams();
  const doctorId = Number(id);
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getDoctor(doctorId).then(setDoctor).catch((err) => setError((err as Error).message));
  }, [doctorId]);

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    setError(null);
    getSlots(doctorId, date)
      .then((res) => setSlots(res.slots))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoadingSlots(false));
  }, [doctorId, date]);

  async function handleBook(time: string) {
    setBooking(time);
    setError(null);
    setSuccess(null);
    try {
      await bookAppointment(doctorId, date, time);
      setSuccess(`Booked ${time} on ${date}.`);
      setSlots((prev) => prev.filter((s) => s !== time));
    } catch (err) {
      setError((err as Error).message);
      // Someone may have taken the slot first — refresh the real state from the server.
      getSlots(doctorId, date).then((res) => setSlots(res.slots));
    } finally {
      setBooking(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold tracking-wider text-teal-600 uppercase mb-1">Book Appointment</p>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">{doctor ? doctor.name : "Doctor"}</h1>
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 mb-5">
        {doctor?.specialization}
      </span>

      {error && <Alert message={error} />}
      {success && (
        <div>
          <Alert message={success} type="success" />
          <button
            onClick={() => navigate("/patient/appointments")}
            className="text-sm text-teal-700 hover:underline mb-4 inline-block font-medium"
          >
            View my appointments →
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
          <input
            type="date"
            min={todayStr()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {loadingSlots ? (
          <p className="text-sm text-slate-500">Loading slots...</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-slate-500">No available slots on this date.</p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                onClick={() => handleBook(slot)}
                disabled={booking === slot}
                className="border border-slate-200 rounded-lg px-2 py-2.5 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 disabled:opacity-50 transition-colors"
              >
                {booking === slot ? "..." : slot}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
