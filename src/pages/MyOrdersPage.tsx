import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ClipboardList, Clock, ChefHat, Truck, CheckCircle, XCircle, ArrowLeft, Eye } from 'lucide-react';

const statusConfig = {
  pending: { label: 'في الانتظار', color: 'bg-yellow-500', icon: Clock },
  preparing: { label: 'جاري التحضير', color: 'bg-blue-500', icon: ChefHat },
  shipped: { label: 'جاري التوصيل', color: 'bg-purple-500', icon: Truck },
  delivered: { label: 'تم التسليم', color: 'bg-green-500', icon: CheckCircle },
  cancelled: { label: 'ملغي', color: 'bg-red-500', icon: XCircle },
};

export const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, savedUserInfo, setCurrentOrder } = useStore();

  // Get user orders based on saved phone number
  const userOrders = savedUserInfo
    ? orders.filter((order) => order.customerPhone === savedUserInfo.phone)
    : [];

  // Sort orders by date (newest first)
  const sortedOrders = [...userOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleViewOrder = (order: typeof orders[0]) => {
    setCurrentOrder(order);
    navigate('/tracking');
  };

  const formatDate = (date: number | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!savedUserInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <ClipboardList className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">لا توجد طلبات</h2>
          <p className="text-gray-500 mb-6">لم تقم بأي طلب بعد</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
          >
            تصفح القائمة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-6">
      {/* Header */}
      <div className="bg-orange-500 text-white p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>العودة للقائمة</span>
        </button>
        <h1 className="text-2xl font-bold">طلباتي</h1>
        <p className="text-orange-100 mt-1">مرحباً {savedUserInfo.name}</p>
      </div>

      {/* Orders List */}
      <div className="p-4">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">لا توجد طلبات سابقة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedOrders.map((order) => {
              const StatusIcon = statusConfig[order.status].icon;
              return (
                <div
                  key={order.id}
                  className={`bg-gray-900 rounded-2xl shadow-sm border border-gray-800 overflow-hidden ${
                    order.status === 'cancelled' ? 'opacity-60' : ''
                  }`}
                >
                  {/* Order Header */}
                  <div className="p-4 border-b border-gray-800 bg-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white">#{order.id}</span>
                      <span
                        className={`${statusConfig[order.status].color} text-white text-xs px-3 py-1 rounded-full flex items-center gap-1`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[order.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>

                  {/* Order Items Preview */}
                  <div className="p-4">
                    <div className="space-y-2 mb-4">
                      {order.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <img
                            src={item.menuItem.image}
                            alt={item.menuItem.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-white text-sm">
                              {item.menuItem.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              الكمية: {item.quantity}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-orange-600">
                            {(item.menuItem.price * item.quantity).toFixed(2)} ₪
                          </span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-gray-500 text-center">
                          +{order.items.length - 2} منتجات أخرى
                        </p>
                      )}
                    </div>

                    {/* Order Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <div>
                        <span className="text-gray-400 text-sm">الإجمالي: </span>
                        <span className="font-bold text-lg text-white">
                          {order.total.toFixed(2)} ₪
                        </span>
                      </div>
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-xl font-medium hover:bg-orange-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>تفاصيل الطلب</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
