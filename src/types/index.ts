export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'shawarma' | 'grills' | 'sandwiches' | 'grill-sandwiches' | 'italian' | 'desserts' | 'hot-drinks' | 'cold-drinks' | 'salads';
  extras: Extra[];
  isAvailable?: boolean;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  selectedExtras: Extra[];
  specialNotes: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: OrderStatus;
  total: number;
  createdAt: number;
  paymentMethod: 'cash' | 'bank' | 'palpay';
  receiptImage?: string;
}

export interface StoreSettings {
  minOrderAmount: number;
  isStoreBusy: boolean;
  deliveryFee: number;
  isClosed: boolean; // للإغلاق اليدوي أو خارج ساعات العمل
}
