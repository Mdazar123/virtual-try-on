export interface ClothingItem {
  id: string;
  name: string;
  modelPath: string;
  thumbnailPath: string;
  category: string;
  offset: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: number;
  };
  defaultScale: number;
  defaultPosition: [number, number, number];
}

// Landmark data from MediaPipe
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

// Pose data from backend service
export interface PoseData {
  landmarks: Array<{
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }>;
  timestamp: number;
}

// Extended pose results with additional measurements
export interface ExtendedPoseResults extends PoseData {
  measurements?: {
    shoulder_width: number;
    body_height: number;
    image_width: number;
    image_height: number;
  };
  debug_frame?: string;
}

export interface ClothingOffset {
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  scale: number;
}