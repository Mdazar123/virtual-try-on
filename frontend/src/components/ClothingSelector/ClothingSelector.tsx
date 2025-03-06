import React from 'react';
import { ClothingItem } from '@/types/clothing'

interface ClothingSelectorProps {
  items: ClothingItem[];
  selectedItem?: ClothingItem;
  onSelect: (item: ClothingItem) => void;
}

const ClothingSelector: React.FC<ClothingSelectorProps> = ({ 
  items, 
  selectedItem, 
  onSelect 
}) => {
  return (
    <div className="clothing-selector">
      <h3 className="text-lg font-semibold mb-4">Select Clothing</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
        {items.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item)}
            className={`
              cursor-pointer rounded-lg overflow-hidden border-2 transition-all
              ${selectedItem?.id === item.id ? 'border-blue-500 scale-105' : 'border-transparent hover:border-gray-300'}
            `}
          >
            <div className="aspect-square relative">
              <img 
                src={item.thumbnail} 
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-2 bg-white">
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-gray-500 capitalize">{item.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClothingSelector;
