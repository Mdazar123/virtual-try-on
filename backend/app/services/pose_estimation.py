import mediapipe as mp
import numpy as np
import cv2
from typing import List, Dict, Any, Optional
import base64
from collections import deque

class PoseEstimationService:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,  # Increased complexity for better accuracy
            enable_segmentation=True,
            smooth_segmentation=True,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        self.landmark_history = deque(maxlen=5)  # Store last 5 frames for smoothing

    def smooth_landmarks(self, landmarks: List[Dict[str, float]]) -> List[Dict[str, float]]:
        """Apply temporal smoothing to landmarks"""
        if not self.landmark_history:
            self.landmark_history.append(landmarks)
            return landmarks

        smoothed = []
        alpha = 0.7  # Smoothing factor

        for i in range(len(landmarks)):
            current = landmarks[i]
            history = [frame[i] for frame in self.landmark_history]
            
            smoothed.append({
                "x": self._exponential_smoothing(current["x"], [h["x"] for h in history], alpha),
                "y": self._exponential_smoothing(current["y"], [h["y"] for h in history], alpha),
                "z": self._exponential_smoothing(current["z"], [h["z"] for h in history], alpha),
                "visibility": current["visibility"]
            })

        self.landmark_history.append(smoothed)
        return smoothed

    def _exponential_smoothing(self, current: float, history: List[float], alpha: float) -> float:
        """Apply exponential smoothing to a single value"""
        if not history:
            return current
        
        smoothed = current
        for past in reversed(history):
            smoothed = alpha * past + (1 - alpha) * smoothed
        return smoothed

    def process_frame(self, frame_data: str) -> Dict[str, Any]:
        """
        Process a base64 encoded frame and return pose landmarks
        
        Args:
            frame_data: Base64 encoded image string
        
        Returns:
            Dictionary containing pose landmarks and confidence scores
        """
        try:
            # Decode base64 image
            img_bytes = base64.b64decode(frame_data.split(',')[1])
            img_array = np.frombuffer(img_bytes, dtype=np.uint8)
            frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            
            if frame is None:
                return {"success": False, "error": "Invalid image data"}

            # Convert BGR to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process the frame
            results = self.pose.process(frame_rgb)
            
            if not results.pose_landmarks:
                return {"success": False, "error": "No pose detected"}
            
            # Convert landmarks to list of dictionaries
            landmarks = []
            for landmark in results.pose_landmarks.landmark:
                landmarks.append({
                    "x": landmark.x,
                    "y": landmark.y,
                    "z": landmark.z,
                    "visibility": landmark.visibility
                })
            
            # Apply smoothing
            smoothed_landmarks = self.smooth_landmarks(landmarks)
            
            # Get world landmarks if available
            world_landmarks = None
            if results.pose_world_landmarks:
                world_landmarks = [
                    {
                        "x": landmark.x,
                        "y": landmark.y,
                        "z": landmark.z
                    }
                    for landmark in results.pose_world_landmarks.landmark
                ]

            return {
                "success": True,
                "landmarks": smoothed_landmarks,
                "world_landmarks": world_landmarks,
                "segmentation_mask": results.segmentation_mask is not None
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    def __del__(self):
        self.pose.close() 