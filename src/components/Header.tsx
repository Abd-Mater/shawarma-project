import { ShoppingCart, ChefHat, ClipboardList } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const { getCartCount, isAdmin, savedUserInfo, orders } = useStore();
  const location = useLocation();
  const cartCount = getCartCount();

  // Check if user has any active orders
  const activeOrders = savedUserInfo
    ? orders.filter(
        (order) =>
          order.customerPhone === savedUserInfo.phone &&
          !['delivered', 'cancelled'].includes(order.status)
      )
    : [];

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-orange-500/20 w-full">
      {/* 
        هنا السحر: 
        1. pt-[env(safe-area-inset-top)] -> يقرأ ارتفاع النوتش من الموبايل
        2. pt-4 -> مسافة إضافية عشان ما يكون لاصق
        3. min-h-[80px] -> ارتفاع محترم للهيدر
      */}
      <div className="w-full px-4 pb-4 pt-[max(2rem,env(safe-area-inset-top))] min-h-[90px] flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
              <ChefHat className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white leading-tight">شاورما جنين</h1>
              <p className="text-[10px] md:text-xs text-orange-400">أطيب شاورما في المدينة</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 md:gap-3">
            {!isAdmin && (
              <>
                {/* My Orders Button */}
                <Link
                  to="/my-orders"
                  className={`relative p-2 md:p-3 rounded-xl transition-all ${
                    location.pathname === '/my-orders'
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title="طلباتي"
                >
                  <ClipboardList className="w-5 h-5 md:w-6 md:h-6" />
                  {activeOrders.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-green-500 text-white text-[10px] md:text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {activeOrders.length}
                    </span>
                  )}
                </Link>

                {/* Cart Button */}
                <Link
                  to="/cart"
                  className={`relative p-2 md:p-3 rounded-xl transition-all ${
                    location.pathname === '/cart'
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title="السلة"
                >
                  <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-orange-500 text-white text-[10px] md:text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            
            {isAdmin && (
               <div className="bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/50">
                  <span className="text-orange-400 text-xs font-bold">مدير</span>
               </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
