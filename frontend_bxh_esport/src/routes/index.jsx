import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import  ForgotPassword  from '../pages/auth/ForgotPassword';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { USER_ROLES } from '../utils/constants';
import { publicRoutes } from './publicRoutes';
import { adminRoutes } from './adminRoutes';
import { teamManagerRoutes } from './teamManagerRoutes';
import { playerRoutes } from './playerRoutes';
import { userRoutes } from './userRoutes';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  {/* <Route path="/verify-otp" element={<VerifyOtp />} /> */}

      {/* Public Routes */}
      {publicRoutes.map((route, index) => (
        <Route key={index} path={route.path} element={route.element} />
      ))}

      {/* Protected Routes with Dashboard Layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <DashboardLayout>
              <Routes>
                {/* Admin Routes */}
                {adminRoutes.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    element={
                      <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        {route.element}
                      </ProtectedRoute>
                    }
                  />
                ))}

                {/* Team Manager Routes */}
                {teamManagerRoutes.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    element={
                      <ProtectedRoute allowedRoles={[USER_ROLES.TEAM_MANAGER]}>
                        {route.element}
                      </ProtectedRoute>
                    }
                  />
                ))}

                {/* Player Routes */}
                {playerRoutes.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    element={
                      <ProtectedRoute allowedRoles={[USER_ROLES.PLAYER]}>
                        {route.element}
                      </ProtectedRoute>
                    }
                  />
                ))}

                {/* User Routes */}
                {userRoutes.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    element={
                      <ProtectedRoute allowedRoles={[USER_ROLES.USER]}>
                        {route.element}
                      </ProtectedRoute>
                    }
                  />
                ))}

                {/* Default redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </DashboardLayout>
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;