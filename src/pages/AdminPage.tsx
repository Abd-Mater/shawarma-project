import { Clock, Package, Truck, CheckCircle2, XCircle, Bell, Volume2, UtensilsCrossed, ClipboardList, Settings, Printer, Store, Ban, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { OrderStatus, MenuItem, StoreSettings } from '../types';
import { useState, useEffect, useRef } from 'react';
import { 
  subscribeToProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  toggleProductAvailability,
  initializeMenu,
  subscribeToSettings,
  updateStoreSettings
} from '../firebase';
import { menuItems as defaultMenuItems, categories } from '../data/menu';

const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  pending: {
    label: 'في الانتظار',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    icon: Clock,
  },
  preparing: {
    label: 'جاري التحضير',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    icon: Package,
  },
  shipped: {
    label: 'جاري التوصيل',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/20',
    icon: Truck,
  },
  delivered: {
    label: 'تم التسليم',
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'ملغي',
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    icon: XCircle,
  },
};

// Removed 'cancelled' from visible statuses
const allStatuses: OrderStatus[] = ['pending', 'preparing', 'shipped', 'delivered'];

export function AdminPage() {
  const navigate = useNavigate();
  const { orders = [], updateOrderStatus, subscribeToAllOrders, isLoadingOrders, logout } = useStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settings'>('orders');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousOrdersCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Settings State
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    minOrderAmount: 0,
    isStoreBusy: false,
    deliveryFee: 0,
    isClosed: false
  });

  // Menu Management States
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'shawarma' as MenuItem['category'],
    image: ''
  });

  // Safe subscription to orders
  useEffect(() => {
    try {
      subscribeToAllOrders();
    } catch (error) {
      console.error("Failed to subscribe to orders:", error);
    }
  }, [subscribeToAllOrders]);

  // Safe subscription to products
  useEffect(() => {
    try {
      const unsubscribe = subscribeToProducts((fetchedProducts) => {
        setProducts(fetchedProducts || []);
        setLoadingProducts(false);
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Failed to subscribe to products:", error);
      setLoadingProducts(false);
      return () => {};
    }
  }, []);

  // Subscribe to Settings
  useEffect(() => {
    const unsubscribe = subscribeToSettings((settings) => {
      setStoreSettings(settings);
    });
    return () => unsubscribe();
  }, []);

  // Safe sound effect
  useEffect(() => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    if (safeOrders.length > previousOrdersCount.current && soundEnabled) {
      try {
        if (audioRef.current) {
          audioRef.current.play().catch((e) => console.log("Audio play failed (user interaction needed)", e));
        }
      } catch (e) {
        console.error("Audio error", e);
      }
    }
    previousOrdersCount.current = safeOrders.length;
  }, [orders?.length, soundEnabled]);

  const safeOrders = Array.isArray(orders) ? orders : [];
  
  // Filter out cancelled orders from the main view completely
  const activeOrders = safeOrders.filter(order => order?.status !== 'cancelled');
  
  const filteredOrders =
    filterStatus === 'all'
      ? activeOrders
      : activeOrders.filter((order) => order?.status === filterStatus);

  const sortedOrders = [...filteredOrders].sort(
    (a, b) => {
      const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }
  );

  const orderCounts = {
    all: activeOrders.length,
    pending: activeOrders.filter((o) => o?.status === 'pending').length,
    preparing: activeOrders.filter((o) => o?.status === 'preparing').length,
    shipped: activeOrders.filter((o) => o?.status === 'shipped').length,
    delivered: activeOrders.filter((o) => o?.status === 'delivered').length,
    cancelled: 0, // Hidden
  };

  // Menu Management Functions (kept same logic but wrapped in try-catch where appropriate)
  const handleInitializeMenu = async () => {
    setIsInitializing(true);
    try {
      const productsWithoutId = defaultMenuItems.map(({ id, ...rest }) => rest);
      await initializeMenu(productsWithoutId);
      alert('تم تحميل القائمة الافتراضية بنجاح!');
    } catch (error) {
      console.error('Error initializing menu:', error);
      alert('حدث خطأ أثناء تحميل القائمة');
    }
    setIsInitializing(false);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      category: formData.category,
      image: formData.image || 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400',
      extras: [],
      isAvailable: true
    };

    try {
      if (editingProduct?.id) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct(productData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('حدث خطأ أثناء حفظ المنتج');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await deleteProduct(productId);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleToggleAvailability = async (product: MenuItem) => {
    if(!product?.id) return;
    try {
      await toggleProductAvailability(product.id, !product.isAvailable);
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handleEditProduct = (product: MenuItem) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      category: product.category || 'shawarma',
      image: product.image || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'shawarma',
      image: ''
    });
    setEditingProduct(null);
    setShowAddModal(false);
  };

  const handlePrintOrder = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const items = Array.isArray(order.items) ? order.items : [];
    const total = order.total || 0;
    const date = new Date(order.createdAt).toLocaleString('ar-SA');

    const html = `
      <html dir="rtl">
        <head>
          <title>فاتورة #${order.id.slice(-4)}</title>
          <style>
            body { font-family: 'Tajawal', sans-serif; padding: 20px; width: 300px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; margin: 0; }
            .subtitle { font-size: 14px; margin: 5px 0; }
            .info { font-size: 14px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
            .item-name { font-weight: bold; }
            .extras { font-size: 12px; color: #555; margin-right: 15px; }
            .total { border-top: 2px dashed #000; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 18px; text-align: center; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
            @media print { @page { margin: 0; } body { margin: 1cm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">شاورما جنين</h1>
            <p class="subtitle">أطيب شاورما في البلد</p>
            <p class="subtitle">#${order.id.slice(-6)}</p>
          </div>
          <div class="info">
            <p><strong>العميل:</strong> ${order.customerName}</p>
            <p><strong>الهاتف:</strong> ${order.customerPhone}</p>
            <p><strong>العنوان:</strong> ${order.customerAddress}</p>
            <p><strong>التاريخ:</strong> ${date}</p>
          </div>
          <div class="items">
            ${items.map((item: any) => {
              const menuItem = item.menuItem || {};
              const itemName = menuItem.name || 'منتج';
              const extras = Array.isArray(item.selectedExtras) ? item.selectedExtras : [];
              return `
                <div class="item-row">
                  <div class="item">
                    <span class="item-name">${item.quantity}x ${itemName}</span>
                    <span>${(menuItem.price || 0) * item.quantity} ₪</span>
                  </div>
                  ${extras.length > 0 ? `<div class="extras">+ ${extras.map((e: any) => e.name).join(', ')}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
          <div class="total">
            المجموع: ${total} ₪
          </div>
          <div class="footer">
            <p>شكراً لطلبكم!</p>
            <p>صحتين وعافية ❤️</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black pb-20">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-white">لوحة تحكم المطعم</h1>
          <div className="flex items-center gap-4">
            {isLoadingOrders && (
              <div className="flex items-center gap-2 text-orange-500">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">جاري التحميل...</span>
              </div>
            )}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                soundEnabled 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-white/5 text-white/40 border border-white/10'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              <span className="text-sm hidden sm:inline">{soundEnabled ? 'الصوت مفعّل' : 'الصوت مُعطّل'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>

        {/* Tabs - Scrollable on mobile */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'orders'
                ? 'bg-orange-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>الطلبات</span>
            {orderCounts.pending > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                {orderCounts.pending}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'menu'
                ? 'bg-orange-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span>إدارة المنيو</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === 'settings'
                ? 'bg-orange-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>إعدادات المتجر</span>
          </button>
        </div>

        {/* Orders Content */}
        {activeTab === 'orders' && (
          <>
            {/* Stats Grid - Scrollable on mobile */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-6 sm:overflow-visible">
               <button
                onClick={() => setFilterStatus('all')}
                className={`p-4 rounded-2xl border transition-all min-w-[140px] flex-shrink-0 sm:min-w-0 ${
                  filterStatus === 'all'
                    ? 'bg-orange-500/20 border-orange-500'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <p className="text-2xl font-bold text-white">{orderCounts.all}</p>
                <p className="text-white/60 text-sm">كل الطلبات</p>
              </button>
              {allStatuses.map((status) => {
                const config = statusConfig[status];
                const Icon = config.icon;
                return (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`p-4 rounded-2xl border transition-all min-w-[140px] flex-shrink-0 sm:min-w-0 ${
                      filterStatus === status
                        ? `${config.bgColor} border-current ${config.color}`
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-2xl font-bold text-white">{orderCounts[status]}</p>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <p className="text-white/60 text-sm">{config.label}</p>
                  </button>
                );
              })}
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {sortedOrders.length === 0 ? (
                <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                   <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-10 h-10 text-white/40" />
                   </div>
                   <h2 className="text-xl font-bold text-white mb-2">لا توجد طلبات</h2>
                   <p className="text-white/60">ستظهر الطلبات هنا عند وصولها</p>
                </div>
              ) : (
                sortedOrders.map((order) => {
                  if (!order || !order.id) return null; // Safe check
                  
                  const status = order.status || 'pending';
                  const config = statusConfig[status] || statusConfig.pending;
                  const Icon = config.icon;
                  const isCancelled = status === 'cancelled';
                  const items = Array.isArray(order.items) ? order.items : [];
                  
                  // Calculate safely
                  const safeTotal = order.total || 0;
                  const safeDate = order.createdAt ? new Date(order.createdAt).toLocaleString('ar-SA') : '---';

                  return (
                    <div 
                      key={order.id}
                      className={`bg-zinc-900/50 rounded-2xl border overflow-hidden ${
                        isCancelled ? 'border-red-500/30 opacity-75' : 
                        status === 'pending' ? 'border-yellow-500/50' : 'border-white/10'
                      }`}
                    >
                      <div className="p-4 flex flex-col md:flex-row gap-6">
                         {/* Status Icon Column */}
                         <div className="flex-shrink-0">
                            <div className={`p-3 rounded-xl ${config.bgColor}`}>
                              <Icon className={`w-8 h-8 ${config.color}`} />
                            </div>
                         </div>

                         {/* Content Column */}
                         <div className="flex-1">
                            {/* Top Row: Order ID and Status */}
                            <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                               <div>
                                  <div className="flex items-center gap-3 mb-1">
                                    <h3 className={`text-xl font-bold ${isCancelled ? 'text-white/50 line-through' : 'text-white'}`}>
                                      طلب #{order.id.slice(-6)}
                                    </h3>
                                    {status === 'pending' && (
                                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded animate-pulse">
                                        جديد
                                      </span>
                                    )}
                                    <button
                                      onClick={() => handlePrintOrder(order)}
                                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                                      title="طباعة الفاتورة"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <p className="text-white/60 text-sm">{safeDate}</p>
                               </div>
                               <div className="text-left">
                                  <p className="text-2xl font-bold text-orange-500">{safeTotal} ₪</p>
                                  <p className="text-white/40 text-sm">{items.length} منتجات</p>
                               </div>
                            </div>

                            {/* Customer Info Box */}
                            <div className="bg-black/40 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div>
                                  <span className="text-white/40 text-xs block mb-1">العميل</span>
                                  <span className="text-white font-medium block">{order.customerName || 'بدون اسم'}</span>
                               </div>
                               <div>
                                  <span className="text-white/40 text-xs block mb-1">الهاتف</span>
                                  <span className="text-white font-medium block dir-ltr font-mono">{order.customerPhone || '---'}</span>
                               </div>
                               <div className="md:col-span-2">
                                  <span className="text-white/40 text-xs block mb-1">العنوان</span>
                                  <span className="text-white font-medium block">{order.customerAddress || '---'}</span>
                               </div>
                            </div>

                            {/* Items List */}
                            <div className="space-y-2 mb-6">
                              {items.map((item, idx) => {
                                 // Very defensive item rendering
                                 if (!item) return null;
                                 const menuItem = item.menuItem || {};
                                 const itemName = menuItem.name || 'منتج غير معروف';
                                 const itemPrice = menuItem.price || 0;
                                 const extras = Array.isArray(item.selectedExtras) ? item.selectedExtras : [];
                                 const extrasPrice = extras.reduce((sum, e) => sum + (e?.price || 0), 0);
                                 const totalPrice = (itemPrice + extrasPrice) * (item.quantity || 1);
                                 
                                 return (
                                   <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-lg text-sm">
                                      <div className="flex items-center gap-3">
                                        <span className="bg-orange-500/20 text-orange-400 font-bold px-2 py-1 rounded">
                                          {item.quantity}x
                                        </span>
                                        <div>
                                          <span className="text-white font-medium">{itemName}</span>
                                          {extras.length > 0 && (
                                            <div className="text-white/50 text-xs mt-0.5">
                                              + {extras.map(e => e?.name).filter(Boolean).join('، ')}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <span className="text-white/70 font-mono">{totalPrice} ₪</span>
                                   </div>
                                 );
                              })}
                            </div>

                            {/* Action Buttons */}
                            {!isCancelled && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                                  disabled={status === 'preparing'}
                                  className={`py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                                    status === 'preparing'
                                      ? 'bg-blue-500 text-white opacity-50 cursor-not-allowed'
                                      : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:scale-[1.02]'
                                  }`}
                                >
                                  👨‍🍳 تحضير
                                </button>
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'shipped')}
                                  disabled={status === 'shipped'}
                                  className={`py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                                    status === 'shipped'
                                      ? 'bg-purple-500 text-white opacity-50 cursor-not-allowed'
                                      : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:scale-[1.02]'
                                  }`}
                                >
                                  🛵 توصيل
                                </button>
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'delivered')}
                                  disabled={status === 'delivered'}
                                  className={`py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                                    status === 'delivered'
                                      ? 'bg-green-500 text-white opacity-50 cursor-not-allowed'
                                      : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:scale-[1.02]'
                                  }`}
                                >
                                  ✅ تم
                                </button>
                                <button
                                  onClick={() => {
                                    if(confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
                                      updateOrderStatus(order.id, 'cancelled');
                                    }
                                  }}
                                  className="py-2 px-4 rounded-lg font-bold text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:scale-[1.02] transition-all"
                                >
                                  ❌ إلغاء
                                </button>
                              </div>
                            )}
                         </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Menu Content (Safeguarded) */}
        {activeTab === 'menu' && (
           <>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/5 p-3 rounded-xl text-center border border-white/10">
                   <div className="text-xl sm:text-2xl font-bold text-white">{products?.length || 0}</div>
                   <div className="text-white/40 text-xs sm:text-sm">منتج</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl text-center border border-white/10">
                   <div className="text-xl sm:text-2xl font-bold text-green-400">
                      {products?.filter(p => p.isAvailable).length || 0}
                   </div>
                   <div className="text-white/40 text-xs sm:text-sm">مفعل</div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl text-center border border-white/10">
                   <div className="text-xl sm:text-2xl font-bold text-red-400">
                      {products?.filter(p => !p.isAvailable).length || 0}
                   </div>
                   <div className="text-white/40 text-xs sm:text-sm">معطل</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-6">
                 <button 
                   onClick={() => setShowAddModal(true)}
                   className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors"
                 >
                    ➕ إضافة وجبة
                 </button>
                 {products.length === 0 && (
                   <button 
                     onClick={handleInitializeMenu}
                     disabled={isInitializing}
                     className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-xl disabled:opacity-50"
                   >
                      {isInitializing ? 'جاري التحميل...' : '📥 استعادة القائمة'}
                   </button>
                 )}
              </div>

              {/* Filter - Scrollable on mobile */}
              <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                 <button
                   onClick={() => setSelectedCategory('all')}
                   className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-colors flex-shrink-0 ${
                      selectedCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/60'
                   }`}
                 >
                    الكل
                 </button>
                 {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-colors flex-shrink-0 ${
                        selectedCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/60'
                      }`}
                    >
                       {cat.name}
                    </button>
                 ))}
              </div>

              {/* Products Grid */}
              {loadingProducts ? (
                <div className="text-center py-12">
                   <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                   <p className="text-white/60">جاري تحميل المنتجات...</p>
                </div>
              ) : (
              <div className="space-y-3">
                 {filteredProducts.map(product => (
                    <div key={product.id} className={`bg-white/5 p-3 rounded-xl border flex gap-4 ${
                       !product.isAvailable ? 'border-red-500/30 opacity-60' : 'border-white/10'
                    }`}>
                       <img 
                         src={product.image} 
                         alt={product.name}
                         className="w-20 h-20 rounded-lg object-cover bg-black/50" 
                         onError={(e) => (e.currentTarget.src = 'https://placehold.co/100?text=Food')}
                       />
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                             <div>
                                <h3 className="text-white font-bold truncate">{product.name}</h3>
                                <p className="text-white/40 text-sm truncate">{product.description}</p>
                             </div>
                             <span className="text-orange-500 font-bold whitespace-nowrap">{product.price} ₪</span>
                          </div>
                          
                          <div className="flex gap-2 mt-3">
                             <button
                               onClick={() => handleToggleAvailability(product)}
                               className={`flex-1 py-1.5 rounded-lg text-sm font-bold ${
                                  !product.isAvailable 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-red-500/20 text-red-400'
                               }`}
                             >
                                {product.isAvailable ? '⛔ تعطيل' : '✅ تفعيل'}
                             </button>
                             <button
                               onClick={() => handleEditProduct(product)}
                               className="flex-1 py-1.5 rounded-lg text-sm font-bold bg-blue-500/20 text-blue-400"
                             >
                                ✏️ تعديل
                             </button>
                             <button
                               onClick={() => handleDeleteProduct(product.id)}
                               className="px-3 rounded-lg bg-white/10 text-white/60 hover:text-red-400 hover:bg-white/20"
                             >
                                🗑️
                             </button>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
              )}

              {/* Modal (Add/Edit) */}
              {showAddModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                   <div className="bg-zinc-900 w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden">
                      <div className="p-4 border-b border-white/10 flex justify-between items-center">
                         <h2 className="text-xl font-bold text-white">
                            {editingProduct ? 'تعديل الوجبة' : 'إضافة وجبة جديدة'}
                         </h2>
                         <button onClick={resetForm} className="text-white/40 hover:text-white">✕</button>
                      </div>
                      <form onSubmit={handleSubmitProduct} className="p-4 space-y-4">
                         <div>
                            <label className="text-white/60 text-sm block mb-1">اسم الوجبة</label>
                            <input 
                              required
                              value={formData.name}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                            />
                         </div>
                         <div>
                            <label className="text-white/60 text-sm block mb-1">الوصف</label>
                            <textarea 
                              value={formData.description}
                              onChange={e => setFormData({...formData, description: e.target.value})}
                              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none h-20 resize-none"
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="text-white/60 text-sm block mb-1">السعر</label>
                               <input 
                                 required
                                 type="number"
                                 step="0.5"
                                 value={formData.price}
                                 onChange={e => setFormData({...formData, price: e.target.value})}
                                 className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                               />
                            </div>
                            <div>
                               <label className="text-white/60 text-sm block mb-1">التصنيف</label>
                               <select 
                                  value={formData.category}
                                  onChange={e => setFormData({...formData, category: e.target.value as any})}
                                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                               >
                                  {categories.map(c => (
                                     <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>
                                  ))}
                               </select>
                            </div>
                         </div>
                         <div>
                            <label className="text-white/60 text-sm block mb-1">رابط الصورة</label>
                            <input 
                              value={formData.image}
                              onChange={e => setFormData({...formData, image: e.target.value})}
                              placeholder="https://..."
                              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                            />
                         </div>
                         <div className="pt-4 flex gap-3">
                            <button type="button" onClick={resetForm} className="flex-1 py-3 rounded-xl font-bold bg-white/5 text-white hover:bg-white/10 transition-colors">
                               إلغاء
                            </button>
                            <button type="submit" className="flex-1 py-3 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors">
                               حفظ
                            </button>
                         </div>
                      </form>
                   </div>
                </div>
              )}
           </>
        )}

        {/* Settings Content */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Busy Mode Card */}
            <div className={`p-6 rounded-2xl border transition-all ${
              storeSettings.isStoreBusy 
                ? 'bg-red-500/10 border-red-500/50' 
                : 'bg-zinc-900 border-white/10'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${storeSettings.isStoreBusy ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                    {storeSettings.isStoreBusy ? <Ban className="w-8 h-8" /> : <Store className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">حالة المتجر</h3>
                    <p className="text-white/60 text-sm">
                      {storeSettings.isStoreBusy 
                        ? 'المتجر مغلق مؤقتاً (لا يستقبل طلبات)' 
                        : 'المتجر مفتوح ويستقبل الطلبات'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updateStoreSettings({ isStoreBusy: !storeSettings.isStoreBusy })}
                  className={`px-6 py-2 rounded-xl font-bold transition-all ${
                    storeSettings.isStoreBusy
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {storeSettings.isStoreBusy ? 'فتح المتجر' : 'إغلاق المتجر مؤقتاً'}
                </button>
              </div>
            </div>

            {/* General Settings */}
            <div className="bg-zinc-900 rounded-2xl border border-white/10 p-6 space-y-6">
              <h3 className="text-xl font-bold text-white mb-4">إعدادات الطلب</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-white/60 text-sm block mb-2">الحد الأدنى للطلب (شيكل)</label>
                  <input
                    type="number"
                    value={storeSettings.minOrderAmount}
                    onChange={(e) => updateStoreSettings({ minOrderAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none font-bold text-lg"
                  />
                  <p className="text-white/40 text-xs mt-2">لن يتمكن الزبون من الطلب بأقل من هذا المبلغ</p>
                </div>

                <div>
                  <label className="text-white/60 text-sm block mb-2">رسوم التوصيل (شيكل)</label>
                  <input
                    type="number"
                    value={storeSettings.deliveryFee}
                    onChange={(e) => updateStoreSettings({ deliveryFee: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none font-bold text-lg"
                  />
                  <p className="text-white/40 text-xs mt-2">يتم إضافتها تلقائياً للمجموع</p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
