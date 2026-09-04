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

os.makedirs("temp_videos", exist_ok=True)

@app.get("/ping")
def ping():
    return {"status": "ok", "message": "CricCoach Backend is running"}

from fastapi import WebSocket, WebSocketDisconnect
import asyncio

@app.websocket("/ws/live-stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Phone connected to AI Live Stream!")
    frame_count = 0
    try:
        while True:
            # Receive base64 frame from the phone
            data = await websocket.receive_text()
            frame_count += 1
            
            # TODO: In Phase 3, run YOLOv8 on this frame!
            # For now, simulate the AI detecting the ball going "dead" after 25 frames (approx 5-6 seconds)
            if frame_count >= 25:
                print("AI DETECTED BALL IS DEAD! Sending STOP signal.")
                await websocket.send_json({"action": "STOP_RECORDING"})
                frame_count = 0 # reset for next ball
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
