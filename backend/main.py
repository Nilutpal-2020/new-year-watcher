import json
import time
import asyncio
import logging
import os
import uuid
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
from better_profanity import profanity

# --- Configuration ---
# Load from environment variables for security in production
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
MAX_WISH_LENGTH = 200
MAX_QUOTE_LENGTH = 200
WISH_TTL_SECONDS = 86400  # 24 Hours
RATE_LIMIT = "5/minute"

ALLOWED_THEMES = ["motivation", "reflection", "joy"]

WS_TIMEOUT = os.getenv("WS_TIMEOUT", 300)
raw_origins = os.getenv("CORS_ORIGINS", "*")
if raw_origins == "*":
    CORS_ORIGINS = ["*"]
else:
    CORS_ORIGINS = [origin.strip() for origin in raw_origins.split(",")]

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

    if await redis_client.scard("quotes:all") == 0:
        logger.info("Empty DB detected. Seeding default quotes...")
        defaults = [
            {"text": "Cheers to a new year and another chance for us to get it right.", "author": "Oprah Winfrey", "theme": "motivation"},
            {"text": "Life can only be understood backwards; but it must be lived forwards.", "author": "Søren Kierkegaard", "theme": "reflection"},
            {"text": "With the new day comes new strength and new thoughts.", "author": "Eleanor Roosevelt", "theme": "joy"}
        ]
        for q in defaults:
            q_json = json.dumps(q)
            await redis_client.sadd("quotes:all", q_json)
            await redis_client.sadd(f"quotes:{q['theme']}", q_json)

    if await redis_client.scard("traditions") == 0:
        logger.info("Empty Traditions DB. Seeding defaults...")
        default_traditions = [
            {"country": "Spain", "icon": "es", "text": "Eating 12 grapes at midnight—one for each chime of the clock—for good luck."},
            {"country": "Brazil", "icon": "br", "text": "Wearing white clothing to ward off bad spirits and jumping over 7 waves in the ocean."},
            {"country": "Japan", "icon": "jp", "text": "Ringing Buddhist temple bells 108 times (Joya no Kane) to banish the 108 worldly desires."},
            {"country": "Denmark", "icon": "dk", "text": "Smashing old plates against friends' doors to show affection. The bigger the pile, the more friends you have."},
            {"country": "Colombia", "icon": "co", "text": "Walking around the block with an empty suitcase at midnight to ensure a year full of travel."},
            {"country": "Philippines", "icon": "ph", "text": "Eating round fruits and wearing polka dots to attract wealth and prosperity."},
            {"country": "Greece", "icon": "gr", "text": "Hanging an onion on the front door as a symbol of rebirth and growth."},
            {"country": "Ecuador", "icon": "ec", "text": "Burning 'año viejo' effigies (scarecrows filled with paper) to destroy the bad vibes of the previous year."},
            {"country": "Turkey", "icon": "tr", "text": "Sprinkling salt on the doorstep as the clock strikes midnight to bring peace and abundance."}
        ]
        for t in default_traditions:
            await redis_client.sadd("traditions", json.dumps(t))

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

class QuoteCreate(BaseModel):
    text: str
    author: Optional[str] = "Anonymous"
    theme: str

class Quote(QuoteCreate):
    pass

class TimeResponse(BaseModel):
    utc_time: datetime
    midnight_longitude: float 

class PollVote(BaseModel):
    option_index: int

class PollResult(BaseModel):
    question: str
    options: List[str]
    votes: List[int]
    total_votes: int

class CapsuleCreate(BaseModel):
    message: str
    unlock_date: str = "2026-01-01T00:00:00Z"
    is_public: bool = False

class CapsuleStats(BaseModel):
    total_sealed: int

class Tradition(BaseModel):
    country: str
    icon: str
    text: str

POLL_HK = "poll:resolution_2026"
POLL_QUESTION = "What is your top priority for 2026?"
POLL_OPTIONS = [
    "Health & Fitness 💪",
    "Career Growth 🚀",
    "Travel & Adventure ✈️",
    "Learning a New Skill 🧠",
    "Saving Money 💰",
    "More Time with Family ❤️"
]

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

def censor_text(text: str) -> str:
    return profanity.censor(text)

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

    clean_name = censor_text(wish.name) if wish.name else "Anonymous"
    clean_message = censor_text(wish.message)
    
    now = datetime.now(timezone.utc)
    new_wish = Wish(
        name=clean_name,
        message=clean_message,
        region=wish.region,
        timestamp=now
    )
    
    wish_json = json.dumps(new_wish.dict(), default=str)
    
    if redis_client:
        await redis_client.zadd("wishes", {wish_json: now.timestamp()})
        
        asyncio.create_task(clean_old_wishes())

    await manager.broadcast(new_wish.dict())
    
    return new_wish

@app.post("/quotes", response_model=Quote, dependencies=[Depends(RateLimiter(times=3, seconds=60))])
async def create_quote(quote: QuoteCreate):
    """
    Submit a new quote to the database.
    - Validates theme.
    - REJECTS profanity (strict).
    """
    if not redis_client:
        raise HTTPException(status_code=503, detail="Database not available")

    # 1. Validation
    if quote.theme.lower() not in ALLOWED_THEMES:
        raise HTTPException(status_code=400, detail=f"Invalid theme. Allowed: {ALLOWED_THEMES}")
    
    if len(quote.text) > MAX_QUOTE_LENGTH:
        raise HTTPException(status_code=400, detail=f"Quote too long (max {MAX_QUOTE_LENGTH} chars)")

    # 2. Profanity Check (Reject, don't just censor)
    if profanity.contains_profanity(quote.text) or profanity.contains_profanity(quote.author):
        raise HTTPException(status_code=400, detail="Quote contains inappropriate content.")

    # 3. Store in Redis Sets (for random access)
    new_quote = Quote(
        text=quote.text.strip(),
        author=quote.author.strip() if quote.author else "Anonymous",
        theme=quote.theme.lower()
    )
    
    quote_json = json.dumps(new_quote.dict())
    
    # Add to specific theme set AND 'all' set
    # Redis Sets (SADD) handle uniqueness automatically
    await redis_client.sadd("quotes:all", quote_json)
    await redis_client.sadd(f"quotes:{new_quote.theme}", quote_json)

    return new_quote

