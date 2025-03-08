import React from 'react';
import { ClothingItem } from '@/types/clothing'
import Image from 'next/image'

interface ClothingSelectorProps {
  items: ClothingItem[];
  selectedItem: ClothingItem;
  onSelect: (item: ClothingItem) => void;
}

const ClothingSelector: React.FC<ClothingSelectorProps> = ({ 
  items, 
  selectedItem, 
  onSelect 
}) => {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Select Clothing</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
              selectedItem.id === item.id
                ? 'border-blue-500'
                : 'border-transparent'
            }`}
            onClick={() => onSelect(item)}
          >
            <div className="aspect-square relative">
              <Image
                src={item.thumbnailPath}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
              <p className="text-sm truncate">{item.name}</p>
              <p className="text-xs text-gray-300">{item.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClothingSelector;
