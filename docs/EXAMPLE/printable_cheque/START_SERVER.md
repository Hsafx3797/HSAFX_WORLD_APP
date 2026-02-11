# 🚀 Starting the Cheque PDF Generator Backend

## Quick Start

### Windows (PowerShell)
```powershell
# Navigate to backend directory
cd backend/printable_cheque

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the server
python api_server.py
```

### Alternative: Using start.bat (if exists)
```powershell
cd backend/printable_cheque
./start.bat
```

## Server Information

- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check server status |
| GET | `/api/countries-banks` | Get countries and banks mapping |
| POST | `/api/generate-cheque` | Generate single cheque PDF |
| POST | `/api/generate-bulk-cheques` | Generate multi-page bulk PDF |

## Troubleshooting

### Port Already in Use
If port 8000 is already in use:
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Missing Dependencies
```powershell
pip install fastapi uvicorn pydantic pypdf2 reportlab python-multipart
```

### Server Not Running Error in Frontend
If you see "Failed to load countries and banks. Backend might be offline":
1. Make sure this Python server is running on port 8000
2. Check the terminal for errors
3. Verify http://localhost:8000/api/health returns a response

## Environment Variables

The frontend expects the backend at:
- Default: `http://localhost:8000`
- Can be configured via `NEXT_PUBLIC_CHEQUE_API_URL` in `.env.local`

## Development Notes

- Server runs with hot-reload enabled
- CORS configured for localhost:3000, localhost:3001, and network addresses
- PDFs are temporarily stored in system temp directory
- Auto-cleanup removes PDFs older than 1 hour
