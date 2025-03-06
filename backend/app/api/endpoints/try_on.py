from fastapi import APIRouter, UploadFile, File
from typing import Dict
import shutil
import os

router = APIRouter()

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)) -> Dict:
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save uploaded file
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {
            "filename": file.filename,
            "status": "success",
            "message": "File uploaded successfully"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        } 