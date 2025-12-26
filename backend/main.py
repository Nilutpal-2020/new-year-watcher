from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import List, Optional
from collections import deque

import uvicorn
import json
import asyncio
import time

app = FastAPI(title="New Year Visualizer")

# --- Configuration ---
# Allow CORS so our React app (usually on port 5173) can talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-Memory Storage ---
# Simple list to store wishes. 
# In a real app, this would be SQLite or Postgres.
# We use a deque with maxlen=50 to maintain a rolling queue of the latest wishes.
wishes_db = deque(maxlen=50)

# --- Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # We need to serialize the dict to JSON string for transmission
        # We must handle datetime serialization manually or use jsonable_encoder
        json_msg = json.dumps(message, default=str) 
        for connection in self.active_connections:
            await connection.send_text(json_msg)

manager = ConnectionManager()

# --- Models ---
class WishCreate(BaseModel):
    name: Optional[str] = "Anonymous"
    message: str
    region: Optional[str] = "Unknown"

class Wish(WishCreate):
    timestamp: datetime

class TimeResponse(BaseModel):
    utc_time: datetime
    # We return the longitude where midnight is currently happening
    midnight_longitude: float 

# --- Logic Helper ---
def calculate_midnight_longitude(dt: datetime) -> float:
    """
    At 12:00 UTC, Noon is at 0 longitude. Midnight is at 180/-180.
    """
    hours = dt.hour + (dt.minute / 60) + (dt.second / 3600)
    
    # (12 - hours) * 15 is Noon longitude. Subtract 180 for Midnight.
    longitude = (12 - hours) * 15 - 180
    
    # Normalize to -180 to 180 range
    while longitude > 180: longitude -= 360
    while longitude < -180: longitude += 360
    
    return longitude

# --- Endpoints ---
@app.get("/")
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
    # Return latest wishes first. Sorted is necessary because deque isn't inherently ordered by timestamp logic here (though append order is temporal).
    # Converting deque to list for slice and sort.
    items = list(wishes_db)
    return sorted(items, key=lambda x: x.timestamp, reverse=True)[:limit]

@app.post("/wish", response_model=Wish)
async def post_wish(wish: WishCreate):
    if len(wish.message) > 200:
        raise HTTPException(status_code=400, detail="Message too long")
    
    new_wish = Wish(
        name=wish.name or "Anonymous",
        message=wish.message,
        region=wish.region,
        timestamp=datetime.now(timezone.utc)
    )
    
    wishes_db.append(new_wish)
    
    # REALTIME MAGIC: Broadcast the new wish to all connected sockets
    await manager.broadcast(new_wish.dict())
    
    return new_wish

# --- WebSocket Endpoint ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    start_time = time.time()
    timeout_seconds = 10  # 10 minutes
    
    try:
        while True:
            elapsed = time.time() - start_time
            if elapsed >= timeout_seconds:
                # RFC 6455 code 1001: "Going Away" (e.g. server shutdown or session timeout)
                await websocket.close(code=1001, reason="Connection timed out (10 min limit)")
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

# --- Run Server ---

if __name__ == "__main__":
    print("🎉 Starting New Year Timezone API server...")
    print("📍 Server will run at: http://localhost:8000")
    print("📚 API docs available at: http://localhost:8000/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, workers=2, reload=True)