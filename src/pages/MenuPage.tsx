import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { menuItems, categories } from '../data/menu';
import { useStore } from '../store/useStore';
import { ProductModal } from '../components/ProductModal';
import { MenuItem } from '../types';

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { addToCart } = useStore();

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter((item: MenuItem) => item.category === selectedCategory);

  const getCategoryIcon = (categoryId: string) => {
    const icons: Record<string, string> = {
      'all': '🍽️',
      'shawarma': '🥙',
      'grills': '🍖',
      'sandwiches': '🥪',
      'grill-sandwiches': '🔥',
      'italian': '🍕',
      'desserts': '🍰',
      'hot-drinks': '☕',
      'cold-drinks': '🧃',
      'salads': '🥗'
    };
    return icons[categoryId] || '🍽️';
  };

  const handleQuickAdd = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    addToCart(item, 1, [], '');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[500px] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=1200')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 text-orange-400 px-4 py-2 rounded-full text-sm">
            <span className="animate-pulse">🔥</span>
            <span>توصيل مجاني للطلبات فوق 50₪</span>
          </div>
          
          {/* Logo/Title */}
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4">
            شاورما <span className="text-orange-500">جنين</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl">
            <span className="text-orange-400">طعم لا يُقاوم</span>
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-yellow-400 text-xl">⭐</span>
              <span className="text-white font-bold">4.9</span>
              <span className="text-gray-400 text-sm">(2,500+ تقييم)</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-green-400 text-xl">⏱️</span>
              <span className="text-white font-bold">30-45 دقيقة</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-orange-400 text-xl">🛵</span>
              <span className="text-white font-bold">توصيل سريع</span>
            </div>
          </div>
          
          {/* CTA Button */}
          <button 
            onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg shadow-orange-500/30 transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
          >
            <span>اطلب الآن</span>
            <span className="text-2xl">👇</span>
          </button>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-orange-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-black to-gray-900 py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🚀', title: 'توصيل سريع', desc: 'خلال 30-45 دقيقة' },
            { icon: '👨‍🍳', title: 'جودة عالية', desc: 'مكونات طازجة يومياً' },
            { icon: '💰', title: 'أسعار منافسة', desc: 'أفضل قيمة مقابل السعر' },
            { icon: '🕐', title: 'متاح دائماً', desc: 'نعمل على مدار الساعة' },
          ].map((feature, index) => (
            <div 
              key={index}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-center hover:bg-gray-800 hover:border-orange-500/30 transition-all duration-300 group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h3 className="text-white font-bold mb-1">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Section */}
      <div id="menu" className="bg-gray-900 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              قائمة <span className="text-orange-500">الطعام</span>
            </h2>
            <p className="text-gray-400">اختر من تشكيلتنا الواسعة من الأطباق الشهية</p>
          </div>

          {/* Categories */}
          <div className="mb-10 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 pb-2 justify-start md:justify-center min-w-max px-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition-all duration-300 whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <span>🍽️</span>
                <span>الكل</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition-all duration-300 whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 scale-105'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  <span>{getCategoryIcon(category.id)}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Products Count */}
          <div className="mb-6 text-center">
            <span className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full text-sm">
              {filteredItems.length} منتج متاح
            </span>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group bg-gray-800 rounded-2xl overflow-hidden cursor-pointer border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1"
              >
                {/* Image Container */}
                <div className="relative h-40 md:h-48 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Quick Add Button */}
                  <button
                    onClick={(e) => handleQuickAdd(e, item)}
                    className="absolute bottom-3 right-3 bg-orange-500 hover:bg-orange-600 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
                  >
                    <span className="text-xl">+</span>
                  </button>
                  
                  {/* Featured Badge */}
                  {index < 3 && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                      ⭐ مميز
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-white text-lg mb-2 group-hover:text-orange-400 transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  
                  {item.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-black text-orange-500">{item.price}</span>
                      <span className="text-gray-400 text-sm">₪</span>
                    </div>
                    <div className="text-gray-500 group-hover:text-orange-400 transition-colors">
                      <span className="text-sm">اضغط للتفاصيل</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">لا توجد منتجات</h3>
              <p className="text-gray-400">جرب اختيار تصنيف آخر</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 py-12 px-4 text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
          جوعان؟ اطلب الآن! 🍽️
        </h3>
        <p className="text-white/80 mb-6">توصيل سريع لباب بيتك</p>
        <div className="flex justify-center gap-4 text-white/90">
          <span>📞 0595864888</span>
          <span>|</span>
          <span>📍 جنين - فلسطين</span>
        </div>
        
        {/* Hidden Admin Access */}
        <div className="pt-8 pb-4 flex justify-center opacity-10 hover:opacity-100 transition-opacity">
          <Link to="/admin-login" className="p-4 text-white">
            <Lock className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Product Modal */}
      {selectedItem && (
        <ProductModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
