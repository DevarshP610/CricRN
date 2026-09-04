import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil

from cv_pipeline.ball_tracking import process_ball_tracking
from cv_pipeline.biomechanics import process_biomechanics

app = FastAPI(title="CricCoach AI Backend")

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
    return {"status": "ok", "message": "CricCoach Backend is running"}

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
import json

@app.websocket("/ws/live-stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Phone connected to AI Live Stream!")
    
    backSub = cv2.createBackgroundSubtractorMOG2(history=10, varThreshold=50, detectShadows=False)
    frames_since_motion = 0
    motion_detected = False

    try:
        while True:
            # Receive base64 frame from the phone
            text_data = await websocket.receive_text()
            try:
                data = json.loads(text_data)
                if data.get("type") == "frame":
                    base64_img = data.get("data")
                    img_data = base64.b64decode(base64_img)
                    np_arr = np.frombuffer(img_data, np.uint8)
                    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                    
                    if frame is not None:
                        # OpenCV Motion Detection for Auto-Stop
                        fgMask = backSub.apply(frame)
                        contours, _ = cv2.findContours(fgMask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                        
                        has_motion = False
                        for contour in contours:
                            if cv2.contourArea(contour) > 100:  # Adjust threshold based on testing
                                has_motion = True
                                break
                                
                        if has_motion:
                            motion_detected = True
                            frames_since_motion = 0
                        elif motion_detected:
                            frames_since_motion += 1
                            
                        # If motion was detected but stopped for 3 frames (ball is dead/hit)
                        if motion_detected and frames_since_motion > 3:
                            print("AI DETECTED BALL IS DEAD! Sending STOP signal.")
                            await websocket.send_json({"action": "STOP_RECORDING"})
                            # Reset for next ball
                            motion_detected = False
                            frames_since_motion = 0
            except Exception as e:
                print("Error processing frame: ", e)
    except WebSocketDisconnect:
        print("Phone disconnected from AI Live Stream.")

@app.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    file_location = f"temp_videos/{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 1. Run Ball Tracking (YOLOv8 + HawkEye Physics)
    hawkeye_data = process_ball_tracking(file_location)
    
    # 2. Run Biomechanics (MediaPipe Pose)
    biomechanics_data = process_biomechanics(file_location)
    
    # Clean up
    os.remove(file_location)
    
    # Combine results
    result = {
        "isNoBall": biomechanics_data.get("isNoBall", False),
        "isWide": hawkeye_data.get("isWide", False),
        "releaseData": {
            "height": biomechanics_data.get("releaseHeight", 2.1),
            "swingDegrees": hawkeye_data.get("swingDegrees", 0.0)
        },
        "hawkeye": hawkeye_data.get("hawkeye", {
            "pitching": "IN LINE",
            "impact": "IN LINE",
            "wickets": "HITTING"
        }),
        "shotType": biomechanics_data.get("shotType", "DEFENSE")
    }
    
    return result
