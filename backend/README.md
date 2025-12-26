# New Year Timezone API - Backend

FastAPI server providing time calculations and wish wall functionality.

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment (recommended)**
   ```bash
   python -m venv venv
   
   # Activate on macOS/Linux:
   source venv/bin/activate
   
   # Activate on Windows:
   venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

### Running the Server

**Standard mode:**
```bash
python main.py
```

**Or using uvicorn directly:**
```bash
uvicorn main:app --reload
```

The server will start at `http://localhost:8000`

### API Documentation

Once running, visit:
- **Interactive docs**: http://localhost:8000/docs
- **Alternative docs**: http://localhost:8000/redoc

## API Endpoints

### `GET /time`
Returns current UTC time and New Year progress data.

**Response:**
```json
{
  "current_utc": "2025-01-01T12:00:00+00:00",
  "midnight_longitude": 0.0,
  "current_timezone": "UTC+0",
  "new_year_progress": 50.0
}
```

### `POST /wish`
Submit a New Year wish.

**Request body:**
```json
{
  "name": "Alice",
  "message": "Happy New Year!",
  "timezone_offset": 5
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Alice",
  "message": "Happy New Year!",
  "timestamp": "2025-01-01T12:00:00+00:00",
  "timezone_offset": 5,
  "is_new_year": true
}
```

### `GET /wishes?limit=50&offset=0`
Retrieve recent wishes (paginated).

**Parameters:**
- `limit`: Number of wishes to return (default: 50, max: 100)
- `offset`: Number of wishes to skip (default: 0)

## Architecture Notes

- **Storage**: In-memory list (wishes lost on restart)
- **Time Logic**: All calculations use UTC as reference
- **CORS**: Enabled for all origins (restrict in production)
- **Validation**: Pydantic models handle input validation

## Extending the Backend

### Add SQLite Persistence

Replace the in-memory store with SQLite:

```python
import sqlite3

# Initialize DB
conn = sqlite3.connect('wishes.db')
cursor = conn.cursor()
cursor.execute('''
    CREATE TABLE IF NOT EXISTS wishes (
        id INTEGER PRIMARY KEY,
        name TEXT,
        message TEXT,
        timestamp TEXT,
        timezone_offset INTEGER,
        is_new_year BOOLEAN
    )
''')
```

### Add Rate Limiting

Install `slowapi` and add rate limiting:
```bash
pip install slowapi
```

See FastAPI documentation for implementation details.