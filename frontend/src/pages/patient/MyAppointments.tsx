import { useEffect, useState } from "react";
import { Appointment } from "../../types";
import { cancelAppointment, listMyAppointments } from "../../services/appointment.service";
import { Alert } from "../../components/Alert";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Pagination } from "../../components/Pagination";
import { IconTrash } from "../../components/Icons";

const PAGE_SIZE = 5;

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function MyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [confirmTargetId, setConfirmTargetId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const filteredAppointments = filterDate
    ? appointments.filter((a) => a.date.slice(0, 10) === filterDate)
    : appointments;

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleAppointments = filteredAppointments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  async function load() {
    setLoading(true);
    try {
      setAppointments(await listMyAppointments());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(id: number) {
    setCancellingId(id);
    setError(null);
    try {
      const updated = await cancelAppointment(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCancellingId(null);
      setConfirmTargetId(null);
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-5">
        <div>
          <p className="text-xs font-semibold tracking-wider text-teal-600 uppercase mb-1">
            Patient Services
          </p>
          <h1 className="text-xl font-semibold text-slate-900">My Appointments</h1>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="filterDate" className="text-sm font-medium text-slate-700">
            Filter by date
          </label>
          <input
            id="filterDate"
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setPage(1);
            }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {filterDate && (
            <button
              onClick={() => {
                setFilterDate("");
                setPage(1);
              }}
              className="text-sm text-teal-700 font-medium hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && <Alert message={error} />}
      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : appointments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          You have no appointments yet.
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          No appointments on this date.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {visibleAppointments.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-semibold shrink-0">
                  {initialsOf(a.doctor.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{a.doctor.name}</p>
                  <p className="text-xs text-slate-500">{a.doctor.specialization}</p>
                  <p className="text-sm text-slate-700 mt-1 font-medium">
                    {formatDate(a.date)} · {a.time}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    a.status === "BOOKED" ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {a.status}
                </span>
                {a.status === "BOOKED" && (
                  <button
                    onClick={() => setConfirmTargetId(a.id)}
                    disabled={cancellingId === a.id}
                    title="Cancel appointment"
                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={confirmTargetId !== null}
        title="Cancel appointment"
        message="Are you sure you want to cancel this appointment? This cannot be undone, but the slot will become available again."
        confirmLabel="Cancel appointment"
        cancelLabel="Keep it"
        danger
        loading={cancellingId !== null}
        onConfirm={() => confirmTargetId !== null && handleCancel(confirmTargetId)}
        onCancel={() => setConfirmTargetId(null)}
      />
    </div>
  );
}
