import json
import time
import asyncio
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from redis import asyncio as aioredis
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

# --- Configuration ---
# Load from environment variables for security in production
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
MAX_WISH_LENGTH = 200
WISH_TTL_SECONDS = 86400  # 24 Hours
RATE_LIMIT = "5/minute"

WS_TIMEOUT = os.getenv("WS_TIMEOUT", 300)
CORS_ORIGINS = os.getenv("CORS_ORIGINS", ["*"])

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Global Resources ---
redis_client = None

# --- Lifespan Manager (Startup/Shutdown) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global redis_client
    logger.info("🚀 Connecting to Redis...")
    redis_client = aioredis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    await FastAPILimiter.init(redis_client)
    logger.info("✅ Redis & Rate Limiter initialized.")
    yield
    # Shutdown
    logger.info("🛑 Closing Redis connection...")
    await redis_client.close()

app = FastAPI(
    title="New Year Watcher API",
    docs_url="/watcher-docs",
    redoc_url="/watcher-redoc",
    lifespan=lifespan
)

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS, # In production, restrict this to your frontend domain!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class WishCreate(BaseModel):
    name: Optional[str] = "Anonymous"
    message: str
    region: Optional[str] = "Unknown"

class Wish(WishCreate):
    timestamp: datetime

class TimeResponse(BaseModel):
    utc_time: datetime
    midnight_longitude: float 

# --- Connection Manager (Optimized) ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Socket Connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Socket Disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        # Serialize once, send to many
        json_msg = json.dumps(message, default=str)
        
        # Iterate over a copy to safely remove dead connections during iteration
        for connection in self.active_connections[:]:
            try:
                await connection.send_text(json_msg)
            except Exception as e:
                logger.warning(f"Failed to send to socket, removing: {e}")
                self.disconnect(connection)

manager = ConnectionManager()

# --- Helpers ---
def calculate_midnight_longitude(dt: datetime) -> float:
    hours = dt.hour + (dt.minute / 60) + (dt.second / 3600)
    longitude = (12 - hours) * 15 - 180
    while longitude > 180: longitude -= 360
    while longitude < -180: longitude += 360
    return longitude

async def clean_old_wishes():
    """Background task to remove wishes older than 24 hours from Redis"""
    if not redis_client: return
    
    # Calculate timestamp for 24 hours ago
    cutoff = (datetime.now(timezone.utc) - timedelta(seconds=WISH_TTL_SECONDS)).timestamp()
    
    # ZREMRANGEBYSCORE removes all elements with score < cutoff
    await redis_client.zremrangebyscore("wishes", min="-inf", max=cutoff)

# --- Endpoints ---
@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "New Year Timezone API",
        "endpoints": ["/time", "/wishes", "/wish"]
    }

@app.get("/health")
def read_root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "New Year Timezone API",
        "endpoints": ["/time", "/wishes", "/wish"]
    }

@app.get("/time", response_model=TimeResponse)
async def get_time():
    now = datetime.now(timezone.utc)
    return {
        "utc_time": now,
        "midnight_longitude": calculate_midnight_longitude(now)
    }

@app.get("/wishes", response_model=List[Wish])
async def get_wishes(limit: int = 50):
    if not redis_client:
        raise HTTPException(status_code=503, detail="Database not available")

    # ZREVRANGE returns elements from highest score (newest) to lowest
    # start=0, end=limit-1
    raw_wishes = await redis_client.zrevrange("wishes", 0, limit - 1)
    
    # Deserialize JSON strings back to objects
    return [json.loads(w) for w in raw_wishes]

@app.post("/wish", response_model=Wish, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def post_wish(wish: WishCreate):
    """
    Post a new wish.
    - Rate Limited: 5 requests per minute per IP.
    - Stored in Redis Sorted Set (ZSET).
    """
    if len(wish.message) > MAX_WISH_LENGTH:
        raise HTTPException(status_code=400, detail="Message too long")
    
    now = datetime.now(timezone.utc)
    new_wish = Wish(
        name=wish.name or "Anonymous",
        message=wish.message,
        region=wish.region,
        timestamp=now
    )
    
    wish_json = json.dumps(new_wish.dict(), default=str)
    
    # 1. Save to Redis ZSET (Score = Timestamp)
    # This keeps them ordered by time automatically
    if redis_client:
        await redis_client.zadd("wishes", {wish_json: now.timestamp()})
        
        # 2. Fire-and-forget cleanup (probability-based or scheduled is better, 
        # but doing it here is simple for this scale)
        asyncio.create_task(clean_old_wishes())

    # 3. Broadcast to realtime users
    await manager.broadcast(new_wish.dict())
    
    return new_wish

# --- WebSocket Endpoint ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    start_time = time.time()
    timeout_seconds = WS_TIMEOUT  # 10 minutes
    
    try:
        while True:
            elapsed = time.time() - start_time
            if elapsed >= timeout_seconds:
                # RFC 6455 code 1001: "Going Away" (e.g. server shutdown or session timeout)
                await websocket.close(code=1001, reason=f"Connection timed out ({WS_TIMEOUT/60} min limit)")
                break
            
            # We need to periodically check the time, so we use wait_for with a shorter timeout.
            # This allows us to break the wait if the 10-minute limit is reached.
            try:
                # We don't expect messages FROM client, but we must wait to keep socket open.
                await asyncio.wait_for(websocket.receive_text(), timeout=1) 
            except asyncio.TimeoutError:
                # This is expected; just a periodic check to see if we should close the connection.
                continue
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)

# --- Entry Point ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)