import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/admin/Dashboard';
import Menus from './pages/admin/Menus';
import Tables from './pages/admin/Tables';
import Orders from './pages/admin/Orders';
import Statistics from './pages/admin/Statistics';
import Reservations from './pages/admin/Reservations';
import Clients from './pages/admin/Clients';
import Invoices from './pages/admin/Invoices';
import Stock from './pages/admin/Stock';
import Employees from './pages/admin/Employees';
import FloorPlan from './pages/admin/FloorPlan';
import Settings from './pages/admin/Settings';
import Subscription from './pages/admin/Subscription';
import OrderPage from './pages/client/OrderPage';
import PageTransition from './components/layout/PageTransition';
import { NotificationProvider } from './context/NotificationProvider';
import useAuthStore from './store/authStore';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <PageTransition>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/order" element={<OrderPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/menus" element={<ProtectedRoute><Menus /></ProtectedRoute>} />
          <Route path="/tables" element={<ProtectedRoute><Tables /></ProtectedRoute>} />
          <Route path="/floor-plan" element={<ProtectedRoute><FloorPlan /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/reservations" element={<ProtectedRoute><Reservations /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
          <Route path="/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
          <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </PageTransition>
      </NotificationProvider>
    </BrowserRouter>
  );
}
