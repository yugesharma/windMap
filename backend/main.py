from fastapi import FastAPI, Depends
import os
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from schemas import WindPoint
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MapWinds API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "database_url_configured": bool(os.getenv("DATABASE_URL"))
    }

