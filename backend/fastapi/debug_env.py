import os
import sys
from dotenv import load_dotenv

# Try loading from typical locations
load_dotenv() 
load_dotenv("../../.env")

print(f"CWD: {os.getcwd()}")
print(f"UPSTASH_URL: {os.getenv('UPSTASH_REDIS_REST_URL')}")
print(f"REDIS_URL (raw): {os.getenv('REDIS_URL')}")

# Import config to see what Pydantic sees
sys.path.append(".")
try:
    from src.core.config import settings
    print(f"Settings.final_redis_url: {settings.final_redis_url}")
    print(f"Settings.REDIS_URL (raw): {settings.REDIS_URL}")
except ImportError as e:
    print(f"Could not import settings: {e}")
