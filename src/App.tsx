import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // إعداد مستمع لزر الرجوع في الأندرويد
    const backButtonListener = CapacitorApp.addListener('backButton', () => {
      // إذا كنا في الصفحة الرئيسية (للمستخدم أو الأدمن)، نخرج من التطبيق
      if (!isAdmin && location.pathname === '/') {
        CapacitorApp.exitApp();
      } else if (isAdmin) {
        // إذا كان أدمن، نعتبر لوحة التحكم هي الرئيسية ونخرج
        // (يمكن تغيير هذا لعمل تسجيل خروج إذا أردت، لكن الخروج من التطبيق هو المتوقع عادة في الصفحة الرئيسية)
        CapacitorApp.exitApp();
      } else {
        // في أي صفحة أخرى، نرجع للخلف
        navigate(-1);
      }
    });

    // تنظيف المستمع عند إلغاء تحميل المكون
    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, [navigate, location, isAdmin]);

  return (
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
  );
}
