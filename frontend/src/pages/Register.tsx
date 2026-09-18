import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { register } from "../services/auth.service";
import { Alert } from "../components/Alert";
import { IconCalendar } from "../components/Icons";

export function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await register(name, email, password);
      setSession(token, user);
      navigate("/patient/doctors");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-100">
      <div className="w-full max-w-sm bg-white p-7 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center text-white">
            <IconCalendar className="w-5 h-5" />
          </div>
          <span className="font-semibold text-slate-900 tracking-tight">Appointments</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Create your account</h1>
        <p className="text-sm text-slate-500 mb-5">Patient registration</p>
        {error && <Alert message={error} />}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-teal-700 disabled:opacity-50 shadow-sm"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-teal-700 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
