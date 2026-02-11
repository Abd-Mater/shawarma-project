import { create } from 'zustand';
import { CartItem, Order, Extra } from './types';
import { createOrder, updateOrderStatus, subscribeToOrders, subscribeToOrder } from './firebase';

interface UserInfo {
  name: string;
  phone: string;
  address: string;
}

interface PaymentInfo {
  method: 'cash' | 'bank' | 'palpay';
  receiptImage?: string;
}

interface AppState {
  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Orders
  orders: Order[];
  currentOrderId: string | null;
  currentOrder: Order | null;
  setOrders: (orders: Order[]) => void;
  setCurrentOrderId: (orderId: string | null) => void;
  setCurrentOrder: (order: Order | null) => void;
  placeOrder: (userInfo: UserInfo, paymentInfo: PaymentInfo) => Promise<string>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  subscribeToAllOrders: () => void;
  subscribeToCurrentOrder: (orderId: string) => void;
  
  // User Info (for auto-fill)
  savedUserInfo: UserInfo | null;
  saveUserInfo: (info: UserInfo) => void;
  
  // Admin Auth
  isAdminLoggedIn: boolean;
  adminLogin: (username: string, password: string) => boolean;
  adminLogout: () => void;
}

// Load cart from localStorage
const loadCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem('shawarma-cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Load user info from localStorage
const loadUserInfo = (): UserInfo | null => {
  try {
    const saved = localStorage.getItem('shawarma-user-info');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

// Load admin session
const loadAdminSession = (): boolean => {
  try {
    return localStorage.getItem('shawarma-admin-session') === 'true';
  } catch {
    return false;
  }
};

export const useStore = create<AppState>((set, get) => ({
  // Cart State
  cart: loadCart(),
  
  addToCart: (item) => {
    set((state) => {
      const newCart = [...state.cart, { ...item, id: Date.now().toString() }];
      localStorage.setItem('shawarma-cart', JSON.stringify(newCart));
      return { cart: newCart };
    });
  },
  
  removeFromCart: (itemId) => {
    set((state) => {
      const newCart = state.cart.filter((item) => item.id !== itemId);
      localStorage.setItem('shawarma-cart', JSON.stringify(newCart));
      return { cart: newCart };
    });
  },
  
  updateQuantity: (itemId, quantity) => {
    set((state) => {
      const newCart = state.cart.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      );
      localStorage.setItem('shawarma-cart', JSON.stringify(newCart));
      return { cart: newCart };
    });
  },
  
  clearCart: () => {
    localStorage.removeItem('shawarma-cart');
    set({ cart: [] });
  },
  
  // Orders State
  orders: [],
  currentOrderId: null,
  currentOrder: null,
  
  setOrders: (orders) => set({ orders }),
  setCurrentOrderId: (orderId) => set({ currentOrderId: orderId }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  
  placeOrder: async (userInfo, paymentInfo) => {
    const { cart, clearCart, saveUserInfo } = get();
    
    const total = cart.reduce((sum, item) => {
      const itemTotal = item.menuItem.price * item.quantity;
      const extrasTotal = item.selectedExtras.reduce((s: number, e: Extra) => s + e.price, 0) * item.quantity;
      return sum + itemTotal + extrasTotal;
    }, 0);
    
    const orderData = {
      items: cart,
      customerName: userInfo.name,
      customerPhone: userInfo.phone,
      customerAddress: userInfo.address,
      paymentMethod: paymentInfo.method,
      receiptImage: paymentInfo.receiptImage || null,
      total,
      status: 'pending'
    };
    
    // Save order to Firebase
    const orderId = await createOrder(orderData);
    
    // Save user info for next time
    saveUserInfo(userInfo);
    
    // Clear cart
    clearCart();
    
    // Set current order ID
    set({ currentOrderId: orderId });
    
    return orderId!;
  },
  
  updateOrderStatus: async (orderId, status) => {
    await updateOrderStatus(orderId, status);
  },
  
  subscribeToAllOrders: () => {
    subscribeToOrders((orders) => {
      set({ orders });
    });
  },
  
  subscribeToCurrentOrder: (orderId) => {
    subscribeToOrder(orderId, (order) => {
      set({ currentOrder: order });
    });
  },
  
  // User Info
  savedUserInfo: loadUserInfo(),
  
  saveUserInfo: (info) => {
    localStorage.setItem('shawarma-user-info', JSON.stringify(info));
    set({ savedUserInfo: info });
  },
  
  // Admin Auth
  isAdminLoggedIn: loadAdminSession(),
  
  adminLogin: (username, password) => {
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('shawarma-admin-session', 'true');
      set({ isAdminLoggedIn: true });
      return true;
    }
    return false;
  },
  
  adminLogout: () => {
    localStorage.removeItem('shawarma-admin-session');
    set({ isAdminLoggedIn: false });
  },
}));
