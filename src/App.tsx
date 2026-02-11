import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import MenuPage from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { TrackingPage } from './pages/TrackingPage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { useStore } from './store/useStore';

export function App() {
  const { isAdmin } = useStore();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black" dir="rtl">
        <Header />
        {isAdmin ? (
          <AdminPage />
        ) : (
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/tracking/:orderId" element={<TrackingPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
          </Routes>
        )}
      </div>
    </BrowserRouter>
  );
}
