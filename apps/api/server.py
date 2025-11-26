import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from livekit import api
from dotenv import load_dotenv
from contextlib import asynccontextmanager
import logging

# Load environment variables
load_dotenv()

logger = logging.getLogger("server")

# Define request model
class TokenRequest(BaseModel):
    room: str
    identity: str
    name: str


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("LiveKit Token Server starting...")
    yield
    # Shutdown
    logger.info("LiveKit Token Server shutting down...")


app = FastAPI(
    title="PipeChat LiveKit Token Server",
    description="Token generation server for LiveKit client authentication",
   lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: In production, replace with specific frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/token")
async def get_token(req: TokenRequest):
    """
    Generate a LiveKit access token for the frontend client.
    
    Args:
        req: TokenRequest with room, identity, and name
        
    Returns:
        dict with 'token' (JWT) and 'url' (LiveKit server URL)
        
    Raises:
        HTTPException: If LiveKit configuration is missing or token generation fails
    """
    try:
        api_key = os.getenv("LIVEKIT_API_KEY")
        api_secret = os.getenv("LIVEKIT_API_SECRET")
        livekit_url = os.getenv("LIVEKIT_URL")

        if not all([api_key, api_secret, livekit_url]):
            raise HTTPException(
                status_code=500,
                detail="LiveKit configuration missing. Please set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL in .env"
            )

        # Create access token with room join permissions
        token = api.AccessToken(api_key, api_secret) \
            .with_identity(req.identity) \
            .with_name(req.name) \
            .with_grants(api.VideoGrants(
                room_join=True,
                room=req.room,
            ))

        logger.info(f"Generated token for user '{req.name}' ({req.identity}) to join room '{req.room}'")

        return {
            "token": token.to_jwt(),
            "url": livekit_url
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating token: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Token generation failed: {str(e)}")


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        dict with 'status' field
    """
    return {"status": "ok"}


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": "PipeChat LiveKit Token Server",
        "version": "1.0.0",
        "endpoints": {
            "POST /token": "Generate LiveKit access token",
            "GET /health": "Health check",
        }
    }


if __name__ == "__main__":
    # Run the token server
    # Note: The bot itself (bot.py) should be run separately as a worker process
    # 
    # For local development:
    #   Terminal 1: uvicorn server:app --port 7860 --reload
    #   Terminal 2: uv run bot.py --transport livekit
    # 
    # For production:
    #   Use a process manager (systemd, supervisor) or containerization
    #   to run both server.py and bot.py as separate services
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("TOKEN_SERVER_PORT", "7860")),
        log_level="info"
    )
