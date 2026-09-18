import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Doctor } from "../../types";
import { deleteDoctor, listDoctors } from "../../services/doctor.service";
import { Alert } from "../../components/Alert";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Pagination } from "../../components/Pagination";
import { IconClock, IconEdit, IconPlus, IconSearch, IconTrash } from "../../components/Icons";

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

export function DoctorList() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);

  const filteredDoctors = search.trim()
    ? doctors.filter((d) => {
        const q = search.trim().toLowerCase();
        return d.name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q);
      })
    : doctors;

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleDoctors = filteredDoctors.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function load() {
    setLoading(true);
    try {
      setDoctors(await listDoctors());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete() {
    if (!confirmTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteDoctor(confirmTarget.id);
      setDoctors((prev) => prev.filter((d) => d.id !== confirmTarget.id));
      setConfirmTarget(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold tracking-wider text-teal-600 uppercase mb-1">
            Medical Staff
          </p>
          <h1 className="text-xl font-semibold text-slate-900">Doctors</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage the clinicians patients can book with.</p>
        </div>
        <Link
          to="/admin/doctors/new"
          className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-teal-700 shadow-sm"
        >
          <IconPlus className="w-4 h-4" />
          Add Doctor
        </Link>
      </div>

      {error && <Alert message={error} />}

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : doctors.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          No doctors yet. Add one to get started.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-100">
            <div className="relative max-w-xs">
              <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search doctor, specialty..."
                className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Clinician</th>
                <th className="text-left font-semibold px-5 py-3">Specialization</th>
                <th className="text-right font-semibold px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleDoctors.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-center text-sm text-slate-500">
                    No doctors match "{search}".
                  </td>
                </tr>
              )}
              {visibleDoctors.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-semibold shrink-0">
                        {initialsOf(doctor.name)}
                      </div>
                      <span className="font-medium text-slate-900">{doctor.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {doctor.specialization}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/admin/doctors/${doctor.id}/availability`}
                        title="Availability"
                        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-teal-700 hover:border-teal-300 hover:bg-teal-50"
                      >
                        <IconClock className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/admin/doctors/${doctor.id}/edit`}
                        title="Edit"
                        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-teal-700 hover:border-teal-300 hover:bg-teal-50"
                      >
                        <IconEdit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setConfirmTarget(doctor)}
                        title="Delete"
                        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Delete doctor"
        message={`Are you sure you want to delete ${confirmTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
