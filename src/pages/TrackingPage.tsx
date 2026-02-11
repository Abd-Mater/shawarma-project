import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, Truck, Package, Home, ArrowRight, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { OrderStatus, Order } from '../types';
import { useState, useEffect } from 'react';
import { subscribeToOrder } from '../firebase';

const statusSteps: { status: OrderStatus; label: string; icon: React.ElementType; message: string }[] = [
  { status: 'pending', label: 'تم استلام الطلب', icon: Clock, message: '🍽️ تم استلام طلبك وقريباً سنبدأ بتحضيره' },
  { status: 'preparing', label: 'جاري التحضير', icon: Package, message: '👨‍🍳 شاورمتك الآن في السيخ! جاري التحضير...' },
  { status: 'shipped', label: 'في الطريق إليك', icon: Truck, message: '🛵 السائق في الطريق إليك! جهّز فلوسك' },
  { status: 'delivered', label: 'تم التوصيل', icon: Home, message: '✅ تم التسليم بنجاح! صحة وعافية' },
];

const statusIndex: Record<OrderStatus, number> = {
  pending: 0,
  preparing: 1,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
};

export function TrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { orders, currentOrder, cancelOrder, setCurrentOrder } = useStore();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [liveOrder, setLiveOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  // Subscribe to real-time order updates
  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // First, check if we have the order in currentOrder (just created)
    if (currentOrder && currentOrder.id === orderId) {
      setLiveOrder(currentOrder);
      setIsLoading(false);
    }

    // Subscribe to Firebase updates
    const unsubscribe = subscribeToOrder(orderId, (order) => {
      if (order) {
        setLiveOrder(order);
        setCurrentOrder(order);
        setError(null);
      }
      setIsLoading(false);
    });

    // Timeout for loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [orderId, currentOrder, setCurrentOrder]);

  // Determine which order to display
  const order = liveOrder || currentOrder || orders.find((o) => o.id === orderId);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">جاري تحميل الطلب...</h2>
          <p className="text-gray-400">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  // Order not found
  if (!order) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-white/40" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">لم يتم العثور على الطلب</h2>
          <p className="text-gray-400 mb-6">تأكد من رقم الطلب وحاول مرة أخرى</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const currentStatusIndex = statusIndex[order.status];
  const isCancelled = order.status === 'cancelled';
  const canCancel = order.status === 'pending';
  const currentStep = statusSteps.find(s => s.status === order.status);

  const handleCancelOrder = async () => {
    try {
      await cancelOrder(order.id);
      setShowCancelConfirm(false);
    } catch (err) {
      console.error('Error cancelling order:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success/Cancelled Message */}
        <div className="text-center mb-8">
          {isCancelled ? (
            <>
              <div className="w-20 h-20 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">تم إلغاء الطلب</h1>
              <p className="text-gray-400">رقم الطلب: #{order.id.slice(-6)}</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">تم استلام طلبك بنجاح!</h1>
              <p className="text-gray-400">رقم الطلب: #{order.id.slice(-6)}</p>
            </>
          )}
        </div>

        {/* Live Status Message */}
        {!isCancelled && currentStep && (
          <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-2xl p-6 mb-6 text-center">
            <p className="text-2xl mb-2">{currentStep.message.split(' ')[0]}</p>
            <p className="text-white text-lg font-medium">
              {currentStep.message.split(' ').slice(1).join(' ')}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              <span className="text-green-400 text-sm">يتم تحديث الحالة تلقائياً</span>
            </div>
          </div>
        )}

        {/* Cancelled Notice */}
        {isCancelled && (
          <div className="bg-red-900/30 border border-red-800 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-medium">تم إلغاء هذا الطلب</p>
              <p className="text-red-500/70 text-sm">يمكنك إنشاء طلب جديد من القائمة</p>
            </div>
          </div>
        )}

        {/* Order Status Timeline */}
        {!isCancelled && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
            <h2 className="text-lg font-bold text-white mb-6">حالة الطلب</h2>
            <div className="relative">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                  <div key={step.status} className="flex gap-4 mb-6 last:mb-0">
                    <div className="relative">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-800 text-gray-500'
                        } ${isCurrent ? 'ring-4 ring-orange-500/30 animate-pulse' : ''}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-10 ${
                            index < currentStatusIndex ? 'bg-orange-500' : 'bg-gray-700'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pt-2">
                      <h3
                        className={`font-bold ${
                          isCompleted ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </h3>
                      {isCurrent && (
                        <p className="text-sm text-orange-500 mt-1 animate-pulse">
                          الحالة الحالية
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cancel Order Button */}
        {canCancel && !showCancelConfirm && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="w-full mb-6 py-4 bg-red-900/30 border border-red-800 text-red-500 font-medium rounded-2xl hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            إلغاء الطلب
          </button>
        )}

        {/* Cancel Confirmation */}
        {showCancelConfirm && (
          <div className="bg-red-900/30 border border-red-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-red-400">تأكيد إلغاء الطلب</h3>
            </div>
            <p className="text-gray-300 mb-4">
              هل أنت متأكد من إلغاء الطلب؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelOrder}
                className="flex-1 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors"
              >
                نعم، إلغاء الطلب
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3 bg-gray-800 text-gray-300 font-medium rounded-xl hover:bg-gray-700 transition-colors"
              >
                لا، إبقاء الطلب
              </button>
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">تفاصيل الطلب</h2>
          <div className="space-y-3">
            {order.items && order.items.map((item, index) => (
              <div
                key={item.id || index}
                className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-orange-500 font-bold">{item.quantity}x</span>
                  <div>
                    <span className="text-white">{item.menuItem?.name || 'منتج'}</span>
                    {item.selectedExtras && item.selectedExtras.length > 0 && (
                      <p className="text-sm text-orange-400">
                        {item.selectedExtras.map(e => e.name).join('، ')}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-gray-400">
                  {((item.menuItem?.price || 0) +
                    (item.selectedExtras?.reduce((s, e) => s + e.price, 0) || 0)) *
                    item.quantity}{' '}
                  ₪
                </span>
              </div>
            ))}
          </div>
          <div className="h-px bg-gray-800 my-4" />
          <div className="space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span>المجموع الفرعي</span>
              <span>{order.total} ₪</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span>رسوم التوصيل</span>
              <span>10 ₪</span>
            </div>
            <div className="flex items-center justify-between font-bold text-lg pt-2 border-t border-gray-800">
              <span className="text-white">الإجمالي</span>
              <span className="text-orange-500">{order.total + 10} ₪</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">طريقة الدفع</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
              {order.paymentMethod === 'cash' ? '💵' : order.paymentMethod === 'bank' ? '🏦' : '📱'}
            </div>
            <span className="text-white">
              {order.paymentMethod === 'cash' ? 'الدفع عند الاستلام' : 
               order.paymentMethod === 'bank' ? 'تحويل بنكي - بنك فلسطين' : 'محفظة PalPay'}
            </span>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-bold text-white mb-4">عنوان التوصيل</h2>
          <div className="space-y-2 text-gray-400">
            <p className="text-white font-medium">{order.customerName}</p>
            <p>📞 {order.customerPhone}</p>
            <p>📍 {order.customerAddress}</p>
          </div>
        </div>

        {/* Back to Menu */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            طلب جديد
          </Link>
        </div>
      </div>
    </div>
  );
}
