import { create } from 'zustand';
import { CartItem, Order, OrderStatus, MenuItem, Extra } from '../types';
import { createOrder as firebaseCreateOrder, updateOrderStatus as firebaseUpdateOrderStatus, subscribeToOrders, subscribeToOrder } from '../firebase';

interface AppState {
  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity: number, extras: Extra[], notes: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;

  // Orders (from Firebase)
  orders: Order[];
  currentOrder: Order | null;
  isLoadingOrders: boolean;
  createOrder: (customerName: string, customerPhone: string, customerAddress: string, paymentMethod?: 'cash' | 'bank' | 'palpay', receiptImage?: string) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  setCurrentOrder: (order: Order | null) => void;
  getOrderById: (orderId: string) => Order | undefined;
  getUserOrders: (phone: string) => Order[];
  subscribeToAllOrders: () => void;
  subscribeToOrderUpdates: (orderId: string) => void;

  // User info (saved for convenience)
  savedUserInfo: {
    name: string;
    phone: string;
    address: string;
  } | null;
  saveUserInfo: (name: string, phone: string, address: string) => void;

  // Admin
  isAdmin: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
}

// Load cart from localStorage
const loadCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem('shawarma-jenin-cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Save cart to localStorage
const saveCart = (cart: CartItem[]) => {
  try {
    localStorage.setItem('shawarma-jenin-cart', JSON.stringify(cart));
  } catch {
    // Ignore
  }
};

// Load user info from localStorage
const loadUserInfo = (): AppState['savedUserInfo'] => {
  try {
    const saved = localStorage.getItem('shawarma-jenin-user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

// Load admin session
const loadAdminSession = (): boolean => {
  try {
    return localStorage.getItem('shawarma-jenin-admin') === 'true';
  } catch {
    return false;
  }
};

// Save user info to localStorage
const saveUserInfoToStorage = (info: AppState['savedUserInfo']) => {
  try {
    if (info) {
      localStorage.setItem('shawarma-jenin-user', JSON.stringify(info));
    }
  } catch {
    // Ignore
  }
};

export const useStore = create<AppState>()((set, get) => ({
  // Cart State
  cart: loadCart(),
  
  addToCart: (item, quantity, extras, notes) => {
    const cartItem: CartItem = {
      id: `${item.id}-${Date.now()}`,
      menuItem: item,
      quantity,
      selectedExtras: extras,
      specialNotes: notes,
    };
    set((state) => {
      const newCart = [...state.cart, cartItem];
      saveCart(newCart);
      return { cart: newCart };
    });
  },

  removeFromCart: (cartItemId) => {
    set((state) => {
      const newCart = state.cart.filter((item) => item.id !== cartItemId);
      saveCart(newCart);
      return { cart: newCart };
    });
  },

  updateQuantity: (cartItemId, quantity) => {
    set((state) => {
      const newCart = state.cart.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      );
      saveCart(newCart);
      return { cart: newCart };
    });
  },

  clearCart: () => {
    saveCart([]);
    set({ cart: [] });
  },

  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => {
      const extrasTotal = item.selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
      return total + (item.menuItem.price + extrasTotal) * item.quantity;
    }, 0);
  },

  getCartCount: () => {
    const { cart } = get();
    return cart.reduce((count, item) => count + item.quantity, 0);
  },

  // Orders State
  orders: [],
  currentOrder: null,
  isLoadingOrders: false,

  createOrder: async (customerName, customerPhone, customerAddress, paymentMethod = 'cash', receiptImage) => {
    const { cart, getCartTotal, clearCart, saveUserInfo } = get();
    
    const orderData = {
      items: cart,
      customerName,
      customerPhone,
      customerAddress,
      total: getCartTotal(),
      paymentMethod,
      receiptImage: receiptImage || null,
    };
    
    // Save order to Firebase
    const orderId = await firebaseCreateOrder(orderData);
    
    const order: Order = {
      id: orderId!,
      items: orderData.items,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod,
      receiptImage: orderData.receiptImage || undefined,
      status: 'pending',
      createdAt: Date.now(),
    };
    
    set((state) => ({
      orders: [...state.orders, order],
      currentOrder: order,
    }));
    
    saveUserInfo(customerName, customerPhone, customerAddress);
    clearCart();
    
    return order;
  },

  updateOrderStatus: async (orderId, status) => {
    await firebaseUpdateOrderStatus(orderId, status);
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      ),
      currentOrder:
        state.currentOrder?.id === orderId
          ? { ...state.currentOrder, status }
          : state.currentOrder,
    }));
  },

  cancelOrder: async (orderId) => {
    await firebaseUpdateOrderStatus(orderId, 'cancelled');
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, status: 'cancelled' as const } : order
      ),
      currentOrder:
        state.currentOrder?.id === orderId
          ? { ...state.currentOrder, status: 'cancelled' as const }
          : state.currentOrder,
    }));
  },

  setCurrentOrder: (order) => set({ currentOrder: order }),

  getOrderById: (orderId) => {
    const { orders } = get();
    return orders.find((order) => order.id === orderId);
  },

  getUserOrders: (phone) => {
    const { orders } = get();
    return orders.filter((order) => order.customerPhone === phone);
  },

  subscribeToAllOrders: () => {
    set({ isLoadingOrders: true });
    subscribeToOrders((orders: Order[]) => {
      set({ orders, isLoadingOrders: false });
    });
  },

  subscribeToOrderUpdates: (orderId) => {
    subscribeToOrder(orderId, (order: Order) => {
      if (order) {
        set((state) => ({
          currentOrder: order,
          orders: state.orders.map((o) => (o.id === orderId ? order : o)),
        }));
      }
    });
  },

  // User Info
  savedUserInfo: loadUserInfo(),
  saveUserInfo: (name, phone, address) => {
    const info = { name, phone, address };
    saveUserInfoToStorage(info);
    set({ savedUserInfo: info });
  },

  // Admin State
  isAdmin: loadAdminSession(),
  login: (pin) => {
    if (pin === '1234') {
      localStorage.setItem('shawarma-jenin-admin', 'true');
      set({ isAdmin: true });
      return true;
    }
    return false;
  },
  logout: () => {
    localStorage.removeItem('shawarma-jenin-admin');
    set({ isAdmin: false });
  },
}));
