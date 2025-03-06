from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from fastapi.responses import JSONResponse
from ...services.pose_detection import PoseDetector
import cv2
import numpy as np
import base64

router = APIRouter()
pose_detector = PoseDetector()

@router.websocket("/ws/pose")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await websocket.accept()
        print("WebSocket connection accepted")
        
        while True:
            try:
                # Receive base64 encoded frame from frontend
                data = await websocket.receive_text()
                
                # Process frame and get pose data
                pose_data = await pose_detector.process_frame(data)
                
                if pose_data:
                    # Send pose data back to frontend
                    await websocket.send_json(pose_data)
                else:
                    await websocket.send_json({"error": "No pose detected"})
                    
            except WebSocketDisconnect:
                print("Client disconnected")
                break
            except Exception as e:
                print(f"Error processing frame: {e}")
                await websocket.send_json({"error": str(e)})
                
    except Exception as e:
        print(f"WebSocket error: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": str(e)}
        )

@router.get("/ws-test")
async def test_websocket():
    return {"status": "WebSocket endpoint is available"} 