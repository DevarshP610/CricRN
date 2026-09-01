import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose

class BiomechanicsAnalyzer:
    def __init__(self):
        self.pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def analyze_frame(self, frame):
        """
        Analyze a single frame for key biomechanical markers.
        """
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(image_rgb)
        
        diagnostics = []
        keypoints = None
        
        if results.pose_landmarks:
            landmarks = results.pose_landmarks.landmark
            keypoints = [{'x': lm.x, 'y': lm.y, 'z': lm.z, 'visibility': lm.visibility} for lm in landmarks]
            
            # Extract specific keypoints for cricket
            left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
            right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
            left_foot = landmarks[mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value]
            head = landmarks[mp_pose.PoseLandmark.NOSE.value]
            
            # Simple heuristic examples
            # 1. Falling over: Head is too far outside the line of the front foot
            if head.x < left_foot.x - 0.1: # Assuming right handed batter, viewed from front
                diagnostics.append("Falling over: Head is outside the line of the front foot.")
                
            # 2. Closed off: Shoulders not aligned
            shoulder_slope = abs(left_shoulder.y - right_shoulder.y)
            if shoulder_slope > 0.15:
                diagnostics.append("Shoulder drop detected.")

        return keypoints, diagnostics

    def process_video(self, video_path):
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        all_diagnostics = []
        frame_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            keypoints, diagnostics = self.analyze_frame(frame)
            if diagnostics:
                all_diagnostics.extend(diagnostics)
                
            frame_count += 1
            
        cap.release()
        
        # Summarize diagnostics (remove duplicates)
        summary = list(set(all_diagnostics))
        return {
            "status": "success",
            "frames_analyzed": frame_count,
            "diagnostics": summary
        }
