import cv2
import numpy as np
import math
import os

def process_ball_tracking(video_path: str):
    """
    Analyzes cricket delivery video using OpenCV.
    Works with ANY ball type: rubber, foam, leather, red, white, pink.
    Uses motion-based tracking (not color-based) so ball color doesn't matter.
    """
    print(f"[BallTracking] Starting analysis on {video_path}...")
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("[BallTracking] ERROR: Cannot open video.")
        return _fallback("Cannot open video")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or fps != fps:  # NaN check
        fps = 30.0

    vid_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    vid_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"[BallTracking] Video: {vid_width}x{vid_height} @ {fps}fps, {total_frames} frames")

    if vid_width == 0 or vid_height == 0:
        cap.release()
        return _fallback("Invalid video dimensions")

    # Scale-aware contour area thresholds
    # A cricket ball at distance appears as roughly 0.1-2% of frame area
    frame_area = vid_width * vid_height
    min_ball_area = max(3, int(frame_area * 0.00005))
    max_ball_area = max(500, int(frame_area * 0.02))
    
    print(f"[BallTracking] Ball area range: {min_ball_area} - {max_ball_area} px")

    # Background subtractor — works regardless of ball color
    backSub = cv2.createBackgroundSubtractorMOG2(
        history=30, 
        varThreshold=40, 
        detectShadows=False
    )
    
    # Multi-hypothesis tracking to ignore screen shake noise
    tracks = []  # List of lists: [[(cx, cy, frame), ...], ...]
    
    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count += 1
        
        # Skip first few frames to let background model initialize
        if frame_count < 5:
            backSub.apply(frame)
            continue

        # Apply background subtraction to the full frame
        fgMask = backSub.apply(frame)
        
        # Clean up noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fgMask = cv2.morphologyEx(fgMask, cv2.MORPH_OPEN, kernel)
        fgMask = cv2.morphologyEx(fgMask, cv2.MORPH_CLOSE, kernel)
        
        contours, _ = cv2.findContours(fgMask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        candidates = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < min_ball_area or area > max_ball_area:
                continue
                
            perimeter = cv2.arcLength(contour, True)
            if perimeter == 0: continue
            
            # Circularity: 1.0 = perfect circle, lower = elongated
            circularity = 4 * math.pi * area / (perimeter * perimeter)
            if circularity > 0.4: # Must be somewhat circular, ignoring limbs/bats
                (cx, cy), radius = cv2.minEnclosingCircle(contour)
                candidates.append((int(cx), int(cy), frame_count))
        
        # Update existing tracks or create new ones
        max_jump = vid_width * 0.1  # Max jump per frame
        for cand in candidates:
            matched = False
            for track in tracks:
                last_pt = track[-1]
                # If this candidate is in the next few frames and close by
                if frame_count - last_pt[2] <= 3:
                    dx = abs(cand[0] - last_pt[0])
                    dy = abs(cand[1] - last_pt[1])
                    if dx < max_jump and dy < max_jump:
                        track.append(cand)
                        matched = True
                        break
            if not matched:
                tracks.append([cand])

    cap.release()
    
    # Pick the longest continuous track (the actual ball will have the most frames)
    # Screen shake noise tracks will be short-lived
    ball_trajectory = []
    if tracks:
        longest_track = max(tracks, key=len)
        if len(longest_track) >= 5:
            ball_trajectory = longest_track
            
    print(f"[BallTracking] Evaluated {len(tracks)} separate object tracks")
    print(f"[BallTracking] Selected ball trajectory with {len(ball_trajectory)} points")
    
    # Need at least 5 points for meaningful physics
    if len(ball_trajectory) < 5:
        print("[BallTracking] Not enough points. Using fallback.")
        return _fallback("Not enough tracking points")

    # Sort by frame index
    ball_trajectory.sort(key=lambda t: t[2])
    
    X = np.array([pt[0] for pt in ball_trajectory], dtype=float)
    Y = np.array([pt[1] for pt in ball_trajectory], dtype=float)
    Frames = np.array([pt[2] for pt in ball_trajectory], dtype=float)
    
    # --- PHYSICS ENGINE ---
    
    # Bounce point = where Y is maximum (ball is lowest on screen before bouncing up)
    bounce_idx = int(np.argmax(Y))
    bounce_x = X[bounce_idx]
    bounce_y = Y[bounce_idx]
    
    # Approximate real-world scale: pitch is ~20m, occupies roughly 60% of vertical frame
    pixels_per_meter = (vid_height * 0.6) / 20.0
    
    # SPEED calculation
    if bounce_idx > 0:
        time_elapsed = (Frames[bounce_idx] - Frames[0]) / fps
        dist_px = np.sqrt((X[bounce_idx] - X[0])**2 + (Y[bounce_idx] - Y[0])**2)
        dist_m = dist_px / pixels_per_meter
        speed_mps = dist_m / max(time_elapsed, 0.01)
        speed_kmh = speed_mps * 3.6
        speed_kmh = float(np.clip(speed_kmh, 60.0, 160.0))
    else:
        speed_kmh = 0.0

    # SWING calculation (lateral deviation before bounce)
    swing_deg = 0.0
    if bounce_idx > 2:
        pre_X = X[:bounce_idx]
        pre_Y = Y[:bounce_idx]
        try:
            coeffs = np.polyfit(pre_Y, pre_X, 1)
            swing_deg = float(np.clip(math.degrees(math.atan(coeffs[0])), -5.0, 5.0))
        except:
            pass

    # TURN calculation (deviation after bounce vs before)
    turn_deg = 0.0
    if bounce_idx < len(X) - 2:
        post_X = X[bounce_idx:]
        post_Y = Y[bounce_idx:]
        try:
            coeffs = np.polyfit(post_Y, post_X, 1)
            post_angle = math.degrees(math.atan(coeffs[0]))
            turn_deg = float(np.clip(post_angle - swing_deg, -8.0, 8.0))
        except:
            pass

    # DRS PREDICTION
    stump_y = vid_height * 0.85  # Approximate stump line on screen
    stump_width_px = pixels_per_meter * 0.2286  # 22.86cm stump width
    center_x = vid_width / 2.0
    
    pitching = "IN LINE"
    impact = "IN LINE"
    wickets = "MISSING"
    
    # Pitching location
    if bounce_x < center_x - stump_width_px * 2:
        pitching = "OUTSIDE OFF"
    elif bounce_x > center_x + stump_width_px * 2:
        pitching = "OUTSIDE LEG"
    else:
        pitching = "IN LINE"
    
    # Wickets prediction via quadratic extrapolation
    if bounce_idx < len(X) - 2:
        try:
            post_Y_pts = Y[bounce_idx:]
            post_X_pts = X[bounce_idx:]
            p = np.polyfit(post_Y_pts, post_X_pts, 2)
            pred_x = float(np.polyval(p, stump_y))
            
            if center_x - stump_width_px <= pred_x <= center_x + stump_width_px:
                wickets = "HITTING"
                impact = "IN LINE"
            elif center_x - stump_width_px * 1.5 <= pred_x <= center_x + stump_width_px * 1.5:
                wickets = "UMPIRE'S CALL"
                impact = "IN LINE"
            else:
                wickets = "MISSING"
                if pred_x < center_x:
                    impact = "OUTSIDE OFF"
                else:
                    impact = "OUTSIDE LEG"
        except:
            pass

    # --- GENERATE RED TRACER VIDEO ---
    processed_path = video_path.replace(".mp4", "_processed.mp4")
    cap2 = cv2.VideoCapture(video_path)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(processed_path, fourcc, fps, (vid_width, vid_height))
    
    current_frame = 0
    tracer_points = []
    
    while True:
        ret, frame = cap2.read()
        if not ret:
            break
        current_frame += 1
        
        # Accumulate tracer points up to current frame
        for pt in ball_trajectory:
            if pt[2] <= current_frame and (pt[0], pt[1]) not in tracer_points:
                tracer_points.append((pt[0], pt[1]))
                
        # Draw the glowing red tracer line
        if len(tracer_points) > 1:
            pts = np.array(tracer_points, np.int32).reshape((-1, 1, 2))
            # Outer glow (thick, darker red)
            cv2.polylines(frame, [pts], isClosed=False, color=(0, 0, 200), thickness=6)
            # Core line (bright red)
            cv2.polylines(frame, [pts], isClosed=False, color=(0, 0, 255), thickness=3)
            # Inner highlight
            cv2.polylines(frame, [pts], isClosed=False, color=(100, 100, 255), thickness=1)
            
        # Draw current ball position
        if len(tracer_points) > 0:
            last_pt = tracer_points[-1]
            cv2.circle(frame, last_pt, 8, (0, 0, 255), -1)
            cv2.circle(frame, last_pt, 4, (255, 255, 255), -1)

        out.write(frame)
        
    cap2.release()
    out.release()
    
    video_filename = os.path.basename(processed_path)
    video_url = f"http://192.168.2.65:8000/videos/{video_filename}"
    
    print(f"[BallTracking] RESULTS: speed={speed_kmh:.1f} km/h, swing={swing_deg:.1f}°, turn={turn_deg:.1f}°")
    print(f"[BallTracking] DRS: pitching={pitching}, impact={impact}, wickets={wickets}")
    print(f"[BallTracking] Tracer video: {video_url}")

    # Normalize the points relative to screen dimensions so the frontend can scale them properly
    normalized_points = [{"x": round(float(pt[0] / vid_width), 3), "y": round(float(pt[1] / vid_height), 3)} for pt in tracer_points]

    return {
        "speed": round(speed_kmh, 1),
        "swing": round(swing_deg, 1),
        "turn": round(turn_deg, 1),
        "videoUrl": video_url,
        "trajectory_points": normalized_points,
        "hawkeye": {
            "pitching": pitching,
            "impact": impact,
            "wickets": wickets
        }
    }


def _fallback(reason: str):
    """Returns zeros instead of random data so the user knows detection failed."""
    print(f"[BallTracking] FALLBACK: {reason}")
    return {
        "speed": 0.0,
        "swing": 0.0,
        "turn": 0.0,
        "videoUrl": None,
        "trajectory_points": [],
        "hawkeye": {
            "pitching": "DETECTION FAILED",
            "impact": "DETECTION FAILED",
            "wickets": "DETECTION FAILED"
        }
    }
