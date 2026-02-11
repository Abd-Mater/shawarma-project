import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, MapPin, Phone, User, AlertCircle, Upload, X, CreditCard, Banknote, Smartphone, Ban, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { subscribeToSettings } from '../firebase';
import { StoreSettings } from '../types';

type PaymentMethod = 'cash' | 'bank' | 'palpay';

export function CartPage() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getCartTotal, createOrder, savedUserInfo } = useStore();
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string; receipt?: string }>({});
  
  // Settings State
  const [settings, setSettings] = useState<StoreSettings>({
    minOrderAmount: 0,
    isStoreBusy: false,
    deliveryFee: 10,
    isClosed: false
  });

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // Subscribe to Settings
  useEffect(() => {
    const unsubscribe = subscribeToSettings((data) => {
      if (data) setSettings(data);
    });
    return () => unsubscribe();
  }, []);

  // Pre-fill saved user info
  useEffect(() => {
    if (savedUserInfo) {
      setCustomerName(savedUserInfo.name);
      setCustomerPhone(savedUserInfo.phone);
      setCustomerAddress(savedUserInfo.address);
    }
  }, [savedUserInfo]);

  const total = getCartTotal();
  const deliveryFee = settings.deliveryFee || 0;
  const grandTotal = total + deliveryFee;
  const isMinOrderMet = total >= settings.minOrderAmount;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (!isMinOrderMet) {
      alert(`الحد الأدنى للطلب هو ${settings.minOrderAmount} شيكل`);
      return;
    }
    if (settings.isStoreBusy) {
      alert('عذراً، المتجر لا يستقبل طلبات حالياً بسبب ضغط العمل.');
      return;
    }
    setStep('checkout');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        if (errors.receipt) setErrors({ ...errors, receipt: undefined });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setReceiptImage(null);
  };

  const validateForm = () => {
    const newErrors: { name?: string; phone?: string; address?: string; receipt?: string } = {};
    
    // التحقق من الاسم - يجب أن يكون 10 أحرف على الأقل
    if (!customerName.trim()) {
      newErrors.name = 'الاسم مطلوب';
    } else if (customerName.trim().length < 10) {
      newErrors.name = 'الاسم يجب أن يكون 10 أحرف على الأقل';
    } else if (customerName.trim().length > 50) {
      newErrors.name = 'الاسم يجب أن لا يتجاوز 50 حرف';
    }
    
    // التحقق من رقم الهاتف - يجب أن يكون 10 أرقام ويبدأ بـ 05
    const phoneDigits = customerPhone.replace(/\D/g, '');
    const phoneRegex = /^05\d{8}$/;
    
    if (!customerPhone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!phoneRegex.test(phoneDigits)) {
      newErrors.phone = 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 05 ويتكون من 10 أرقام)';
    }
    
    // التحقق من العنوان - يجب أن يكون 10 أحرف على الأقل
    if (!customerAddress.trim()) {
      newErrors.address = 'العنوان مطلوب';
    } else if (customerAddress.trim().length < 10) {
      newErrors.address = 'العنوان يجب أن يكون 10 أحرف على الأقل';
    }

    // التحقق من صورة الإيصال للدفع الإلكتروني
    if ((paymentMethod === 'bank' || paymentMethod === 'palpay') && !receiptImage) {
      newErrors.receipt = 'يجب إرفاق صورة إيصال التحويل';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    setIsPlacingOrder(true);
    try {
      const order = await createOrder(customerName, customerPhone, customerAddress, paymentMethod, receiptImage || undefined);
      navigate(`/tracking/${order.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cart.length === 0 && step === 'cart') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-white/40" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">السلة فارغة</h2>
          <p className="text-white/60 mb-6">لم تقم بإضافة أي منتجات بعد</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            تصفح القائمة
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div
            className={`flex items-center gap-2 ${
              step === 'cart' ? 'text-orange-500' : 'text-white/40'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step === 'cart' ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/40'
              }`}
            >
              1
            </div>
            <span className="font-medium">السلة</span>
          </div>
          <div className="w-16 h-0.5 bg-white/20" />
          <div
            className={`flex items-center gap-2 ${
              step === 'checkout' ? 'text-orange-500' : 'text-white/40'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step === 'checkout' ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/40'
              }`}
            >
              2
            </div>
            <span className="font-medium">التوصيل</span>
          </div>
        </div>

        {step === 'cart' ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-6">سلة المشتريات</h1>

            {settings.isStoreBusy && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 mb-6 text-center animate-pulse">
                <Ban className="w-12 h-12 text-red-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-red-500 mb-1">المتجر مغلق مؤقتاً</h3>
                <p className="text-red-400">عذراً، لا نستقبل طلبات حالياً بسبب ضغط العمل. يرجى المحاولة لاحقاً.</p>
              </div>
            )}

            {!isMinOrderMet && cart.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-2xl p-4 mb-6 flex items-center gap-4">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                <div>
                  <h3 className="font-bold text-yellow-500">الحد الأدنى للطلب لم يكتمل</h3>
                  <p className="text-yellow-400 text-sm">
                    يجب أن يكون مجموع الطلب {settings.minOrderAmount} ₪ على الأقل (باقي {settings.minOrderAmount - total} ₪)
                  </p>
                </div>
              </div>
            )}

            {/* Cart Items */}
            <div className="space-y-4 mb-8">
              {cart.map((item) => {
                const extrasTotal = item.selectedExtras.reduce((sum, e) => sum + e.price, 0);
                const itemTotal = (item.menuItem.price + extrasTotal) * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="bg-white/5 rounded-2xl p-4 border border-white/10"
                  >
                    <div className="flex gap-4">
                      <img
                        src={item.menuItem.image}
                        alt={item.menuItem.name}
                        className="w-24 h-24 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-white font-bold">{item.menuItem.name}</h3>
                            {item.selectedExtras.length > 0 && (
                              <p className="text-sm text-orange-400 mt-1">
                                {item.selectedExtras.map((e) => e.name).join('، ')}
                              </p>
                            )}
                            {item.specialNotes && (
                              <p className="text-sm text-white/50 mt-1">
                                ملاحظة: {item.specialNotes}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3 bg-white/10 rounded-xl p-1">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, Math.max(1, item.quantity - 1))
                              }
                              className="p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-white font-bold w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-orange-500 font-bold text-lg">
                            {itemTotal} ₪
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-white/70">
                  <span>المجموع الفرعي</span>
                  <span>{total} ₪</span>
                </div>
                <div className="flex items-center justify-between text-white/70">
                  <span>رسوم التوصيل</span>
                  <span>{deliveryFee} ₪</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex items-center justify-between text-white font-bold text-xl">
                  <span>الإجمالي</span>
                  <span className="text-orange-500">{grandTotal} ₪</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={!isMinOrderMet || settings.isStoreBusy}
                className={`w-full py-4 font-bold text-lg rounded-xl transition-all shadow-lg ${
                  !isMinOrderMet || settings.isStoreBusy
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-orange-500/30'
                }`}
              >
                {settings.isStoreBusy 
                  ? 'المتجر مغلق مؤقتاً' 
                  : !isMinOrderMet 
                    ? `أضف ${settings.minOrderAmount - total} ₪ لإكمال الطلب` 
                    : 'متابعة الطلب'}
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setStep('cart')}
              className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              العودة للسلة
            </button>

            <h1 className="text-2xl font-bold text-white mb-6">معلومات التوصيل</h1>

            {savedUserInfo && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                <p className="text-green-400 text-sm">
                  ✓ تم تعبئة بياناتك المحفوظة تلقائياً
                </p>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div>
                <label className="flex items-center gap-2 text-white/70 mb-2">
                  <User className="w-5 h-5" />
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  placeholder="أدخل اسمك (10 أحرف على الأقل)"
                  className={`w-full p-4 bg-white/5 border rounded-xl text-white placeholder:text-white/40 focus:outline-none ${
                    errors.name ? 'border-red-500' : 'border-white/10 focus:border-orange-500'
                  }`}
                />
                {errors.name && (
                  <p className="flex items-center gap-1 text-red-400 text-sm mt-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-white/70 mb-2">
                  <Phone className="w-5 h-5" />
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => {
                    // السماح فقط بالأرقام
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setCustomerPhone(value);
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                  placeholder="05xxxxxxxx (10 أرقام)"
                  className={`w-full p-4 bg-white/5 border rounded-xl text-white placeholder:text-white/40 focus:outline-none ${
                    errors.phone ? 'border-red-500' : 'border-white/10 focus:border-orange-500'
                  }`}
                />
                {errors.phone && (
                  <p className="flex items-center gap-1 text-red-400 text-sm mt-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phone}
                  </p>
                )}
                <p className="text-white/40 text-sm mt-1">
                  {customerPhone.length}/10 أرقام
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-white/70 mb-2">
                  <MapPin className="w-5 h-5" />
                  عنوان التوصيل
                </label>
                <textarea
                  value={customerAddress}
                  onChange={(e) => {
                    setCustomerAddress(e.target.value);
                    if (errors.address) setErrors({ ...errors, address: undefined });
                  }}
                  placeholder="الحي، الشارع، رقم المبنى... (10 أحرف على الأقل)"
                  rows={3}
                  className={`w-full p-4 bg-white/5 border rounded-xl text-white placeholder:text-white/40 focus:outline-none resize-none ${
                    errors.address ? 'border-red-500' : 'border-white/10 focus:border-orange-500'
                  }`}
                />
                {errors.address && (
                  <p className="flex items-center gap-1 text-red-400 text-sm mt-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.address}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-500" />
                طريقة الدفع
              </h3>
              
              <div className="space-y-3">
                {/* Cash on Delivery */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('cash');
                    setReceiptImage(null);
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-orange-500/20 border-2 border-orange-500'
                      : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    paymentMethod === 'cash' ? 'bg-orange-500' : 'bg-white/20'
                  }`}>
                    <Banknote className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right flex-1">
                    <span className="text-white font-medium block">💵 الدفع عند الاستلام</span>
                    <span className="text-white/50 text-sm">ادفع نقداً عند استلام الطلب</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === 'cash' ? 'border-orange-500 bg-orange-500' : 'border-white/30'
                  }`}>
                    {paymentMethod === 'cash' && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </button>

                {/* Bank Transfer */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${
                    paymentMethod === 'bank'
                      ? 'bg-orange-500/20 border-2 border-orange-500'
                      : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    paymentMethod === 'bank' ? 'bg-orange-500' : 'bg-white/20'
                  }`}>
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right flex-1">
                    <span className="text-white font-medium block">🏦 تحويل بنكي - بنك فلسطين</span>
                    <span className="text-white/50 text-sm">حوّل المبلغ وأرفق صورة الإيصال</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === 'bank' ? 'border-orange-500 bg-orange-500' : 'border-white/30'
                  }`}>
                    {paymentMethod === 'bank' && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </button>

                {/* Bank Details */}
                {paymentMethod === 'bank' && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mr-12">
                    <h4 className="text-blue-400 font-medium mb-3">معلومات الحساب البنكي:</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-white">
                        <span className="text-white/60">رقم الحساب: </span>
                        <span className="font-mono bg-white/10 px-2 py-1 rounded">PS00-PALS-0000-0000-0000-0000</span>
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">اسم الحساب: </span>
                        شاورما جنين
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">المبلغ المطلوب: </span>
                        <span className="text-orange-500 font-bold">{grandTotal} ₪</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* PalPay */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('palpay')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${
                    paymentMethod === 'palpay'
                      ? 'bg-orange-500/20 border-2 border-orange-500'
                      : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    paymentMethod === 'palpay' ? 'bg-orange-500' : 'bg-white/20'
                  }`}>
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right flex-1">
                    <span className="text-white font-medium block">📱 محفظة PalPay</span>
                    <span className="text-white/50 text-sm">حوّل عبر تطبيق PalPay وأرفق الإيصال</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    paymentMethod === 'palpay' ? 'border-orange-500 bg-orange-500' : 'border-white/30'
                  }`}>
                    {paymentMethod === 'palpay' && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </button>

                {/* PalPay Details */}
                {paymentMethod === 'palpay' && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mr-12">
                    <h4 className="text-purple-400 font-medium mb-3">معلومات محفظة PalPay:</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-white">
                        <span className="text-white/60">رقم المحفظة: </span>
                        <span className="font-mono bg-white/10 px-2 py-1 rounded">0595864888</span>
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">اسم المستلم: </span>
                        شاورما جنين
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">المبلغ المطلوب: </span>
                        <span className="text-orange-500 font-bold">{grandTotal} ₪</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Receipt Upload */}
                {(paymentMethod === 'bank' || paymentMethod === 'palpay') && (
                  <div className="mr-12 mt-4">
                    <label className="text-white/70 text-sm mb-2 block">
                      📎 إرفاق صورة إيصال التحويل <span className="text-red-400">*</span>
                    </label>
                    
                    {!receiptImage ? (
                      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        errors.receipt 
                          ? 'border-red-500 bg-red-500/10' 
                          : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-orange-500/50'
                      }`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className={`w-8 h-8 mb-2 ${errors.receipt ? 'text-red-400' : 'text-white/40'}`} />
                          <p className={`text-sm ${errors.receipt ? 'text-red-400' : 'text-white/60'}`}>
                            اضغط لرفع صورة الإيصال
                          </p>
                          <p className="text-xs text-white/40 mt-1">PNG, JPG حتى 5MB</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    ) : (
                      <div className="relative">
                        <img 
                          src={receiptImage} 
                          alt="إيصال التحويل" 
                          className="w-full h-48 object-cover rounded-xl border border-green-500"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                          ✓ تم رفع الصورة
                        </div>
                      </div>
                    )}
                    
                    {errors.receipt && (
                      <p className="flex items-center gap-1 text-red-400 text-sm mt-2">
                        <AlertCircle className="w-4 h-4" />
                        {errors.receipt}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between text-white font-bold text-xl mb-6">
                <span>الإجمالي</span>
                <span className="text-orange-500">{grandTotal} ₪</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? 'جاري إرسال الطلب...' : 'تأكيد الطلب'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
