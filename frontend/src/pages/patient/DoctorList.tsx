import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Doctor } from "../../types";
import { listDoctors } from "../../services/doctor.service";
import { Alert } from "../../components/Alert";
import { IconChevronRight } from "../../components/Icons";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PatientDoctorList() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDoctors()
      .then(setDoctors)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <p className="text-xs font-semibold tracking-wider text-teal-600 uppercase mb-1">Find Clinicians</p>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Doctors</h1>
      <p className="text-sm text-slate-500 mb-5">Choose a doctor to see their available time slots.</p>

      {error && <Alert message={error} />}
      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <Link
              key={doctor.id}
              to={`/patient/doctors/${doctor.id}`}
              className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md hover:border-teal-300 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-semibold shrink-0">
                {initialsOf(doctor.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 truncate">{doctor.name}</p>
                <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  {doctor.specialization}
                </span>
              </div>
              <IconChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
