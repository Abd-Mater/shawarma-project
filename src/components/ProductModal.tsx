import { useState } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { MenuItem, Extra } from '../types';
import { useStore } from '../store/useStore';

interface ProductModalProps {
  item: MenuItem;
  onClose: () => void;
}

export function ProductModal({ item, onClose }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [specialNotes, setSpecialNotes] = useState('');
  const { addToCart } = useStore();

  const toggleExtra = (extra: Extra) => {
    setSelectedExtras((prev) =>
      prev.find((e) => e.id === extra.id)
        ? prev.filter((e) => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
  const totalPrice = (item.price + extrasTotal) * quantity;

  const handleAddToCart = () => {
    addToCart(item, quantity, selectedExtras, specialNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Image */}
        <div className="relative h-64">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 right-4">
            <span className="px-4 py-2 bg-orange-500 text-white text-lg font-bold rounded-xl">
              {item.price} ₪
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{item.name}</h2>
            <p className="text-white/60">{item.description}</p>
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">الكمية</span>
            <div className="flex items-center gap-4 bg-white/10 rounded-xl p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-white font-bold text-xl w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Extras */}
          {item.extras.length > 0 && (
            <div>
              <h3 className="text-white font-medium mb-3">الإضافات</h3>
              <div className="space-y-2">
                {item.extras.map((extra) => {
                  const isSelected = selectedExtras.find((e) => e.id === extra.id);
                  return (
                    <button
                      key={extra.id}
                      onClick={() => toggleExtra(extra)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-orange-500/20 border-2 border-orange-500'
                          : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-orange-500' : 'bg-white/20'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-white">{extra.name}</span>
                      </div>
                      <span className="text-orange-400 font-medium">
                        {extra.price > 0 ? `+${extra.price} ₪` : 'مجاناً'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Notes */}
          <div>
            <h3 className="text-white font-medium mb-3">ملاحظات خاصة</h3>
            <textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="أي ملاحظات أخرى؟"
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500 resize-none"
              rows={2}
            />
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30"
          >
            <Plus className="w-6 h-6" />
            <span>أضف للسلة</span>
            <span className="px-3 py-1 bg-white/20 rounded-lg">{totalPrice} ₪</span>
          </button>
        </div>
      </div>
    </div>
  );
}
