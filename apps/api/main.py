from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="PipeChat Voice Agent API",
    description="Backend API for PipeChat Voice Agent",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello from PipeChat API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Placeholder for future bot integration
@app.post("/api/bot/start")
async def start_bot():
    return {"message": "Bot start requested (not implemented)"}
