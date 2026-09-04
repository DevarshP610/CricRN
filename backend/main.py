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
import math

class LiveDeliveryDetector:
    """
    Real-time Autonomous Computer Vision Delivery Detector.
    Supports hands-free operation:
    1. ARMED: Detects bowler run-up/approach and triggers START_RECORDING.
    2. WAITING: Detects ball release and entry into flight.
    3. IN_FLIGHT: Tracks ball trajectory across frames.
    4. DEAD: Triggers STOP_RECORDING when ball stops or leaves frame.
    """
    def __init__(self, autonomous_mode=False):
        self.autonomous_mode = autonomous_mode
        self.state = "ARMED" if autonomous_mode else "WAITING"
        self.prev_gray = None
        self.ball_positions = []
        self.in_flight_count = 0
        self.lost_frames = 0
        self.still_frames = 0
        self.bowler_motion_frames = 0

    def reset_armed(self):
        self.state = "ARMED"
        self.ball_positions = []
        self.in_flight_count = 0
        self.lost_frames = 0
        self.still_frames = 0
        self.bowler_motion_frames = 0
        print("[AI Autonomous] Camera ARMED and listening for bowler run-up...")

    def process_frame(self, frame_bgr):
        h, w = frame_bgr.shape[:2]
        scale = 320.0 / w
        small = cv2.resize(frame_bgr, (320, int(h * scale)))
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (9, 9), 0)

        if self.prev_gray is None:
            self.prev_gray = gray
            return self.state

        diff = cv2.absdiff(self.prev_gray, gray)
        self.prev_gray = gray
        
        _, thresh = cv2.threshold(diff, 20, 255, cv2.THRESH_BINARY)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        total_motion_area = sum(cv2.contourArea(c) for c in contours)

        moving_balls = []
        for c in contours:
            area = cv2.contourArea(c)
            if 10 < area < 3000:
                perimeter = cv2.arcLength(c, True)
                if perimeter > 0:
                    circularity = 4 * math.pi * area / (perimeter * perimeter)
                    if circularity > 0.2:
                        (cx, cy), _ = cv2.minEnclosingCircle(c)
                        moving_balls.append((cx, cy, area, circularity))

        # 1. ARMED: Looking for bowler starting their delivery run-up
        if self.state == "ARMED":
            if total_motion_area > 3500:
                self.bowler_motion_frames += 1
                if self.bowler_motion_frames >= 2:
                    self.state = "WAITING"
                    self.bowler_motion_frames = 0
                    print("[AI Autonomous] Bowler run-up detected! Triggering START_RECORDING.")
                    return "START_RECORDING"
            else:
                self.bowler_motion_frames = max(0, self.bowler_motion_frames - 1)
            return "ARMED"

        # 2. WAITING: Looking for ball release / entering flight
        elif self.state == "WAITING":
            if len(moving_balls) > 0:
                best = max(moving_balls, key=lambda b: b[3])
                self.state = "IN_FLIGHT"
                self.ball_positions = [(best[0], best[1])]
                self.in_flight_count = 1
                self.lost_frames = 0
                self.still_frames = 0
                print(f"[AI Autonomous] Ball in flight! Tracking...")
                return "BALL_ENTERED"
            return "WAITING"

        # 3. IN_FLIGHT: Tracking ball until it stops or leaves
        elif self.state == "IN_FLIGHT":
            self.in_flight_count += 1
            last_pos = self.ball_positions[-1]

            if len(moving_balls) > 0:
                candidates = [b for b in moving_balls if np.hypot(b[0] - last_pos[0], b[1] - last_pos[1]) < 120]
                if candidates:
                    closest = min(candidates, key=lambda b: np.hypot(b[0] - last_pos[0], b[1] - last_pos[1]))
                    disp = np.hypot(closest[0] - last_pos[0], closest[1] - last_pos[1])
                    self.ball_positions.append((closest[0], closest[1]))
                    self.lost_frames = 0
                    
                    if disp < 4.0:
                        self.still_frames += 1
                    else:
                        self.still_frames = 0
                        
                    if self.still_frames >= 2 and self.in_flight_count >= 3:
                        self.state = "DEAD"
                        print("[AI Autonomous] Ball came to rest. Dead ball detected!")
                        return "BALL_STOPPED"
                else:
                    self.lost_frames += 1
            else:
                self.lost_frames += 1

            if self.lost_frames >= 2 and self.in_flight_count >= 3:
                self.state = "DEAD"
                print("[AI Autonomous] Ball left frame. Delivery completed!")
                return "BALL_LEFT"

            return "IN_FLIGHT"

        return "DEAD"

@app.websocket("/ws/live-stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    detector = LiveDeliveryDetector(autonomous_mode=True)
    print("[AI Autonomous] WebSocket connected for hands-free live stream.")
    
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "ARM":
                detector.reset_armed()
                await websocket.send_json({"action": "ARMED_CONFIRMED"})
                continue
                
            if msg_type == "frame":
                img_data = base64.b64decode(data["data"])
                np_arr = np.frombuffer(img_data, np.uint8)
                img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                
                if img is not None:
                    status = detector.process_frame(img)
                    if status == "START_RECORDING":
                        print("[AI Autonomous] Sending START_RECORDING to phone")
                        await websocket.send_json({
                            "action": "START_RECORDING",
                            "reason": "bowler_run_up"
                        })
                    elif status in ["BALL_STOPPED", "BALL_LEFT"]:
                        print(f"[AI Autonomous] Sending STOP_RECORDING ({status}) to phone")
                        await websocket.send_json({
                            "action": "STOP_RECORDING",
                            "reason": status,
                            "flight_frames": detector.in_flight_count
                        })
                        detector.reset_armed()
    except WebSocketDisconnect:
        print("[AI Autonomous] Client disconnected.")
    except Exception as e:
        print(f"[AI Autonomous] Error: {e}")

@app.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    file_location = f"temp_videos/{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    tracking_data = process_ball_tracking(file_location)
    biomechanics_data = process_biomechanics(file_location)
    
    try:
        os.remove(file_location)
    except:
        pass
    
    return {
        "speed": tracking_data.get("speed", 0),
        "release_speed": tracking_data.get("release_speed", 0),
        "pitch_speed": tracking_data.get("pitch_speed", 0),
        "length_category": tracking_data.get("length_category", "UNKNOWN"),
        "stump_target": tracking_data.get("stump_target", "UNKNOWN"),
        "swing": tracking_data.get("swing", 0),
        "turn": tracking_data.get("turn", 0),
        "videoUrl": tracking_data.get("videoUrl", None),
        "trajectory_points": tracking_data.get("trajectory_points", []),
        "hawkeye": tracking_data.get("hawkeye", {
            "pitching": "UNKNOWN",
            "impact": "UNKNOWN",
            "wickets": "UNKNOWN",
            "stump_target": "UNKNOWN"
        }),
        "isNoBall": biomechanics_data.get("isNoBall", False),
        "shotType": biomechanics_data.get("shotType", "UNKNOWN")
    }
