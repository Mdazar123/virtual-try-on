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
            
            # Process the frame with image dimensions
            results = self.pose.process(frame_rgb)
            
            # Create normalized rect for landmark projection
            image_info = {
                'image_height': height,
                'image_width': width
            }
            
            # Debug: Draw pose landmarks on frame
            annotated_frame = frame.copy()
            if results.pose_landmarks:
                self.mp_draw.draw_landmarks(
                    annotated_frame,
                    results.pose_landmarks,
                    self.mp_pose.POSE_CONNECTIONS,
                    self.mp_draw.DrawingSpec(color=(245,117,66), thickness=2, circle_radius=2),
                    self.mp_draw.DrawingSpec(color=(245,66,230), thickness=2, circle_radius=2)
                )
                
                landmarks = []
                for idx, landmark in enumerate(results.pose_landmarks.landmark):
                    # Convert normalized coordinates to pixel coordinates
                    px = min(int(landmark.x * width), width - 1)
                    py = min(int(landmark.y * height), height - 1)
                    
                    # Store both normalized and pixel coordinates
                    landmarks.append({
                        'x': landmark.x,
                        'y': landmark.y,
                        'z': landmark.z,
                        'visibility': landmark.visibility,
                        'index': idx,
                        'px': px,
                        'py': py
                    })
                
                # Calculate measurements using pixel coordinates
                left_shoulder = results.pose_landmarks.landmark[11]
                right_shoulder = results.pose_landmarks.landmark[12]
                left_hip = results.pose_landmarks.landmark[23]
                right_hip = results.pose_landmarks.landmark[24]
                
                # Calculate body measurements in pixels then normalize
                shoulder_width = abs(left_shoulder.x - right_shoulder.x)
                body_height = abs((left_shoulder.y + right_shoulder.y)/2 - 
                                (left_hip.y + right_hip.y)/2)
                
                # Convert annotated frame to base64 for debugging
                _, buffer = cv2.imencode('.jpg', annotated_frame)
                annotated_base64 = base64.b64encode(buffer).decode('utf-8')
                
                return {
                    'landmarks': landmarks,
                    'measurements': {
                        'shoulder_width': float(shoulder_width),
                        'body_height': float(body_height),
                        'image_width': width,
                        'image_height': height
                    },
                    'debug_frame': f'data:image/jpeg;base64,{annotated_base64}',
                    'error': None
                }
            
            # If no pose detected, return original frame
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            
            return {
                'landmarks': None,
                'measurements': None,
                'image_info': image_info,
                'debug_frame': f'data:image/jpeg;base64,{frame_base64}',
                'error': 'No pose detected'
            }
            
        except Exception as e:
            print(f"Error processing frame: {e}")
            return {
                'landmarks': None,
                'measurements': None,
                'error': str(e)
            }