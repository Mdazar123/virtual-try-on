export interface ClothingItem {
  id: string;
  name: string;
  modelPath: string;
  thumbnail: string;
  category: 'tops' | 'bottoms' | 'outerwear' | 'dresses';
  defaultScale: number;
  defaultPosition: [number, number, number];
  offset?: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: number;
  };
}

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  index?: number;
  px?: number;
  py?: number;
}

export interface PoseResults {
  landmarks: PoseLandmark[];
  measurements?: {
    shoulder_width: number;
    body_height: number;
    image_width: number;
    image_height: number;
  };
  debug_frame?: string;
  error?: string;
}

export interface PoseData {
  landmarks: Array<{
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }>;
  worldLandmarks?: any;
  clothingRegion?: {
    shoulders: { left: number; right: number };
    chest: { center: number };
    waist: { left: number; right: number };
    hips: { left: number; right: number };
  };
  segmentationMask?: any;
}