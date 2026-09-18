import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { AdminLayout } from "./layouts/AdminLayout";
import { DoctorList as AdminDoctorList } from "./pages/admin/DoctorList";
import { DoctorForm } from "./pages/admin/DoctorForm";
import { DoctorAvailability } from "./pages/admin/DoctorAvailability";
import { PatientLayout } from "./layouts/PatientLayout";
import { PatientDoctorList } from "./pages/patient/DoctorList";
import { DoctorSlots } from "./pages/patient/DoctorSlots";
import { MyAppointments } from "./pages/patient/MyAppointments";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute role="ADMIN" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="doctors" replace />} />
            <Route path="doctors" element={<AdminDoctorList />} />
            <Route path="doctors/new" element={<DoctorForm />} />
            <Route path="doctors/:id/edit" element={<DoctorForm />} />
            <Route path="doctors/:id/availability" element={<DoctorAvailability />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute role="PATIENT" />}>
          <Route path="/patient" element={<PatientLayout />}>
            <Route index element={<Navigate to="doctors" replace />} />
            <Route path="doctors" element={<PatientDoctorList />} />
            <Route path="doctors/:id" element={<DoctorSlots />} />
            <Route path="appointments" element={<MyAppointments />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
