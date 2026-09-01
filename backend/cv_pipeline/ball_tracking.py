from ultralytics import YOLO
import cv2
import numpy as np

class BallTracker:
    def __init__(self, model_path='yolov8n.pt'):
        # For a real enterprise app, we would fine-tune this model specifically on cricket balls
        # For now, we load a pre-trained YOLOv8 nano model (it will download automatically)
        self.model = YOLO(model_path)
        
    def track_video(self, video_path, stump_coords=None):
        """
        Track the ball through the video and map trajectory.
        stump_coords: [{x, y}, {x, y}, {x, y}] mapped from the calibration phase.
        """
        cap = cv2.VideoCapture(video_path)
        
        trajectory = []
        
        # In a real scenario, we'd run inference per frame, filter for 'sports ball' (class 32 in COCO),
        # and use a tracker (like ByteTrack) to maintain identity.
        
        # For MVP mockup, we just verify the video opens and model runs
        ret, frame = cap.read()
        if ret:
            results = self.model(frame, classes=[32]) # 32 is sports ball in COCO
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0]
                    center_x = (x1 + x2) / 2
                    center_y = (y1 + y2) / 2
                    trajectory.append((float(center_x), float(center_y)))
                    
        cap.release()
        
        return {
            "status": "success",
            "trajectory_points": trajectory,
            "stumps_calibrated": stump_coords is not None
        }
