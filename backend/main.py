from pydantic import BaseModel
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from dotenv import load_dotenv
import sys
import os
import logging
from pathlib import Path

load_dotenv()

# Configure logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    force=True,  # Override any existing configuration
)

# Get logger for this module
logger = logging.getLogger(__name__)

backend_dir = Path(__file__).parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from middleware import JWTAuthMiddleware

app = FastAPI()

logger.info("FastAPI application initialized")

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.add_middleware(JWTAuthMiddleware)

# Define what you will receiving in request
class TypePayload(BaseModel):
    content: str

# Example GET route for app
@app.get("/")
def read_root():
    return {"Message": "Hello World! FastAPI is working."}

# Example POST route for app
@app.post("/getdata")
async def create_secret(
    payload: TypePayload,
    request: Request
):
    token_data = getattr(request.state, "token_data", None)
    with open('output_file.txt', 'a') as f:
        now = datetime.now()
        formatted_date = now.strftime("%B %d, %Y at %I:%M %p")
        f.write(formatted_date + ": " + payload.content)
        f.write('\n')
        logger.info(f"Data written to output_file.txt: {payload.content}")
    logger.info(f"Token data: {token_data}")
    return payload.content