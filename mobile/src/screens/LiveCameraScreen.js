import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, Alert, Modal, Vibration } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { Check, Target, LogOut, AlertTriangle, X, Trophy, Bot, RefreshCw, Settings, Square } from 'lucide-react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect, Line, Polyline } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function LiveCameraScreen({ route, navigation }) {
  const device = useCameraDevice('back');
  const cameraRef = useRef(null);
  
  // Params
  const sessionType = route?.params?.sessionType || 'MATCH'; 
  const matchDetails = route?.params?.matchDetails || {
    teamA: 'Team A', teamB: 'Team B', format: 'T20', overs: 20,
    battingTeamName: 'Team A', bowlingTeamName: 'Team B',
    battingRoster: ['P1', 'P2'], bowlingRoster: ['P3', 'P4'],
    striker: 'P1', nonStriker: 'P2'
  };

  const matchId = useRef(route?.params?.savedMatchId || new Date().getTime().toString()).current;
  
  const [mode, setMode] = useState(route?.params?.isResume ? 'LIVE' : 'CALIBRATE_STRIKER'); 
  
  // Innings Management
  const [innings, setInnings] = useState(route?.params?.innings || 1);
  const [targetScore, setTargetScore] = useState(route?.params?.targetScore || null);
  const [battingTeam, setBattingTeam] = useState(route?.params?.battingTeam || matchDetails.battingTeamName);
  const [bowlingTeam, setBowlingTeam] = useState(route?.params?.bowlingTeam || matchDetails.bowlingTeamName);
  
  // Roster Management
  const [activeStriker, setActiveStriker] = useState(route?.params?.activeStriker || 1);
  const [strikerName, setStrikerName] = useState(route?.params?.strikerName || matchDetails.striker);
  const [nonStrikerName, setNonStrikerName] = useState(route?.params?.nonStrikerName || matchDetails.nonStriker);
  const [yetToBat, setYetToBat] = useState(route?.params?.yetToBat || matchDetails.battingRoster.filter(p => p !== matchDetails.striker && p !== matchDetails.nonStriker));
  
  // Calibration
  const [strikerStumps, setStrikerStumps] = useState([]);
  const [nonStrikerStumps, setNonStrikerStumps] = useState([]);
  
  const [matchHistory, setMatchHistory] = useState(route?.params?.matchHistory || []);

  const [score, setScore] = useState(route?.params?.score || { runs: 0, wickets: 0, balls: 0, extras: 0 });
  const [engineState, setEngineState] = useState('IDLE'); 
  const [showTrail, setShowTrail] = useState(false);
  const [recentStats, setRecentStats] = useState(null);
  const [isStatsHidden, setIsStatsHidden] = useState(false);
  const [pitchDistance, setPitchDistance] = useState(10.0);

  // Autonomous Hands-Free Mode
  const [isAutonomous, setIsAutonomous] = useState(true);
  const [autoCountdown, setAutoCountdown] = useState(null);
  const autoCountdownTimerRef = useRef(null);

  // Umpire AI & DRS
  const [isNoBall, setIsNoBall] = useState(false);
  const [isFreeHit, setIsFreeHit] = useState(false);
  const [showDRSModal, setShowDRSModal] = useState(false);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [drsStep, setDrsStep] = useState(0); 

  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // RECORDING SETTINGS
  const [recordingDuration, setRecordingDuration] = useState(6);
  const [showSettings, setShowSettings] = useState(false);

  // AUTO-SAVE MATCH STATE
  useEffect(() => {
    if (score.balls > 0 || score.runs > 0 || score.wickets > 0) {
      const saveMatch = async () => {
        try {
          const matchData = {
            id: matchId,
            date: new Date().toISOString(),
            sessionType,
            matchDetails,
            score,
            innings,
            battingTeam,
            bowlingTeam,
            activeStriker,
            strikerName,
            nonStrikerName,
            yetToBat,
            targetScore,
            matchHistory
          };
          const existing = await AsyncStorage.getItem('saved_matches');
          let list = existing ? JSON.parse(existing) : [];
          list = list.filter(m => m.id !== matchId);
          list.unshift(matchData);
          await AsyncStorage.setItem('saved_matches', JSON.stringify(list));
        } catch (e) {
          console.log('Auto-save error:', e);
        }
      };
      saveMatch();
    }
  }, [score, matchHistory]);

  const handleTap = (e) => {
    if (showTrail) {
      setShowTrail(false);
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
      return;
    }
    if (engineState !== 'IDLE') return;
    const { pageX, pageY } = e.nativeEvent;
    if (mode === 'CALIBRATE_STRIKER' && strikerStumps.length < 3) {
      setStrikerStumps([...strikerStumps, { x: pageX, y: pageY }]);
    } else if (mode === 'CALIBRATE_NON_STRIKER' && nonStrikerStumps.length < 3) {
      setNonStrikerStumps([...nonStrikerStumps, { x: pageX, y: pageY }]);
    }
  };

  const resetForNextDelivery = () => {
    setShowTrail(false);
    if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    if (autoCountdownTimerRef.current) clearInterval(autoCountdownTimerRef.current);
    setAutoCountdown(null);
    setEngineState('IDLE');
    if (isAutonomous && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ARM' }));
    }
    try { Vibration.vibrate(60); } catch (_) {}
  };

  const wsRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const animIntervalRef = useRef(null);
  const [trailStep, setTrailStep] = useState(0);

  const startTrailAnimation = (points) => {
    if (!points || points.length === 0) return;
    if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    setShowTrail(true);
    setTrailStep(1);
    let step = 1;
    animIntervalRef.current = setInterval(() => {
      step += 1;
      if (step > points.length) {
        clearInterval(animIntervalRef.current);
      } else {
        setTrailStep(step);
      }
    }, 40); // 40ms per coordinate for smooth animated ball flight
  };

  // Continuous Autonomous Stream
  const connectAILiveStream = () => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.2.65:8000';
    const WS_URL = API_URL.replace('http', 'ws').replace('https', 'wss') + '/ws/live-stream';
    
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    wsRef.current = new WebSocket(WS_URL);
    
    wsRef.current.onopen = () => {
      console.log("[AI Autonomous] Connected to backend WebSocket.");
      let isCapturing = false;
      const streamInterval = setInterval(async () => {
        if (isCapturing) return;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && cameraRef.current) {
          try {
            isCapturing = true;
            // takeSnapshot grabs preview frame from GPU, bypassing Vision Camera video lock
            const photo = await cameraRef.current.takeSnapshot({ quality: 25 });
            const photoPath = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
            const base64 = await FileSystem.readAsStringAsync(photoPath, { encoding: FileSystem.EncodingType.Base64 });
            wsRef.current.send(JSON.stringify({ type: 'frame', data: base64 }));
          } catch (e) {
            // Drop frame if busy
          } finally {
            isCapturing = false;
          }
        } else if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          clearInterval(streamInterval);
        }
      }, 140); // ~7 FPS continuous snapshot stream
      wsRef.current.streamInterval = streamInterval;
    };

    wsRef.current.onmessage = async (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.action === 'START_RECORDING') {
          console.log("[AI Autonomous] AI detected run-up! Starting recording automatically.");
          try { Vibration.vibrate(80); } catch (_) {}
          startRecordingInternal();
        } else if (msg.action === 'STOP_RECORDING') {
          console.log(`[AI Autonomous] AI detected dead delivery (${msg.reason})! Stopping recording.`);
          try { Vibration.vibrate([0, 80, 80, 80]); } catch (_) {}
          await stopRecordingInternal();
        }
      } catch (err) {
        console.log("[AI Autonomous] Message parse error:", err);
      }
    };
  };

  // Connect autonomous stream once in LIVE mode
  useEffect(() => {
    if (mode === 'LIVE') {
      connectAILiveStream();
    }
    return () => {
      if (wsRef.current) {
        if (wsRef.current.streamInterval) clearInterval(wsRef.current.streamInterval);
        if (wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
      }
      if (autoCountdownTimerRef.current) clearInterval(autoCountdownTimerRef.current);
    };
  }, [mode]);

  const startRecordingInternal = async () => {
    if (!cameraRef.current) return;
    setEngineState('RECORDING_CLIP');
    setShowTrail(false);
    if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    if (autoCountdownTimerRef.current) clearInterval(autoCountdownTimerRef.current);
    setAutoCountdown(null);
    
    // Safety max timer in case AI misses delivery
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => {
      console.log("[Auto-Stop] Max safety recording limit reached.");
      stopRecordingInternal();
    }, Math.max(recordingDuration, 8) * 1000);

    try {
      cameraRef.current.startRecording({
        onRecordingFinished: async (video) => {
          setEngineState('ANALYZING');
          try {
            let formData = new FormData();
            formData.append('file', { uri: video.path, name: 'delivery.mp4', type: 'video/mp4' });
            formData.append('pitch_length', pitchDistance.toString());
            
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.2.65:8000';
            const response = await fetch(`${API_URL}/upload-video`, { 
              method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' } 
            });
            const aiData = await response.json();
            handleBackendResponse(aiData);
          } catch (err) {
            console.log('Video upload/analysis error:', err);
            Alert.alert('Analysis Failed', 'Could not process delivery with AI engine.');
            setEngineState('IDLE');
          }
        },
        onRecordingError: (error) => {
          console.log('Recording Error:', error);
          setEngineState('IDLE');
        }
      });
    } catch (error) {
      console.log('Error triggering recording:', error);
      setEngineState('IDLE');
    }
  };

  const stopRecordingInternal = async () => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    if (cameraRef.current) {
      try {
        await cameraRef.current.stopRecording();
      } catch (e) {
        console.log('Stop recording error:', e);
      }
    }
  };

  const [showSpeedFlash, setShowSpeedFlash] = useState(false);

  // Trigger Hands-Free Auto-Rearm Countdown
  const triggerAutoRearm = () => {
    let count = 4;
    setAutoCountdown(count);
    if (autoCountdownTimerRef.current) clearInterval(autoCountdownTimerRef.current);
    autoCountdownTimerRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(autoCountdownTimerRef.current);
        setAutoCountdown(null);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'ARM' }));
        }
        setEngineState('IDLE');
      } else {
        setAutoCountdown(count);
      }
    }, 1000);
  };

  const handleBackendResponse = (aiData) => {
    // Store ALL real TV broadcast metrics from the backend
    const points = aiData.trajectory_points || [];
    setRecentStats({
      speed: aiData.speed,
      release_speed: aiData.release_speed || aiData.speed,
      pitch_speed: aiData.pitch_speed || Math.round(aiData.speed * 0.86),
      length_category: aiData.length_category || "GOOD LENGTH",
      stump_target: aiData.stump_target || "MIDDLE STUMP",
      swing: aiData.swing,
      turn: aiData.turn,
      videoUrl: aiData.videoUrl,
      trajectory_points: points,
      hawkeye: aiData.hawkeye || {}
    });
    setIsStatsHidden(false);

    if (points.length > 0) {
      startTrailAnimation(points);
    }

    if (aiData.speed > 0) {
      setShowSpeedFlash(true);
      setTimeout(() => setShowSpeedFlash(false), 2500);
    }

    if (aiData.isNoBall) {
      setIsNoBall(true);
      setIsFreeHit(true);
      let newScore = { ...score };
      newScore.runs += 1;
      newScore.extras += 1;
      setScore(newScore);
      setTimeout(() => { setIsNoBall(false); setEngineState('SCORING'); }, 3000);
    } else {
      setIsFreeHit(false);
      if (sessionType === 'PRACTICE') {
        setEngineState('IDLE');
        if (isAutonomous) {
          triggerAutoRearm();
        }
      } else {
        setEngineState('SCORING');
      }
    }
  };

  const checkInningsOver = (currentScore) => {
    const isAllOut = currentScore.wickets >= 10 || yetToBat.length === 0;
    const isOversFinished = currentScore.balls >= (matchDetails.overs * 6);
    const isTargetChased = innings === 2 && targetScore && currentScore.runs >= targetScore;
    
    if (isAllOut || isOversFinished || isTargetChased) {
      stopAutoTracking();
      if (innings === 1) {
        setTargetScore(currentScore.runs + 1);
        setEngineState('INNINGS_BREAK');
      } else {
        setEngineState('MATCH_OVER');
      }
      return true;
    }
    return false;
  };

  const handleScore = (runs, type = 'RUNS') => {
    let newScore = { ...score };
    let isWicket = false;
    
    if (type === 'WICKET') {
      if (isFreeHit && runs !== 'Run Out') {
        Alert.alert('Free Hit!', 'Batsman cannot be dismissed!');
      } else {
        newScore.wickets += 1;
        newScore.balls += 1;
        isWicket = true;
      }
    } else if (type === 'EXTRA') {
      newScore.runs += runs;
      newScore.extras += runs;
    } else {
      newScore.runs += runs;
      newScore.balls += 1;
    }
    
    if (type !== 'EXTRA' && type !== 'WICKET' && runs % 2 !== 0) setActiveStriker(activeStriker === 1 ? 2 : 1);
    if (newScore.balls > 0 && newScore.balls % 6 === 0) setActiveStriker(activeStriker === 1 ? 2 : 1);
    
    setScore(newScore);

    // Save the actual ball to matchHistory
    setMatchHistory(prev => [...prev, {
      inning: innings,
      over_number: Math.floor((newScore.balls - 1) / 6),
      ball_number: ((newScore.balls - 1) % 6) + 1,
      bowler: bowlingTeam, // Dummy bowler
      batsman: activeStriker === 1 ? strikerName : nonStrikerName,
      speed: recentStats?.speed || 0.0,
      swing: recentStats?.swing || 0.0,
      turn: recentStats?.turn || 0.0,
      pitching: recentStats?.hawkeye?.pitching || "UNKNOWN",
      impact: recentStats?.hawkeye?.impact || "UNKNOWN",
      wickets: recentStats?.hawkeye?.wickets || "UNKNOWN",
      runs: runs,
      is_wicket: isWicket ? "Yes" : "No"
    }]);
    if (checkInningsOver(newScore)) return;

    if (isWicket) {
      stopAutoTracking();
      setEngineState('SELECT_BATSMAN');
    } else {
      setEngineState('IDLE');
    }
  };

  if (!device) return <View style={styles.container}><Text style={{color:'#fff'}}>Loading Camera...</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      
      {/* SETTINGS MODAL */}
      <Modal visible={showSettings} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Camera & Pitch Settings</Text>
            
            <Text style={styles.settingsLabel}>Pitch / Room Length</Text>
            <Text style={styles.settingsSubtext}>Calibrates ball speed to your actual playing space.</Text>
            
            <View style={styles.pitchSelectorRow}>
              {[
                { label: '5m (Room)', val: 5.0 },
                { label: '10m (Nets)', val: 10.0 },
                { label: '20m (Full Pitch)', val: 20.0 }
              ].map(item => (
                <TouchableOpacity 
                  key={item.val}
                  style={[styles.pitchChoiceBtn, pitchDistance === item.val && styles.pitchChoiceBtnActive]}
                  onPress={() => setPitchDistance(item.val)}
                >
                  <Text style={[styles.pitchChoiceText, pitchDistance === item.val && styles.pitchChoiceTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.settingsLabel, { marginTop: 16 }]}>Max Safety Window (Seconds)</Text>
            <Text style={styles.settingsSubtext}>Auto-stops recording if ball leaves frame.</Text>
            
            <View style={styles.stepperContainer}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setRecordingDuration(Math.max(2, recordingDuration - 1))}>
                <Text style={styles.stepperBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{recordingDuration}s</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setRecordingDuration(Math.min(15, recordingDuration + 1))}>
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveSettingsBtn} onPress={() => setShowSettings(false)}>
              <Text style={styles.saveSettingsText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* DRS MODAL */}
      <Modal visible={showDRSModal} transparent={true} animationType="fade">
        <View style={styles.drsBg}>
          <View style={styles.drsContent}>
            <Text style={styles.drsTitle}>BALL TRACKING</Text>
            
            <View style={styles.drsVisual}>
              <Svg height="150" width="100%" viewBox="0 0 100 100">
                <Rect x="30" y="10" width="40" height="80" fill="#d2b48c" />
                <Rect x="46" y="70" width="2" height="15" fill="#fff" />
                <Rect x="49" y="70" width="2" height="15" fill="#fff" />
                <Rect x="52" y="70" width="2" height="15" fill="#fff" />
                
                {recentStats?.trajectory_points?.length > 0 ? (
                  <>
                    <Polyline 
                      points={recentStats.trajectory_points.map(p => `${p.x * 100},${p.y * 100}`).join(' ')}
                      fill="none"
                      stroke="#ff0000"
                      strokeWidth="2"
                      strokeDasharray="4"
                    />
                    <Circle 
                      cx={recentStats.trajectory_points[recentStats.trajectory_points.length - 1].x * 100} 
                      cy={recentStats.trajectory_points[recentStats.trajectory_points.length - 1].y * 100} 
                      r="4" 
                      fill="#ffea00" 
                    />
                  </>
                ) : (
                  <Text style={{color:'#fff', textAlign:'center', marginTop: 50}}>No Tracker Data</Text>
                )}
              </Svg>
            </View>

            <View style={styles.drsMetricsRow}>
              <Text style={styles.drsMetricLabel}>PITCHING</Text>
              {drsStep >= 1 ? <Text style={[styles.drsMetricValue, {color: recentStats?.hawkeye?.pitching === 'IN LINE' ? '#00e676' : '#ffea00'}]}>{recentStats?.hawkeye?.pitching || 'N/A'}</Text> : <Text style={styles.drsMetricPending}>Checking...</Text>}
            </View>
            <View style={styles.drsMetricsRow}>
              <Text style={styles.drsMetricLabel}>IMPACT</Text>
              {drsStep >= 2 ? <Text style={[styles.drsMetricValue, {color: recentStats?.hawkeye?.impact === 'IN LINE' ? '#00e676' : '#ffea00'}]}>{recentStats?.hawkeye?.impact || 'N/A'}</Text> : <Text style={styles.drsMetricPending}>Checking...</Text>}
            </View>
            <View style={styles.drsMetricsRow}>
              <Text style={styles.drsMetricLabel}>WICKETS</Text>
              {drsStep >= 3 ? <Text style={[styles.drsMetricValue, {color: recentStats?.hawkeye?.wickets === 'HITTING' ? '#ff1744' : '#00e676'}]}>{recentStats?.hawkeye?.wickets || 'N/A'}</Text> : <Text style={styles.drsMetricPending}>Checking...</Text>}
            </View>

            {drsStep >= 3 && (
              <TouchableOpacity style={styles.drsCloseBtn} onPress={() => setShowDRSModal(false)}>
                <Text style={styles.drsCloseText}>DECISION: {recentStats?.hawkeye?.wickets === 'HITTING' ? 'OUT' : 'NOT OUT'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
      
      <View style={StyleSheet.absoluteFillObject} onTouchEnd={handleTap}>
        <Camera 
          style={StyleSheet.absoluteFillObject} 
          device={device} 
          isActive={true} 
          video={true}
          photo={true}
          ref={cameraRef} 
        />
        
        {/* CALIBRATION MODE */}
        {(mode === 'CALIBRATE_STRIKER' || mode === 'CALIBRATE_NON_STRIKER') && (
          <View style={styles.calibrationOverlay}>
            <Text style={styles.instructionText}>
              {mode === 'CALIBRATE_STRIKER' ? `Map STRIKER'S stumps (${strikerStumps.length}/3)` : `Map NON-STRIKER'S stumps (${nonStrikerStumps.length}/3)`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                style={[styles.confirmBtn, (mode === 'CALIBRATE_STRIKER' ? strikerStumps.length : nonStrikerStumps.length) === 0 && { opacity: 0.5 }]} 
                onPress={() => {
                  if (mode === 'CALIBRATE_STRIKER' && strikerStumps.length > 0) setMode('CALIBRATE_NON_STRIKER');
                  else if (mode === 'CALIBRATE_NON_STRIKER' && nonStrikerStumps.length > 0) setMode('LIVE');
                }}>
                <Check color="#000" size={20} />
                <Text style={styles.confirmBtnText}>{mode === 'CALIBRATE_STRIKER' ? 'Lock Stumps' : 'Start Match'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.skipCalibrationBtn}
                onPress={() => setMode('LIVE')}
              >
                <Text style={styles.skipCalibrationText}>Skip Calibration</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* CALIBRATION MARKERS */}
        {strikerStumps.map((coord, index) => <View key={`s-${index}`} style={[styles.marker, styles.strikerMarker, { left: coord.x - 6, top: coord.y - 6 }]} />)}
        {nonStrikerStumps.map((coord, index) => <View key={`ns-${index}`} style={[styles.marker, styles.nonStrikerMarker, { left: coord.x - 8, top: coord.y - 8 }]} />)}

        {/* SPEED FLASH OVERLAY */}
        {showSpeedFlash && recentStats && (
          <View style={styles.speedFlashOverlay}>
            <Text style={styles.speedFlashText}>{recentStats.speed} <Text style={{fontSize: 32}}>km/h</Text></Text>
          </View>
        )}

        {/* UMPIRE AI NO-BALL OVERLAY */}
        {isNoBall && (
          <View style={styles.noBallOverlay}>
            <AlertTriangle color="#ff1744" size={64} />
            <Text style={styles.noBallText}>NO BALL</Text>
          </View>
        )}

        {/* LIVE ANIMATED BALL TRACER OVERLAY */}
        {showTrail && recentStats?.trajectory_points?.length > 0 && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 25, elevation: 25 }]}>
            <TouchableOpacity 
              activeOpacity={1} 
              style={StyleSheet.absoluteFill} 
              onPress={() => {
                setShowTrail(false);
                if (animIntervalRef.current) clearInterval(animIntervalRef.current);
              }}
            >
              <Svg height="100%" width="100%" viewBox={`0 0 ${width} ${height}`}>
                {/* Glowing Neon Red Trail */}
                {trailStep > 1 && (
                  <>
                    <Polyline 
                      points={recentStats.trajectory_points.slice(0, trailStep).map(p => `${p.x * width},${p.y * height}`).join(' ')}
                      fill="none"
                      stroke="#ff1744"
                      strokeWidth="12"
                      opacity="0.3"
                    />
                    <Polyline 
                      points={recentStats.trajectory_points.slice(0, trailStep).map(p => `${p.x * width},${p.y * height}`).join(' ')}
                      fill="none"
                      stroke="#ff1744"
                      strokeWidth="5"
                      strokeDasharray="6 3"
                    />
                  </>
                )}
                {/* Traveling Ball */}
                {recentStats.trajectory_points[Math.min(trailStep - 1, recentStats.trajectory_points.length - 1)] && (
                  <Circle 
                    cx={recentStats.trajectory_points[Math.min(trailStep - 1, recentStats.trajectory_points.length - 1)].x * width} 
                    cy={recentStats.trajectory_points[Math.min(trailStep - 1, recentStats.trajectory_points.length - 1)].y * height} 
                    r="12" 
                    fill="#ffea00" 
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                )}
              </Svg>
            </TouchableOpacity>

            {/* Tracer Top Header */}
            <View style={styles.tracerHeaderBar}>
              <View style={styles.tracerBadge}>
                <View style={styles.tracerDot} />
                <Text style={styles.tracerTitle}>HAWKEYE BALL TRACER</Text>
              </View>
              <TouchableOpacity 
                style={styles.tracerCloseBtn} 
                onPress={() => {
                  setShowTrail(false);
                  if (animIntervalRef.current) clearInterval(animIntervalRef.current);
                }}
              >
                <X color="#fff" size={20} />
              </TouchableOpacity>
            </View>

            {/* Tracer Bottom Actions */}
            <View style={styles.tracerBottomBar}>
              <TouchableOpacity 
                style={styles.tracerReplayBtn} 
                onPress={() => startTrailAnimation(recentStats.trajectory_points)}
              >
                <Text style={styles.tracerReplayText}>🎥 REPLAY</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.tracerNextBallBtn} 
                onPress={resetForNextDelivery}
              >
                <Text style={styles.tracerNextBallText}>⚡ BOWL NEXT BALL</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SCREEN RECORDING RED BORDER */}
        {engineState === 'RECORDING_CLIP' && (
          <View style={styles.screenRecordingBorder} pointerEvents="none">
            <View style={styles.recordingOverlayFloating}>
              <View style={styles.redDot} />
              <Text style={styles.recordingText}>AI RECORDING DELIVERY</Text>
            </View>
          </View>
        )}

        {/* AUTONOMOUS AUTO-REARM COUNTDOWN BANNER */}
        {autoCountdown !== null && (
          <View style={styles.countdownBanner} pointerEvents="none">
            <RefreshCw color="#00e676" size={18} />
            <Text style={styles.countdownText}>Next Ball Armed in {autoCountdown}s...</Text>
          </View>
        )}

        {mode === 'LIVE' && !isNoBall && (
          <>
            {/* TOP CONTROLS: END MATCH, AUTONOMOUS TOGGLE, SETTINGS */}
            <View style={styles.topControlRow}>
              <TouchableOpacity style={styles.endMatchBtn} onPress={() => {
                Alert.alert('End Match', 'Are you sure you want to end and analyze this match?', [
                  {text: 'Cancel', style: 'cancel'},
                  {text: 'End', style: 'destructive', onPress: () => {
                    AsyncStorage.removeItem('saved_matches');
                    navigation.replace('PostMatchAnalysis', { matchDetails, score, matchHistory }); 
                  }}
                ]);
              }}>
                <LogOut color="#fff" size={16} />
                <Text style={styles.endMatchText}>END</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.autoModeBtn, isAutonomous ? styles.autoModeBtnActive : styles.autoModeBtnInactive]} 
                onPress={() => setIsAutonomous(!isAutonomous)}
              >
                <Bot color={isAutonomous ? '#00e676' : '#888'} size={16} />
                <Text style={[styles.autoModeText, { color: isAutonomous ? '#00e676' : '#888' }]}>
                  {isAutonomous ? 'AI HANDS-FREE: ON' : 'MANUAL'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingsIconBtn} onPress={() => setShowSettings(true)}>
                <Settings color="#fff" size={18} />
                <Text style={styles.settingsIconText}>{pitchDistance}m</Text>
              </TouchableOpacity>
            </View>

            {/* RECENT STATS WIDGET WITH BROADCAST DUAL-SPEED & DISMISS BUTTON */}
            {recentStats && engineState !== 'RECORDING_CLIP' && engineState !== 'ANALYZING' && (
              isStatsHidden ? (
                <TouchableOpacity 
                  style={styles.minimizedStatsPill} 
                  onPress={() => setIsStatsHidden(false)}
                >
                  <Text style={styles.minimizedStatsText}>📊 LAST BALL ({recentStats.speed} km/h)</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.recentStatsWidget}>
                  <View style={styles.statHeaderRow}>
                    <Text style={styles.recentStatsTitle}>LAST BALL</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {recentStats.length_category && (
                        <View style={[styles.lengthTag, { 
                          backgroundColor: recentStats.length_category === 'YORKER' ? '#ff9100' : 
                                           recentStats.length_category === 'GOOD LENGTH' ? '#00e676' : 
                                           recentStats.length_category === 'FULL LENGTH' ? '#2979ff' : '#ff1744',
                          marginRight: 6
                        }]}>
                          <Text style={styles.lengthTagText}>{recentStats.length_category}</Text>
                        </View>
                      )}
                      <TouchableOpacity onPress={() => setIsStatsHidden(true)} style={{ padding: 2 }}>
                        <X color="#888" size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {recentStats.speed > 0 ? (
                    <>
                      <View style={styles.statLine}>
                        <Text style={styles.statLineLabel}>Release:</Text>
                        <Text style={styles.statLineValue}>{recentStats.release_speed || recentStats.speed} km/h</Text>
                      </View>
                      {recentStats.pitch_speed && (
                        <View style={styles.statLine}>
                          <Text style={styles.statLineLabel}>Off Pitch:</Text>
                          <Text style={[styles.statLineValue, { color: '#00e676' }]}>{recentStats.pitch_speed} km/h</Text>
                        </View>
                      )}
                      <View style={styles.statLine}>
                        <Text style={styles.statLineLabel}>Swing:</Text>
                        <Text style={styles.statLineValue}>{recentStats.swing}°</Text>
                      </View>
                      <View style={styles.statLine}>
                        <Text style={styles.statLineLabel}>Turn:</Text>
                        <Text style={styles.statLineValue}>{recentStats.turn}°</Text>
                      </View>
                      {recentStats.stump_target && (
                        <Text style={styles.stumpTargetText}>🎯 {recentStats.stump_target}</Text>
                      )}
                    </>
                  ) : (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ color: '#ff9100', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>NO BALL DETECTED</Text>
                      <Text style={{ color: '#aaa', fontSize: 10, textAlign: 'center', marginTop: 2 }}>Hold camera steady on delivery</Text>
                    </View>
                  )}

                  <TouchableOpacity style={styles.drsWidgetBtn} onPress={() => {
                    setShowDRSModal(true);
                    setDrsStep(0);
                    setTimeout(() => setDrsStep(1), 1000);
                    setTimeout(() => setDrsStep(2), 2500);
                    setTimeout(() => setDrsStep(3), 4000);
                  }}>
                    <Target color="#fff" size={16} />
                    <Text style={styles.drsWidgetBtnText}>DRS REVIEW</Text>
                  </TouchableOpacity>

                  {recentStats.trajectory_points?.length > 0 && (
                    <TouchableOpacity 
                      style={[styles.drsWidgetBtn, {backgroundColor: '#ff1744'}]} 
                      onPress={() => startTrailAnimation(recentStats.trajectory_points)}
                    >
                      <Text style={styles.drsWidgetBtnText}>🎥 REPLAY TRACER</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={[styles.drsWidgetBtn, {backgroundColor: '#00e676', marginTop: 6}]} 
                    onPress={resetForNextDelivery}
                  >
                    <Text style={[styles.drsWidgetBtnText, {color: '#000', fontWeight: '900'}]}>⚡ NEXT BALL</Text>
                  </TouchableOpacity>
                </View>
              )
            )}

            {/* ACTION BOTTOM BAR - NEVER TRAPS THE USER */}
            <View style={styles.actionBottomBar} pointerEvents="box-none">
              {engineState === 'RECORDING_CLIP' && (
                <TouchableOpacity style={styles.stopRecordingBtn} onPress={stopRecordingInternal}>
                  <Square color="#fff" size={18} fill="#fff" />
                  <Text style={styles.stopRecordingBtnText}>STOP DELIVERY</Text>
                </TouchableOpacity>
              )}

              {engineState === 'IDLE' && (
                <View style={styles.idleActionContainer}>
                  <TouchableOpacity 
                    style={[styles.recordBtn, isAutonomous && styles.recordBtnAutonomous]} 
                    onPress={startRecordingInternal}
                  >
                    <View style={[styles.recordBtnInner, isAutonomous && { backgroundColor: '#00e676' }]} />
                    <Text style={styles.recordBtnText}>
                      {isAutonomous ? '⚡ BOWL NOW (MANUAL OVERRIDE)' : 'START DELIVERY'}
                    </Text>
                  </TouchableOpacity>
                  {isAutonomous && (
                    <Text style={styles.autonomousHintText}>
                      AI is listening for run-up... or tap above to record manually
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* ADVANCED SCOREBOARD */}
            {sessionType === 'MATCH' && (
              <View style={styles.scoreboardContainer}>
                <View style={styles.scoreTopRow}>
                  <Text style={styles.mainScore}>{score.runs}-{score.wickets}</Text>
                  <Text style={styles.overs}>({Math.floor(score.balls / 6)}.{score.balls % 6})</Text>
                </View>
              </View>
            )}

            {/* SCORING POPUP */}
            {engineState === 'SCORING' && (
              <View style={styles.scoringPopup}>
                <View style={styles.scoreRow}>
                  {[0,1,2,3,4,6].map(r => (
                    <TouchableOpacity key={r} style={styles.scoreBox} onPress={() => handleScore(r)}>
                      <Text style={styles.scoreBoxText}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={[styles.scoreBox, styles.wicketBox]} onPress={() => handleScore('W', 'WICKET')}>
                    <Text style={styles.scoreBoxText}>W</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  style={styles.skipScoringBtn} 
                  onPress={resetForNextDelivery}
                >
                  <Text style={styles.skipScoringText}>NEXT BALL (SKIP SCORING)</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {engineState === 'ANALYZING' && (
              <View style={[styles.recordingOverlay, {backgroundColor: 'rgba(41, 121, 255, 0.9)'}]}>
                <Text style={[styles.recordingText, {color: '#fff'}]}>UPLOADING TO AI ENGINE...</Text>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  calibrationOverlay: { position: 'absolute', bottom: 50, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.8)', padding: 20, borderRadius: 15, alignItems: 'center' },
  instructionText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  confirmBtn: { flexDirection: 'row', backgroundColor: '#00e676', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30 },
  confirmBtnText: { color: '#000', fontWeight: 'bold', marginLeft: 10 },
  marker: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
  strikerMarker: { backgroundColor: '#ffea00' },
  nonStrikerMarker: { backgroundColor: '#ff1744' },
  
  noBallOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  noBallText: { color: '#ff1744', fontSize: 48, fontWeight: '900', marginTop: 10, letterSpacing: 3 },
  
  speedFlashOverlay: { position: 'absolute', top: '35%', alignSelf: 'center', backgroundColor: 'rgba(0, 230, 118, 0.9)', paddingVertical: 20, paddingHorizontal: 40, borderRadius: 20, borderWidth: 4, borderColor: '#fff', elevation: 20 },
  speedFlashText: { color: '#000', fontSize: 72, fontWeight: '900', fontStyle: 'italic', textAlign: 'center' },
  
  screenRecordingBorder: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderWidth: 4, borderColor: '#ff1744', zIndex: 8 },
  recordingOverlayFloating: { position: 'absolute', top: 20, alignSelf: 'center', flexDirection: 'row', backgroundColor: 'rgba(255, 23, 68, 0.95)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center' },
  redDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff', marginRight: 8 },
  recordingText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 1 },

  countdownBanner: { position: 'absolute', bottom: 120, alignSelf: 'center', flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.85)', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 25, borderWidth: 1.5, borderColor: '#00e676', alignItems: 'center', zIndex: 12 },
  countdownText: { color: '#00e676', fontWeight: 'bold', fontSize: 14, marginLeft: 8 },

  topControlRow: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  endMatchBtn: { backgroundColor: 'rgba(255, 23, 68, 0.8)', flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, alignItems: 'center' },
  endMatchText: { color: '#fff', fontWeight: 'bold', marginLeft: 6, fontSize: 12 },
  autoModeBtn: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, alignItems: 'center', borderWidth: 1 },
  autoModeBtnActive: { backgroundColor: 'rgba(0, 230, 118, 0.2)', borderColor: '#00e676' },
  autoModeBtnInactive: { backgroundColor: 'rgba(0,0,0,0.6)', borderColor: '#555' },
  autoModeText: { fontWeight: 'bold', marginLeft: 6, fontSize: 12 },

  scoreboardContainer: { position: 'absolute', top: 95, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.85)', paddingVertical: 8, paddingHorizontal: 24, borderRadius: 25, borderWidth: 1, borderColor: '#444' },
  scoreTopRow: { flexDirection: 'row', alignItems: 'center' },
  mainScore: { color: '#fff', fontSize: 32, fontWeight: '900' },
  overs: { color: '#888', fontSize: 16, marginLeft: 10, fontWeight: 'bold' },
  
  recordingOverlay: { position: 'absolute', top: 50, alignSelf: 'center', flexDirection: 'row', backgroundColor: 'rgba(255, 23, 68, 0.9)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, alignItems: 'center' },

  scoringPopup: { position: 'absolute', bottom: 100, left: 10, right: 10, backgroundColor: '#111', padding: 20, borderRadius: 25 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreBox: { flex: 1, backgroundColor: '#222', marginHorizontal: 5, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  scoreBoxText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  wicketBox: { backgroundColor: '#ff1744' },

  actionBottomBar: { position: 'absolute', bottom: 40, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' },
  recordBtn: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.7)', paddingRight: 25, borderRadius: 40, borderWidth: 2, borderColor: '#00e676', alignItems: 'center' },
  recordBtnInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#00e676', margin: 5 },
  recordBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, marginLeft: 10 },
  
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e1e1e', padding: 25, borderRadius: 20 },
  modalTitle: { color: '#00e676', fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  settingsLabel: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  settingsSubtext: { color: '#aaa', textAlign: 'center', marginBottom: 20, fontSize: 12 },
  stepperContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  stepperBtn: { backgroundColor: '#333', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  stepperBtnText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  stepperValue: { color: '#00e676', fontSize: 32, fontWeight: '900', width: 100, textAlign: 'center' },
  saveSettingsBtn: { backgroundColor: '#00e676', paddingVertical: 15, borderRadius: 10 },
  saveSettingsText: { color: '#000', textAlign: 'center', fontWeight: '900', fontSize: 16 },

  drsBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  drsContent: { backgroundColor: '#111', padding: 25, borderRadius: 20, borderWidth: 2, borderColor: '#333' },
  drsTitle: { color: '#2979ff', fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: 2, marginBottom: 20 },
  drsVisual: { backgroundColor: '#222', borderRadius: 15, padding: 10, marginBottom: 20 },
  drsMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
  drsMetricLabel: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  drsMetricValue: { fontSize: 18, fontWeight: '900' },
  drsMetricPending: { color: '#666', fontSize: 18, fontStyle: 'italic' },
  drsCloseBtn: { backgroundColor: '#ff1744', marginTop: 25, paddingVertical: 15, borderRadius: 10 },
  drsCloseText: { color: '#fff', textAlign: 'center', fontWeight: '900', fontSize: 18, letterSpacing: 1 },

  recentStatsWidget: { position: 'absolute', top: 120, right: 15, backgroundColor: 'rgba(0,0,0,0.85)', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#333', width: 160 },
  statHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  recentStatsTitle: { color: '#00e676', fontWeight: '900', fontSize: 14 },
  lengthTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  lengthTagText: { color: '#000', fontSize: 9, fontWeight: '900' },
  statLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  statLineLabel: { color: '#aaa', fontWeight: 'bold', fontSize: 12 },
  statLineValue: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  stumpTargetText: { color: '#ffea00', fontWeight: 'bold', fontSize: 11, marginTop: 4, textAlign: 'center' },
  drsWidgetBtn: { flexDirection: 'row', backgroundColor: '#2979ff', padding: 8, borderRadius: 8, marginTop: 8, justifyContent: 'center', alignItems: 'center' },
  drsWidgetBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 11, marginLeft: 5 },

  pitchSelectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  pitchChoiceBtn: { flex: 1, paddingVertical: 10, marginHorizontal: 3, backgroundColor: '#333', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#555' },
  pitchChoiceBtnActive: { backgroundColor: '#00e676', borderColor: '#00e676' },
  pitchChoiceText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  pitchChoiceTextActive: { color: '#000', fontWeight: '900' },

  skipCalibrationBtn: { marginLeft: 12, backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 30 },
  skipCalibrationText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  tracerHeaderBar: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tracerBadge: { backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ff1744', flexDirection: 'row', alignItems: 'center' },
  tracerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff1744', marginRight: 8 },
  tracerTitle: { color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
  tracerCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.85)', borderWidth: 1, borderColor: '#ff1744', justifyContent: 'center', alignItems: 'center' },
  tracerBottomBar: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', gap: 12 },
  tracerReplayBtn: { backgroundColor: 'rgba(0,0,0,0.85)', borderWidth: 1.5, borderColor: '#ff1744', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25 },
  tracerReplayText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  tracerNextBallBtn: { backgroundColor: '#00e676', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25 },
  tracerNextBallText: { color: '#000', fontWeight: '900', fontSize: 13 },

  settingsIconBtn: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#555' },
  settingsIconText: { color: '#00e676', fontWeight: 'bold', fontSize: 12, marginLeft: 5 },

  minimizedStatsPill: { position: 'absolute', top: 120, right: 15, backgroundColor: 'rgba(0,0,0,0.85)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#00e676' },
  minimizedStatsText: { color: '#00e676', fontWeight: '900', fontSize: 12 },

  stopRecordingBtn: { flexDirection: 'row', backgroundColor: '#ff1744', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 30, alignItems: 'center', elevation: 10 },
  stopRecordingBtnText: { color: '#fff', fontWeight: '900', fontSize: 15, marginLeft: 8 },
  idleActionContainer: { alignItems: 'center' },
  recordBtnAutonomous: { borderColor: '#00e676', backgroundColor: 'rgba(0,0,0,0.85)' },
  autonomousHintText: { color: '#aaa', fontSize: 11, marginTop: 6, fontWeight: '600' },

  skipScoringBtn: { marginTop: 12, paddingVertical: 10, backgroundColor: '#333', borderRadius: 10, alignItems: 'center' },
  skipScoringText: { color: '#aaa', fontWeight: 'bold', fontSize: 12 }
});
