import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createDoctor, getDoctor, updateDoctor } from "../../services/doctor.service";
import { Alert } from "../../components/Alert";

export function DoctorForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      getDoctor(Number(id)).then((doctor) => {
        setName(doctor.name);
        setSpecialization(doctor.specialization);
      });
    }
  }, [id, isEdit]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isEdit) {
        await updateDoctor(Number(id), { name, specialization });
      } else {
        await createDoctor({ name, specialization });
      }
      navigate("/admin/doctors");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <p className="text-xs font-semibold tracking-wider text-teal-600 uppercase mb-1">Medical Staff</p>
      <h1 className="text-xl font-semibold text-slate-900 mb-4">{isEdit ? "Edit Doctor" : "Add Doctor"}</h1>
      {error && <Alert message={error} />}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dr. Jane Doe"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Specialization</label>
          <input
            required
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="Cardiologist"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-teal-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-teal-700 disabled:opacity-50 shadow-sm"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
