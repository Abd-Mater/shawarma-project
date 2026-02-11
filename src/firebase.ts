import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, update, get, remove, set } from 'firebase/database';
import { MenuItem } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyBQWiyyqg9GxN4hfPafW_O4xsKK9azkdTQ",
  authDomain: "shawarma-app-81892.firebaseapp.com",
  projectId: "shawarma-app-81892",
  storageBucket: "shawarma-app-81892.firebasestorage.app",
  messagingSenderId: "766950724326",
  appId: "1:766950724326:web:e51ea5e138a3d2cc292127",
  measurementId: "G-3XZHS8BXWL",
  databaseURL: "https://shawarma-app-81892-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ============ Orders Database Reference ============
export const ordersRef = ref(database, 'orders');

// ============ Orders Functions ============
export const createOrder = async (orderData: any) => {
  const newOrderRef = push(ordersRef);
  const orderId = newOrderRef.key;
  const orderWithId = {
    ...orderData,
    id: orderId,
    createdAt: Date.now(),
    status: 'pending'
  };
  await update(newOrderRef, orderWithId);
  return orderId;
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const orderRef = ref(database, `orders/${orderId}`);
  await update(orderRef, { status, updatedAt: Date.now() });
};

export const getOrderById = async (orderId: string) => {
  const orderRef = ref(database, `orders/${orderId}`);
  const snapshot = await get(orderRef);
  return snapshot.val();
};

export const subscribeToOrders = (callback: (orders: any[]) => void) => {
  return onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const ordersArray = Object.values(data) as any[];
      ordersArray.sort((a, b) => b.createdAt - a.createdAt);
      callback(ordersArray);
    } else {
      callback([]);
    }
  });
};

export const subscribeToOrder = (orderId: string, callback: (order: any) => void) => {
  const orderRef = ref(database, `orders/${orderId}`);
  return onValue(orderRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
};

// ============ Products/Menu Database Reference ============
export const productsRef = ref(database, 'products');

// ============ Products/Menu Functions ============
export const addProduct = async (productData: Omit<MenuItem, 'id'>) => {
  const newProductRef = push(productsRef);
  const productId = newProductRef.key;
  const productWithId = {
    ...productData,
    id: productId,
    isAvailable: productData.isAvailable !== false
  };
  await set(newProductRef, productWithId);
  return productId;
};

export const updateProduct = async (productId: string, updates: Partial<MenuItem>) => {
  const productRef = ref(database, `products/${productId}`);
  await update(productRef, updates);
};

export const deleteProduct = async (productId: string) => {
  const productRef = ref(database, `products/${productId}`);
  await remove(productRef);
};

export const toggleProductAvailability = async (productId: string, isAvailable: boolean) => {
  const productRef = ref(database, `products/${productId}`);
  await update(productRef, { isAvailable });
};

export const subscribeToProducts = (callback: (products: MenuItem[]) => void) => {
  return onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const productsArray = Object.values(data) as MenuItem[];
      callback(productsArray);
    } else {
      callback([]);
    }
  });
};

// Initialize menu with default products if empty
export const initializeMenu = async (defaultProducts: Omit<MenuItem, 'id'>[]) => {
  const snapshot = await get(productsRef);
  if (!snapshot.exists()) {
    console.log('Initializing menu in Firebase...');
    for (const product of defaultProducts) {
      await addProduct(product);
    }
    console.log('Menu initialized successfully!');
    return true;
  }
  return false;
};

// ============ Store Settings Reference ============
export const settingsRef = ref(database, 'settings');

// ============ Store Settings Functions ============
import { StoreSettings } from './types';

export const updateStoreSettings = async (settings: Partial<StoreSettings>) => {
  await update(settingsRef, settings);
};

export const subscribeToSettings = (callback: (settings: StoreSettings) => void) => {
  return onValue(settingsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    } else {
      // Default settings
      const defaultSettings: StoreSettings = {
        minOrderAmount: 0,
        isStoreBusy: false,
        deliveryFee: 0,
        isClosed: false
      };
      // Initialize if empty
      update(settingsRef, defaultSettings);
      callback(defaultSettings);
    }
  });
};

export { database, ref, push, onValue, update, get, remove, set };
