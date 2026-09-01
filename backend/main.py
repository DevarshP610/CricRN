from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="CricCoach AI Backend")

# Allow mobile app to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "CricCoach Backend is running"}

@app.get("/ping")
def ping():
    return {"ping": "pong", "message": "Successfully connected to PC backend!"}

@app.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    # Save the file temporarily
    file_location = f"temp_{file.filename}"
    with open(file_location, "wb") as f:
        f.write(await file.read())
    
    # In the future, this is where we will trigger the MediaPipe and YOLO processing
    
    return {"status": "success", "filename": file.filename, "message": "Video received for processing"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
