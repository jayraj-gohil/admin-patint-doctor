import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { IconCalendar, IconLogout, IconStethoscope } from "../components/Icons";

const navItems = [{ to: "/admin/doctors", label: "Doctors", icon: IconStethoscope }];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "A";

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-900 text-slate-300">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white">
            <IconCalendar className="w-[18px] h-[18px]" />
          </div>
          <span className="text-white font-semibold tracking-tight">Appointments</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Clinical Administration
          </p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-teal-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500">Admin</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <IconLogout className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="md:hidden bg-slate-900 text-white flex items-center justify-between px-4 h-14">
          <span className="font-semibold">Admin Portal</span>
          <div className="flex items-center gap-3">
            <NavLink to="/admin/doctors" className="text-sm text-slate-200">
              Doctors
            </NavLink>
            <button onClick={handleLogout} className="p-1.5 text-slate-300">
              <IconLogout className="w-5 h-5" />
            </button>
          </div>
        </header>

        <header className="hidden md:flex items-center justify-between bg-white border-b border-slate-200 px-8 h-16">
          <div>
            <p className="text-xs font-semibold tracking-wider text-teal-600 uppercase">
              Roster Administration
            </p>
            <h1 className="text-lg font-semibold text-slate-900">Admin Portal</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
            <span className="text-sm font-medium text-slate-700">{user?.name}</span>
          </div>
        </header>

        <main className="flex-1 w-full px-4 md:px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