@app.get("/quotes", response_model=List[Quote])
async def get_quotes(theme: Optional[str] = None, limit: int = 5):
    """
    Fetch random quotes from Redis.
    - Uses SRANDMEMBER for O(1) random selection.
    """
    if not redis_client:
        raise HTTPException(status_code=503, detail="Database not available")

    # Determine Redis key
    target_key = "quotes:all"
    if theme and theme != "all":
        if theme.lower() not in ALLOWED_THEMES:
             raise HTTPException(status_code=400, detail=f"Invalid theme. Allowed: {ALLOWED_THEMES}")
        target_key = f"quotes:{theme.lower()}"

    # Fetch random members
    # SRANDMEMBER returns a list if count is provided
    raw_quotes = await redis_client.srandmember(target_key, limit)
    
    # Handle case where srandmember returns None (empty set) or single string
    if not raw_quotes:
        return []
    
    # Ensure it's a list (aioredis behavior can vary slightly by version on single items)
    if not isinstance(raw_quotes, list):
        raw_quotes = [raw_quotes]

    return [json.loads(q) for q in raw_quotes]

@app.get("/poll", response_model=PollResult)
async def get_poll():
    if not redis_client:
        raise HTTPException(status_code=503, detail="Database not available")

    raw_votes = await redis_client.hgetall(POLL_HK)
    
    vote_counts = [0] * len(POLL_OPTIONS)
    total = 0
    
    for idx_str, count in raw_votes.items():
        try:
            idx = int(idx_str)
            if 0 <= idx < len(POLL_OPTIONS):
                c = int(count)
                vote_counts[idx] = c
                total += c
        except ValueError:
            continue

    return {
        "question": POLL_QUESTION,
        "options": POLL_OPTIONS,
        "votes": vote_counts,
        "total_votes": total
    }

@app.post("/poll/vote", response_model=PollResult, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def vote_poll(vote: PollVote):
    if not redis_client:
        raise HTTPException(status_code=503, detail="Database not available")
        
    if vote.option_index < 0 or vote.option_index >= len(POLL_OPTIONS):
        raise HTTPException(status_code=400, detail="Invalid option")

    await redis_client.hincrby(POLL_HK, str(vote.option_index), 1)
    
    return await get_poll()

@app.post("/capsule", response_model=dict, dependencies=[Depends(RateLimiter(times=2, seconds=60))])
async def seal_capsule(capsule: CapsuleCreate):
    if not redis_client:
        raise HTTPException(status_code=503, detail="Database not available")
        
    if len(capsule.message) > 500:
        raise HTTPException(status_code=400, detail="Message too long (max 500 chars)")

    capsule_id = str(uuid.uuid4())
    
    # We use a Hash to store the details
    key = f"capsule:{capsule_id}"
    data = {
        "message": censor_text(capsule.message),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "unlock_date": capsule.unlock_date,
        "is_public": str(capsule.is_public)
    }
    
    await redis_client.hset(key, mapping=data)
    
    # Increment global counter
    await redis_client.incr("stats:capsules_sealed")
    
    return {"status": "sealed", "id": capsule_id, "message": "See you in 2026! 🔒"}

@app.get("/capsule/stats", response_model=CapsuleStats)
async def get_capsule_stats():
    if not redis_client:
        return {"total_sealed": 0}
        
    count = await redis_client.get("stats:capsules_sealed")
    return {"total_sealed": int(count) if count else 0}

@app.get("/capsule/{capsule_id}")
async def get_capsule(capsule_id: str):
    if not redis_client:
        raise HTTPException(status_code=503, detail="Database not available")

    key = f"capsule:{capsule_id}"
    
    # Check if exists
    if not await redis_client.exists(key):
        raise HTTPException(status_code=404, detail="Capsule not found")

    data = await redis_client.hgetall(key)
    
    # Check Date Logic
    unlock_date = datetime.fromisoformat(data["unlock_date"].replace('Z', '+00:00'))
    now = datetime.now(timezone.utc)

    if now < unlock_date:
        # Calculate time remaining
        diff = unlock_date - now
        days = diff.days
        return {
            "status": "locked",
            "message": "This capsule is still sealed.",
            "days_remaining": days,
            "unlock_date": data["unlock_date"]
        }

    return {
        "status": "unlocked",
        "message": data["message"],
        "created_at": data["created_at"],
        "unlock_date": data["unlock_date"]
    }

@app.get("/traditions", response_model=List[Tradition])
async def get_traditions(limit: int = 6):
    """
    Fetch random traditions from Redis.
    Uses SRANDMEMBER for high-performance O(1) random selection.
    """
    if not redis_client:
        raise HTTPException(status_code=503, detail="Database not available")

    # Fetch random members
    raw_data = await redis_client.srandmember("traditions", limit)
    
    if not raw_data:
        return []
    
    # Ensure list (aioredis might return a single string if limit=1, though unlikely here)
    if not isinstance(raw_data, list):
        raw_data = [raw_data]

    return [json.loads(t) for t in raw_data]

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