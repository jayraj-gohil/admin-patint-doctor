import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DayOfWeek, Doctor, DoctorAvailability as Availability, DoctorBreak } from "../../types";
import {
  addAvailability,
  createBreak,
  deleteAvailability,
  deleteBreak,
  getDoctor,
  listAvailability,
  listBreaks,
} from "../../services/doctor.service";
import { Alert } from "../../components/Alert";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { IconTrash } from "../../components/Icons";

const DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(
    2,
    "0"
  )}`;
}

export function DoctorAvailability() {
  const { id } = useParams();
  const doctorId = Number(id);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availability, setAvailability] = useState<Record<string, Availability[]>>({});
  const [breaks, setBreaks] = useState<DoctorBreak[]>([]);

  const [day, setDay] = useState<DayOfWeek>("MONDAY");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("13:00");

  const [breakDate, setBreakDate] = useState(todayStr());
  const [breakStart, setBreakStart] = useState("10:30");
  const [breakEnd, setBreakEnd] = useState("11:30");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [breakLoading, setBreakLoading] = useState(false);
  const [confirmAvailabilityId, setConfirmAvailabilityId] = useState<number | null>(null);
  const [confirmBreakId, setConfirmBreakId] = useState<number | null>(null);

  async function load() {
    const [doctorData, availabilityData, breakData] = await Promise.all([
      getDoctor(doctorId),
      listAvailability(doctorId),
      listBreaks(doctorId),
    ]);
    setDoctor(doctorData);
    const map: Record<string, Availability[]> = {};
    availabilityData.forEach((a) => {
      map[a.dayOfWeek] = [...(map[a.dayOfWeek] ?? []), a];
    });
    setAvailability(map);
    setBreaks(breakData);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  async function handleAddAvailability(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await addAvailability(doctorId, { dayOfWeek: day, startTime, endTime });
      setSuccess(`Added ${startTime} - ${endTime} on ${day}.`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAvailability() {
    if (confirmAvailabilityId === null) return;
    try {
      await deleteAvailability(doctorId, confirmAvailabilityId);
      setConfirmAvailabilityId(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleAddBreak(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBreakLoading(true);
    try {
      const result = await createBreak(doctorId, { date: breakDate, startTime: breakStart, endTime: breakEnd });
      if (result.rescheduled.length > 0) {
        const summary = result.rescheduled.map((r) => `#${r.id}: ${r.from} → ${r.to}`).join(", ");
        setSuccess(`Break added. Rescheduled affected appointment(s): ${summary}`);
      } else {
        setSuccess("Break added.");
      }
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBreakLoading(false);
    }
  }

  async function handleDeleteBreak() {
    if (confirmBreakId === null) return;
    try {
      await deleteBreak(doctorId, confirmBreakId);
      setConfirmBreakId(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wider text-teal-600 uppercase mb-1">Medical Staff</p>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">
        Availability{doctor ? ` — ${doctor.name}` : ""}
      </h1>
      <p className="text-sm text-slate-500 mb-5">
        A doctor can have multiple periods per day (e.g. 09:00-13:00 and 14:00-17:00).
      </p>

      {error && <Alert message={error} />}
      {success && <Alert message={success} type="success" />}

      <form
        onSubmit={handleAddAvailability}
        className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap gap-4 items-end mb-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Day</label>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value as DayOfWeek)}
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Start time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">End time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-teal-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-teal-700 disabled:opacity-50 shadow-sm"
        >
          {loading ? "Adding..." : "Add Availability"}
        </button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {DAYS.map((d) => {
          const periods = availability[d] ?? [];
          return (
            <div
              key={d}
              className={`rounded-xl border p-4 ${
                periods.length > 0 ? "border-teal-200 bg-teal-50/60" : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{d}</p>
              {periods.length > 0 ? (
                <div className="space-y-1.5">
                  {periods.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-teal-800">
                        {p.startTime} – {p.endTime}
                      </p>
                      <button
                        onClick={() => setConfirmAvailabilityId(p.id)}
                        title="Remove period"
                        className="p-1 rounded text-teal-700/60 hover:text-red-600"
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Not set</p>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="text-lg font-semibold text-slate-900 mb-1">Breaks</h2>
      <p className="text-sm text-slate-500 mb-4">
        A break blocks a time range on one specific date. Existing booked appointments inside the break
        are automatically moved to the nearest available slot; if that isn't possible the break is rejected.
      </p>

      <form
        onSubmit={handleAddBreak}
        className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap gap-4 items-end mb-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
          <input
            type="date"
            min={todayStr()}
            value={breakDate}
            onChange={(e) => setBreakDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Start time</label>
          <input
            type="time"
            value={breakStart}
            onChange={(e) => setBreakStart(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">End time</label>
          <input
            type="time"
            value={breakEnd}
            onChange={(e) => setBreakEnd(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          type="submit"
          disabled={breakLoading}
          className="bg-slate-800 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-slate-900 disabled:opacity-50 shadow-sm"
        >
          {breakLoading ? "Adding..." : "Add Break"}
        </button>
      </form>

      {breaks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500">
          No breaks scheduled.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {breaks.map((b) => (
            <div key={b.id} className="flex items-center justify-between px-5 py-3">
              <p className="text-sm text-slate-700">
                <span className="font-medium">{b.date.slice(0, 10)}</span> · {b.startTime} – {b.endTime}
              </p>
              <button
                onClick={() => setConfirmBreakId(b.id)}
                title="Delete break"
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
              >
                <IconTrash className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmAvailabilityId !== null}
        title="Remove availability period"
        message="Remove this availability period? Patients will no longer be able to book slots in it."
        confirmLabel="Remove"
        danger
        onConfirm={handleDeleteAvailability}
        onCancel={() => setConfirmAvailabilityId(null)}
      />

      <ConfirmDialog
        open={confirmBreakId !== null}
        title="Delete break"
        message="Delete this break? The affected time range will become bookable again."
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteBreak}
        onCancel={() => setConfirmBreakId(null)}
      />
    </div>
  );
}
