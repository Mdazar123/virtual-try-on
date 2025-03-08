import { ClothingItem } from '@/types/clothing';

export const clothingItems: ClothingItem[] = [
  {
    id: 'womens-shirt-1',
    name: 'Women\'s White Shirt',
    category: 'tops',
    modelPath: '/models/womens_shirt/scene.gltf',
    thumbnailPath: '/images/womens_shirt_thumb.jpg',
    offset: {
      position: { x: 0, y: 0.1, z: -0.2 },
      rotation: { x: 0, y: Math.PI, z: 0 },
      scale: 1.0
    }
  },
  // Add more clothing items here
]; 