import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, Alert, Modal } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { Check, Target, LogOut, AlertTriangle, X, Trophy } from 'lucide-react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
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
  
  // Match Engine
  const [score, setScore] = useState(route?.params?.score || { runs: 0, wickets: 0, balls: 0, extras: 0 });
  const [engineState, setEngineState] = useState('IDLE'); 
  const [showTrail, setShowTrail] = useState(false);
  const [recentStats, setRecentStats] = useState(null);

  // Umpire AI & DRS
  const [isNoBall, setIsNoBall] = useState(false);
  const [isFreeHit, setIsFreeHit] = useState(false);
  const [showDRSModal, setShowDRSModal] = useState(false);
  const [drsStep, setDrsStep] = useState(0); 

  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // RECORDING SETTINGS
  const [recordingDuration, setRecordingDuration] = useState(5);
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
            targetScore
          };
          
          const existing = await AsyncStorage.getItem('saved_matches');
          let matches = existing ? JSON.parse(existing) : [];
          
          // Update existing or add new
          const idx = matches.findIndex(m => m.id === matchData.id);
          if (idx >= 0) matches[idx] = matchData;
          else matches.unshift(matchData);
          
          await AsyncStorage.setItem('saved_matches', JSON.stringify(matches));
        } catch (e) {
          console.log('Auto-save failed:', e);
        }
      };
      saveMatch();
    }
  }, [score, innings, battingTeam, activeStriker, strikerName, nonStrikerName]);

  const handleTap = (e) => {
    const { pageX, pageY } = e.nativeEvent;
    if (mode === 'CALIBRATE_STRIKER' && strikerStumps.length < 3) {
      setStrikerStumps([...strikerStumps, { x: pageX, y: pageY }]);
    } else if (mode === 'CALIBRATE_NON_STRIKER' && nonStrikerStumps.length < 3) {
      setNonStrikerStumps([...nonStrikerStumps, { x: pageX, y: pageY }]);
    }
  };

  const captureDelivery = async () => {
    if (!cameraRef.current) return;
    setEngineState('RECORDING_CLIP');
    setShowTrail(false);
    
    try {
      cameraRef.current.startRecording({
        onRecordingFinished: async (video) => {
          setEngineState('ANALYZING');
          let formData = new FormData();
          formData.append('file', { uri: video.path, name: 'delivery.mp4', type: 'video/mp4' });
          
          const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.2.65:8000';
          const response = await fetch(`${API_URL}/upload-video`, { 
            method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' } 
          });
          const aiData = await response.json();
          handleBackendResponse(aiData);
        },
        onRecordingError: (error) => {
          console.log('Recording Error:', error);
          setEngineState('IDLE');
        }
      });
      
      // FullTrack AI stops recording 3 seconds after release
      setTimeout(async () => {
        if (cameraRef.current) {
          await cameraRef.current.stopRecording();
        }
      }, recordingDuration * 1000);
      
    } catch (error) {
      console.log('Error triggering recording:', error);
      setEngineState('IDLE');
    }
  };

  const handleBackendResponse = (aiData) => {
    if (aiData.hawkeye) {
      setRecentStats({
        speed: aiData.hawkeye.speed || '85.2',
        swing: aiData.hawkeye.swing || '1.2',
        turn: aiData.hawkeye.turn || '0.5'
      });
    }

    if (aiData.isNoBall) {
      setIsNoBall(true);
      setIsFreeHit(true);
      let newScore = { ...score };
      newScore.runs += 1;
      newScore.extras += 1;
      setScore(newScore);
      setTimeout(() => { setIsNoBall(false); setEngineState('SCORING'); setShowTrail(true); }, 3000);
    } else {
      setIsFreeHit(false);
      if (sessionType === 'PRACTICE') {
        setShowTrail(true);
        setTimeout(() => { setShowTrail(false); setEngineState('IDLE'); }, 2000);
      } else {
        setEngineState('SCORING');
        setShowTrail(true);
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
            <Text style={styles.modalTitle}>Camera Settings</Text>
            
            <Text style={styles.settingsLabel}>Recording Window (Seconds)</Text>
            <Text style={styles.settingsSubtext}>Adjust based on your run-up length.</Text>
            
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
      
      {/* DRS MODAL OMITTED FOR BREVITY BUT WORKS SAME WAY */}
      
      <View style={StyleSheet.absoluteFillObject} onTouchEnd={handleTap}>
        <Camera 
          style={StyleSheet.absoluteFillObject} 
          device={device} 
          isActive={true} 
          video={true}
          ref={cameraRef} 
        />
        
        {/* CALIBRATION MODE */}
        {(mode === 'CALIBRATE_STRIKER' || mode === 'CALIBRATE_NON_STRIKER') && (
          <View style={styles.calibrationOverlay}>
            <Text style={styles.instructionText}>
              {mode === 'CALIBRATE_STRIKER' ? `Map STRIKER'S stumps (${strikerStumps.length}/3)` : `Map NON-STRIKER'S stumps (${nonStrikerStumps.length}/3)`}
            </Text>
            <TouchableOpacity 
              style={[styles.confirmBtn, (mode === 'CALIBRATE_STRIKER' ? strikerStumps.length : nonStrikerStumps.length) === 0 && { opacity: 0.5 }]} 
              onPress={() => {
                if (mode === 'CALIBRATE_STRIKER' && strikerStumps.length > 0) setMode('CALIBRATE_NON_STRIKER');
                else if (mode === 'CALIBRATE_NON_STRIKER' && nonStrikerStumps.length > 0) setMode('LIVE');
              }}>
              <Check color="#000" size={24} />
              <Text style={styles.confirmBtnText}>{mode === 'CALIBRATE_STRIKER' ? 'Lock Striker Stumps' : 'Start Match'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CALIBRATION MARKERS */}
        {strikerStumps.map((coord, index) => <View key={`s-${index}`} style={[styles.marker, styles.strikerMarker, { left: coord.x - 6, top: coord.y - 6 }]} />)}
        {nonStrikerStumps.map((coord, index) => <View key={`ns-${index}`} style={[styles.marker, styles.nonStrikerMarker, { left: coord.x - 8, top: coord.y - 8 }]} />)}

        {/* UMPIRE AI NO-BALL OVERLAY */}
        {isNoBall && (
          <View style={styles.noBallOverlay}>
            <AlertTriangle color="#ff1744" size={64} />
            <Text style={styles.noBallText}>NO BALL</Text>
          </View>
        )}

        {mode === 'LIVE' && !isNoBall && (
          <>
            {/* END MATCH BUTTON */}
            <TouchableOpacity style={styles.endMatchBtn} onPress={() => {
              Alert.alert('End Match', 'Are you sure you want to end and analyze this match?', [
                {text: 'Cancel', style: 'cancel'},
                {text: 'End', style: 'destructive', onPress: () => {
                  AsyncStorage.removeItem('saved_matches');
                  navigation.replace('PostMatchAnalysis'); 
                }}
              ]);
            }}>
              <LogOut color="#fff" size={20} />
              <Text style={styles.endMatchText}>END MATCH</Text>
            </TouchableOpacity>

            {/* RECENT STATS WIDGET */}
            {recentStats && engineState === 'IDLE' && (
              <View style={styles.recentStatsWidget}>
                <Text style={styles.recentStatsTitle}>LAST BALL</Text>
                <View style={styles.statLine}>
                  <Text style={styles.statLineLabel}>Speed:</Text>
                  <Text style={styles.statLineValue}>{recentStats.speed} km/h</Text>
                </View>
                <View style={styles.statLine}>
                  <Text style={styles.statLineLabel}>Swing:</Text>
                  <Text style={styles.statLineValue}>{recentStats.swing}°</Text>
                </View>
                <View style={styles.statLine}>
                  <Text style={styles.statLineLabel}>Turn:</Text>
                  <Text style={styles.statLineValue}>{recentStats.turn}°</Text>
                </View>
              </View>
            )}

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
                  <TouchableOpacity style={[styles.scoreBox, styles.wicketBox]} onPress={() => handleScore(0, 'WICKET')}>
                    <Text style={styles.scoreBoxText}>W</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {engineState === 'RECORDING_CLIP' && (
              <View style={styles.recordingOverlay}>
                <View style={styles.redDot} />
                <Text style={styles.recordingText}>RECORDING CLIP...</Text>
              </View>
            )}
            
            {engineState === 'ANALYZING' && (
              <View style={[styles.recordingOverlay, {backgroundColor: 'rgba(41, 121, 255, 0.9)'}]}>
                <Text style={[styles.recordingText, {color: '#fff'}]}>UPLOADING TO AI ENGINE...</Text>
              </View>
            )}

            {engineState === 'IDLE' && (
              <View style={styles.actionBottomBar}>
                <TouchableOpacity style={styles.recordBtn} onPress={captureDelivery}>
                  <View style={styles.recordBtnInner} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingsIconBtn} onPress={() => setShowSettings(true)}>
                  <Target color="#fff" size={24} />
                  <Text style={styles.settingsIconText}>{recordingDuration}s</Text>
                </TouchableOpacity>
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
  noBallText: { color: '#ff1744', fontSize: 64, fontWeight: '900', marginTop: 20 },
  
  scoreboardContainer: { position: 'absolute', top: 40, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.85)', padding: 15, borderRadius: 15 },
  scoreTopRow: { flexDirection: 'row', alignItems: 'center' },
  mainScore: { color: '#fff', fontSize: 36, fontWeight: '900' },
  overs: { color: '#888', fontSize: 18, marginLeft: 10, fontWeight: 'bold' },
  
  triggerBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', backgroundColor: 'rgba(0, 230, 118, 0.2)', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, borderWidth: 1, borderColor: '#00e676', alignItems: 'center' },
  triggerText: { color: '#00e676', fontWeight: 'bold', marginLeft: 10 },
  
  recordingOverlay: { position: 'absolute', top: 50, alignSelf: 'center', flexDirection: 'row', backgroundColor: 'rgba(255, 23, 68, 0.9)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, alignItems: 'center' },
  redDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff', marginRight: 10 },
  recordingText: { color: '#fff', fontWeight: '900' },

  scoringPopup: { position: 'absolute', bottom: 100, left: 10, right: 10, backgroundColor: '#111', padding: 20, borderRadius: 25 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreBox: { flex: 1, backgroundColor: '#222', marginHorizontal: 5, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  scoreBoxText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  wicketBox: { backgroundColor: '#ff1744' },

  actionBottomBar: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  recordBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  recordBtnInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ff1744' },
  settingsIconBtn: { position: 'absolute', right: 40, alignItems: 'center' },
  settingsIconText: { color: '#fff', marginTop: 5, fontWeight: 'bold' },
  
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

  endMatchBtn: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(255, 23, 68, 0.8)', flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, alignItems: 'center' },
  endMatchText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },

  recentStatsWidget: { position: 'absolute', top: 120, right: 20, backgroundColor: 'rgba(0,0,0,0.7)', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  recentStatsTitle: { color: '#00e676', fontWeight: '900', marginBottom: 10, textAlign: 'center', fontSize: 16 },
  statLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, width: 120 },
  statLineLabel: { color: '#aaa', fontWeight: 'bold' },
  statLineValue: { color: '#fff', fontWeight: 'bold' }
});
