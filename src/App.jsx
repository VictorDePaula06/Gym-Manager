import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GymProvider } from './context/GymContext';
import { ToastProvider } from './context/ToastContext';
import { DialogProvider } from './context/DialogContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentForm from './pages/StudentForm';
import TeacherForm from './pages/TeacherForm';
import Financial from './pages/Financial';
import Workouts from './pages/Workouts';
import WorkoutBuilder from './pages/WorkoutBuilder';
import Login from './pages/Login';
import Settings from './pages/Settings';
import StudentDetails from './pages/StudentDetails';
import Reports from './pages/Reports';
import Teachers from './pages/Teachers';
import TeacherDetails from './pages/TeacherDetails';
import PaymentRequired from './pages/PaymentRequired';
import ChangePassword from './pages/ChangePassword';
import PrivateRoute from './components/PrivateRoute';
import InstallPrompt from './components/InstallPrompt';

function App() {
  return (
    <AuthProvider>
      <GymProvider>
        <ToastProvider>
          <DialogProvider>
            <BrowserRouter>
              <InstallPrompt />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/payment-required" element={<PaymentRequired />} />
                <Route path="/change-password" element={
                  <PrivateRoute>
                    <ChangePassword />
                  </PrivateRoute>
                } />
                <Route path="/" element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="students" element={<Students />} />
                  <Route path="students/new" element={<StudentForm />} />
                  <Route path="students/:id" element={<StudentDetails />} />
                  <Route path="students/:id/edit" element={<StudentForm />} />
                  <Route path="teachers" element={<Teachers />} />
                  <Route path="teachers/new" element={<TeacherForm />} />
                  <Route path="teachers/edit/:id" element={<TeacherForm />} />
                  <Route path="teachers/:id" element={<TeacherDetails />} />
                  <Route path="financial" element={<Financial />} />
                  <Route path="workouts" element={<Workouts />} />
                  <Route path="workouts/:id" element={<WorkoutBuilder />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </BrowserRouter>
          </DialogProvider>
        </ToastProvider>
      </GymProvider>
    </AuthProvider>
  )
}

export default App
