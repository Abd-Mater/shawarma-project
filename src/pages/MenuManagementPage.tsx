import { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { 
  subscribeToProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  toggleProductAvailability,
  initializeMenu 
} from '../firebase';
import { menuItems as defaultMenuItems, categories } from '../data/menu';

export default function MenuManagementPage() {
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'shawarma' as MenuItem['category'],
    image: ''
  });

  useEffect(() => {
    const unsubscribe = subscribeToProducts((fetchedProducts) => {
      setProducts(fetchedProducts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      image: formData.image || 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400',
      extras: [],
      isAvailable: true
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        alert('تم تحديث المنتج بنجاح!');
      } else {
        await addProduct(productData);
        alert('تم إضافة المنتج بنجاح!');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('حدث خطأ أثناء حفظ المنتج');
    }
  };

  const handleEdit = (product: MenuItem) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image: product.image
    });
    setShowAddModal(true);
  };

  const handleDelete = async (productId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await deleteProduct(productId);
        alert('تم حذف المنتج بنجاح!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('حدث خطأ أثناء حذف المنتج');
      }
    }
  };

  const handleToggleAvailability = async (product: MenuItem) => {
    try {
      await toggleProductAvailability(product.id, !product.isAvailable);
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('حدث خطأ أثناء تحديث حالة المنتج');
    }
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

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6">
        <h1 className="text-2xl font-bold text-center">🍽️ إدارة قائمة الطعام</h1>
        <p className="text-center text-orange-100 mt-1">إضافة وتعديل الوجبات</p>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-2xl font-bold text-white">{products.length}</div>
          <div className="text-gray-400 text-sm">إجمالي المنتجات</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-2xl font-bold text-green-400">
            {products.filter(p => p.isAvailable !== false).length}
          </div>
          <div className="text-gray-400 text-sm">متوفر</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
          <div className="text-2xl font-bold text-red-400">
            {products.filter(p => p.isAvailable === false).length}
          </div>
          <div className="text-gray-400 text-sm">غير متوفر</div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 flex gap-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          <span>➕</span> إضافة وجبة جديدة
        </button>
        {products.length === 0 && (
          <button
            onClick={handleInitializeMenu}
            disabled={isInitializing}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            {isInitializing ? 'جاري التحميل...' : '📥 تحميل القائمة الافتراضية'}
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-300 border border-gray-700'
            }`}
          >
            الكل ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter(p => p.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-800 text-gray-300 border border-gray-700'
                }`}
              >
                {cat.icon} {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Products List */}
      <div className="px-4 space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-4">🍽️</div>
            <p>لا توجد منتجات في هذا التصنيف</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`bg-gray-800 rounded-xl p-4 border transition-all ${
                product.isAvailable === false
                  ? 'border-red-500/50 opacity-60'
                  : 'border-gray-700'
              }`}
            >
              <div className="flex gap-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white flex items-center gap-2">
                        {product.name}
                        {product.isAvailable === false && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                            غير متوفر
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-1">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-orange-400 font-bold">{product.price} ₪</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-500 text-sm">{getCategoryName(product.category)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => handleToggleAvailability(product)}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                    product.isAvailable === false
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  }`}
                >
                  {product.isAvailable === false ? '✅ تفعيل' : '⛔ تعطيل'}
                </button>
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 py-2 rounded-lg font-medium transition-colors"
                >
                  ✏️ تعديل
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {editingProduct ? '✏️ تعديل الوجبة' : '➕ إضافة وجبة جديدة'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">اسم الوجبة *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">السعر (₪) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  min="0"
                  step="0.5"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">التصنيف *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as MenuItem['category'] })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">رابط الصورة</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition-colors"
                >
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة الوجبة'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-bold transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
