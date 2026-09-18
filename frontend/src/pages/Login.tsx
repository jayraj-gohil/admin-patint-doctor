import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { login } from "../services/auth.service";
import { Alert } from "../components/Alert";
import { IconCalendar, IconEye, IconEyeOff } from "../components/Icons";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await login(email, password);
      setSession(token, user);
      navigate(user.role === "ADMIN" ? "/admin/doctors" : "/patient/doctors");
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
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Sign in</h1>
        <p className="text-sm text-slate-500 mb-5">Patients and admins use the same login.</p>
        {error && <Alert message={error} />}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              title={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-teal-700 disabled:opacity-50 shadow-sm"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-5">
          New patient?{" "}
          <Link to="/register" className="text-teal-700 font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
