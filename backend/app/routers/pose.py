from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import mediapipe as mp
import numpy as np
import cv2
import base64

router = APIRouter()
mp_pose = mp.solutions.pose

# Basic pose detection configuration
pose = mp_pose.Pose(
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
    model_complexity=1
)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            try:
                # Receive base64 encoded image from client
                data = await websocket.receive_text()
                if not data:
                    await websocket.send_json({
                        'success': False,
                        'message': 'No data received'
                    })
                    continue

                # Decode base64 image
                img_data = base64.b64decode(data.split(',')[1])
                nparr = np.frombuffer(img_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if frame is None:
                    await websocket.send_json({
                        'success': False,
                        'message': 'Failed to decode image'
                    })
                    continue

                # Process frame with MediaPipe Pose
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = pose.process(frame_rgb)

                if not results.pose_landmarks:
                    await websocket.send_json({
                        'success': False,
                        'message': 'No pose detected'
                    })
                    continue

                # Convert landmarks to list format
                landmarks = []
                for landmark in results.pose_landmarks.landmark:
                    landmarks.append({
                        'x': landmark.x,
                        'y': landmark.y,
                        'z': landmark.z,
                        'visibility': landmark.visibility
                    })

                await websocket.send_json({
                    'success': True,
                    'landmarks': landmarks
                })

            except WebSocketDisconnect:
                break
            except Exception as e:
                print(f"Error: {str(e)}")
                break

    except Exception as e:
        print(f"Fatal error: {str(e)}")
    finally:
        try:
            await websocket.close()
        except:
            pass 