import cv2
import mediapipe as mp
import numpy as np
import base64
from io import BytesIO
from PIL import Image

class PoseDetector:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.mp_draw = mp.solutions.drawing_utils
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=0,  # Reduced complexity for better performance
            enable_segmentation=False,  # Disable segmentation since we don't need it
            smooth_landmarks=True,
            min_detection_confidence=0.3,  # Lower threshold for faster detection
            min_tracking_confidence=0.3
        )

    async def process_frame(self, base64_frame):
        try:
            # Convert base64 to image
            encoded_data = base64_frame.split(',')[1]
            nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Get image dimensions
            height, width, _ = frame.shape
            
            # Convert BGR to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process the frame
            results = self.pose.process(frame_rgb)
            
            if results.pose_landmarks:
                # Convert landmarks to normalized coordinates
                landmarks = []
                for idx, landmark in enumerate(results.pose_landmarks.landmark):
                    landmarks.append({
                        'x': landmark.x,
                        'y': landmark.y,
                        'z': landmark.z,
                        'visibility': landmark.visibility,
                        'index': idx
                    })
                
                # Calculate measurements
                left_shoulder = results.pose_landmarks.landmark[11]
                right_shoulder = results.pose_landmarks.landmark[12]
                left_hip = results.pose_landmarks.landmark[23]
                right_hip = results.pose_landmarks.landmark[24]
                
                shoulder_width = abs(right_shoulder.x - left_shoulder.x)
                body_height = abs((left_shoulder.y + right_shoulder.y) / 2 - (left_hip.y + right_hip.y) / 2)
                
                return {
                    'landmarks': landmarks,
                    'measurements': {
                        'shoulder_width': float(shoulder_width),
                        'body_height': float(body_height),
                        'image_width': width,
                        'image_height': height
                    }
                }
            
            return {
                'landmarks': None,
                'measurements': None,
                'error': 'No pose detected'
            }
            
        except Exception as e:
            print(f"Error processing frame: {e}")
            return {
                'landmarks': None,
                'measurements': None,
                'error': str(e)
            }