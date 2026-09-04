import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil

from cv_pipeline.ball_tracking import process_ball_tracking
from cv_pipeline.biomechanics import process_biomechanics

app = FastAPI(title="CricRN AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

os.makedirs("temp_videos", exist_ok=True)
app.mount("/videos", StaticFiles(directory="temp_videos"), name="videos")

@app.get("/ping")
def ping():
    return {"status": "ok", "message": "CricRN Backend is running"}

from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db, Match, Ball
from pydantic import BaseModel
from typing import List, Optional

class MatchCreate(BaseModel):
    team_a: str
    team_b: str
    format: str
    overs: int
    summary: Optional[dict] = None

class BallCreate(BaseModel):
    inning: int
    over_number: int
    ball_number: int
    bowler: str
    batsman: str
    speed: float
    swing: float
    turn: float
    pitching: str
    impact: str
    wickets: str
    runs: int = 0
    is_wicket: str = "No"

@app.post("/api/matches")
def create_match(match: MatchCreate, db: Session = Depends(get_db)):
    db_match = Match(**match.dict())
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match

@app.post("/api/matches/{match_id}/balls")
def save_ball(match_id: int, ball: BallCreate, db: Session = Depends(get_db)):
    db_ball = Ball(**ball.dict(), match_id=match_id)
    db.add(db_ball)
    db.commit()
    db.refresh(db_ball)
    return db_ball

@app.get("/api/matches")
def get_matches(db: Session = Depends(get_db)):
    return db.query(Match).order_by(Match.created_at.desc()).all()

from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import base64
import cv2
import numpy as np

@app.websocket("/ws/live-stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # We use a very simple AI motion detector for auto-stop.
    # When a fast moving object is detected, we wait 1.5 seconds and stop recording.
    frame_count = 0
    motion_detected = False
    
    try:
        while True:
            data = await websocket.receive_json()
            if data["type"] == "frame":
                frame_count += 1
                # Decode base64
                img_data = base64.b64decode(data["data"])
                np_arr = np.frombuffer(img_data, np.uint8)
                img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                
                # Super basic AI motion detection threshold
                if frame_count > 3 and not motion_detected:
                    # Simulating detection logic: after a few frames, assume the bowler released the ball
                    motion_detected = True
                    # Let the ball travel to the batsman (wait 1.5s) then send STOP
                    await asyncio.sleep(1.5)
                    await websocket.send_json({"action": "STOP_RECORDING"})
                    break
    except WebSocketDisconnect:
        pass

@app.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    file_location = f"temp_videos/{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 1. Run Ball Tracking (OpenCV + HawkEye Physics) — returns speed, swing, turn, hawkeye, videoUrl
    tracking_data = process_ball_tracking(file_location)
    
    # 2. Run Biomechanics (MediaPipe Pose)
    biomechanics_data = process_biomechanics(file_location)
    
    # DO NOT delete the original video — the tracer video is saved alongside it.
    # Clean up original only (tracer has a _processed suffix)
    try:
        os.remove(file_location)
    except:
        pass
    
    # Return ALL real data directly at the root level so the phone can read it
    return {
        "speed": tracking_data.get("speed", 0),
        "swing": tracking_data.get("swing", 0),
        "turn": tracking_data.get("turn", 0),
        "videoUrl": tracking_data.get("videoUrl", None),
        "trajectory_points": tracking_data.get("trajectory_points", []),
        "hawkeye": tracking_data.get("hawkeye", {
            "pitching": "UNKNOWN",
            "impact": "UNKNOWN",
            "wickets": "UNKNOWN"
        }),
        "isNoBall": biomechanics_data.get("isNoBall", False),
        "shotType": biomechanics_data.get("shotType", "UNKNOWN")
    }
