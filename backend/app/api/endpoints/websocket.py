from fastapi import APIRouter, WebSocket
from ...services.pose_detection import PoseDetector
import cv2
import numpy as np
import base64

router = APIRouter()
pose_detector = PoseDetector()

@router.websocket("/pose")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive base64 encoded frame from frontend
            data = await websocket.receive_text()
            
            # Process frame and get pose data
            pose_data = await pose_detector.process_frame(data)
            
            if pose_data:
                # Send pose data back to frontend
                await websocket.send_json(pose_data)
            else:
                await websocket.send_json({"error": "No pose detected"})
    except Exception as e:
        print(f"WebSocket error: {e}") 