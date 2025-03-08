from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import pose

app = FastAPI(title="Virtual Try-On API")

# Configure CORS for both HTTP and WebSocket
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost",
    "http://127.0.0.1",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pose.router, prefix="/api/pose", tags=["pose"])

@app.get("/")
async def root():
    return {"message": "Welcome to Virtual Try-On API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 