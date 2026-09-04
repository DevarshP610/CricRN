# CricRN

**CricRN** is an advanced AI-powered cricket coaching application built with React Native and Python. It uses real-time computer vision and biomechanical analysis to provide broadcast-level analytics for every delivery, right from your phone.

## Features

### 🏏 Broadcast-Level Analytics
Get access to detailed stats instantly after every delivery:
- **Ball Speed** (in km/h)
- **Swing & Turn** (in degrees)
- **HawkEye DRS**: Predicts pitching, impact, and wickets using a custom OpenCV physics engine.

### 🎥 Red Tracer Video Replays
The Python backend processes your delivery video in real-time, drawing a glowing red tracer path over the ball trajectory so you can visualize the exact line and length.

### 🛑 Smart Auto-Stop Recording
CricRN connects directly to the AI backend via WebSockets. It uses motion detection to automatically stop recording precisely when the delivery is dead or hit—saving storage space and preventing you from having to manually stop the camera.

### 📊 Comprehensive Post-Match Analysis
- **Wagon Wheels**: Visualize where runs were scored.
- **Pitch Maps**: See a scatter map of where deliveries pitched on the 22-yard strip.
- **Beehive (Impact)**: View where the ball passed the stumps.
- **Cloud Database**: Save your matches and ball-by-ball history directly to the local SQLite database.

## Architecture

- **Frontend (Mobile)**: React Native / Expo. Uses `react-native-vision-camera` for high-speed frame capture, and `react-native-svg` for dynamic data visualization.
- **Backend (AI)**: FastAPI / Python. Powered by OpenCV (`BackgroundSubtractorMOG2`, trajectory plotting) and MediaPipe for biomechanics. Uses SQLite for zero-setup local database storage.

## Setup Instructions

### 1. Start the AI Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Run the React Native App
```bash
cd mobile
npm install
npx expo start
```

*Note: For the best performance, it is recommended to build the app natively using `npx expo run:ios` or `npx expo run:android`, or deploy it to a physical device via GitHub Actions.*

## Technologies Used
- React Native
- Expo
- FastAPI
- OpenCV
- MediaPipe
- SQLite
- SQLAlchemy
