from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import try_on, websocket

app = FastAPI(title="Virtual Try-On API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(try_on.router, prefix="/try-on", tags=["try-on"])
app.include_router(websocket.router, prefix="/ws")

@app.get("/")
async def root():
    return {"message": "Welcome to Virtual Try-On API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 