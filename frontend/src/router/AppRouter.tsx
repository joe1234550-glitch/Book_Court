import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { CourtsPage } from '../pages/CourtsPage';
import { BookingsPage } from '../pages/BookingsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AdminCourtsPage } from '../pages/AdminCourtsPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { AdminBookingsPage } from '../pages/AdminBookingsPage';
import { FinancialReportPage } from '../pages/FinancialReportPage'; // 1. 匯入財務報表

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/index" element={<Navigate to="/" replace />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />

        <Route
          path="/"
          element={
            <AppLayout>
              <HomePage />
            </AppLayout>
          }
        />

        <Route
          path="/courts"
          element={
            <AppLayout>
              <CourtsPage />
            </AppLayout>
          }
        />

        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <BookingsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/courts"
          element={
            <ProtectedRoute requireAdmin>
              <AppLayout>
                <AdminCourtsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute requireAdmin>
              <AppLayout>
                <AdminBookingsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAdmin>
              <AppLayout>
                <AdminUsersPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* 2. 補上財務報表路由 */}
        <Route
          path="/admin/financial"
          element={
            <ProtectedRoute requireAdmin>
              <AppLayout>
                <FinancialReportPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};