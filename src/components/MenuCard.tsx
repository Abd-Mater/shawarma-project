import { Plus } from 'lucide-react';
import { MenuItem } from '../types';

interface MenuCardProps {
  item: MenuItem;
  onClick: () => void;
}

export function MenuCard({ item, onClick }: MenuCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-orange-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/10"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-3 right-3">
          <span className="px-3 py-1 bg-orange-500 text-white text-sm font-bold rounded-full">
            {item.price} ر.س
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
        <p className="text-sm text-white/60 line-clamp-2 mb-3">{item.description}</p>
        <button className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Plus className="w-5 h-5" />
          أضف للسلة
        </button>
      </div>
    </div>
  );
}
