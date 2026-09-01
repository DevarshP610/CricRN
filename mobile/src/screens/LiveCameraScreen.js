import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, ScrollView, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Check, Target, Save, LogOut } from 'lucide-react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function LiveCameraScreen({ route, navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  
  // Params
  const sessionType = route?.params?.sessionType || 'MATCH'; 
  const matchDetails = route?.params?.matchDetails || {
    teamA: 'Team A', teamB: 'Team B', format: 'T20', striker: 'Striker', nonStriker: 'Non-Striker', roster: ['Striker', 'Non-Striker']
  };

  const [mode, setMode] = useState('CALIBRATE_STRIKER'); // CALIBRATE_STRIKER | CALIBRATE_NON_STRIKER | LIVE
  
  // Roster Management
  const [activeStriker, setActiveStriker] = useState(1); // 1 = Striker, 2 = Non-Striker
  const [strikerName, setStrikerName] = useState(matchDetails.striker);
  const [nonStrikerName, setNonStrikerName] = useState(matchDetails.nonStriker);
  const [yetToBat, setYetToBat] = useState(matchDetails.roster?.filter(p => p !== matchDetails.striker && p !== matchDetails.nonStriker) || []);
  
  // Calibration
  const [strikerStumps, setStrikerStumps] = useState([]);
  const [nonStrikerStumps, setNonStrikerStumps] = useState([]);
  
  // Match Engine
  const [score, setScore] = useState({ runs: 0, wickets: 0, balls: 0, extras: 0 });
  const [engineState, setEngineState] = useState('IDLE'); // IDLE | RECORDING_CLIP | SCORING | SELECT_BATSMAN
  const [showWicketOptions, setShowWicketOptions] = useState(false);
  const [showTrail, setShowTrail] = useState(false);

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.text}>App requires Camera access.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleTap = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    if (mode === 'CALIBRATE_STRIKER' && strikerStumps.length < 3) {
      setStrikerStumps([...strikerStumps, { x: locationX, y: locationY }]);
    } else if (mode === 'CALIBRATE_NON_STRIKER' && nonStrikerStumps.length < 3) {
      setNonStrikerStumps([...nonStrikerStumps, { x: locationX, y: locationY }]);
    }
  };

  const triggerBallDetected = () => {
    if (engineState !== 'IDLE') return;
    setEngineState('RECORDING_CLIP');
    setShowTrail(false);
    
    setTimeout(() => {
      if (sessionType === 'PRACTICE') {
        setShowTrail(true);
        Alert.alert('Clip Saved', 'Practice clip stored.');
        setTimeout(() => {
          setShowTrail(false);
          setEngineState('IDLE');
        }, 2000);
      } else {
        setEngineState('SCORING');
        setShowWicketOptions(false);
        setShowTrail(true);
      }
    }, 4000);
  };

  const handleScore = (runs, type = 'RUNS') => {
    let newScore = { ...score };
    let isWicket = false;
    
    if (type === 'WICKET') {
      newScore.wickets += 1;
      newScore.balls += 1;
      isWicket = true;
    } else if (type === 'EXTRA') {
      newScore.runs += runs;
      newScore.extras += runs;
    } else {
      newScore.runs += runs;
      newScore.balls += 1;
    }
    
    if (type !== 'EXTRA' && type !== 'WICKET' && runs % 2 !== 0) {
      setActiveStriker(activeStriker === 1 ? 2 : 1);
    }
    if (newScore.balls > 0 && newScore.balls % 6 === 0) {
      setActiveStriker(activeStriker === 1 ? 2 : 1);
    }
    
    setScore(newScore);
    
    if (isWicket) {
      if (yetToBat.length > 0) {
        setEngineState('SELECT_BATSMAN');
      } else {
        Alert.alert('All Out!', 'The innings has concluded.');
        setEngineState('IDLE');
      }
    } else {
      setEngineState('IDLE');
    }
  };

  const selectNewBatsman = (player) => {
    if (activeStriker === 1) {
      setStrikerName(player);
    } else {
      setNonStrikerName(player);
    }
    setYetToBat(yetToBat.filter(p => p !== player));
    setEngineState('IDLE');
  };

  const renderBallTrail = () => {
    if (!showTrail || strikerStumps.length === 0 || nonStrikerStumps.length === 0) return null;
    const target = strikerStumps[1] || { x: width/2, y: height/3 }; 
    const start = nonStrikerStumps[1] || { x: width/2, y: height - 150 };
    const pitchX = start.x + (target.x - start.x) * 0.7;
    const pitchY = start.y + (target.y - start.y) * 0.7; 
    const path = `M ${start.x} ${start.y - 50} Q ${pitchX} ${pitchY - 40} ${pitchX} ${pitchY} Q ${target.x} ${target.y + 20} ${target.x} ${target.y}`;
    
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="trail" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="rgba(255, 0, 0, 0.2)" />
              <Stop offset="1" stopColor="rgba(255, 0, 0, 0.9)" />
            </LinearGradient>
          </Defs>
          <Path d={path} fill="none" stroke="url(#trail)" strokeWidth="4" strokeDasharray="8, 4" />
          <Circle cx={target.x} cy={target.y} r="6" fill="#ff1744" />
          <Circle cx={pitchX} cy={pitchY} r="5" fill="#ffea00" />
        </Svg>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraView style={StyleSheet.absoluteFillObject} facing="back" ref={cameraRef}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject} onPress={handleTap}>

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
              <TouchableOpacity onPress={() => mode === 'CALIBRATE_STRIKER' ? setStrikerStumps([]) : setNonStrikerStumps([])} style={{marginTop: 20}}>
                <Text style={{color: '#ff1744', fontWeight: 'bold'}}>RESET MARKERS</Text>
              </TouchableOpacity>
            </View>
          )}

          {strikerStumps.map((coord, index) => <View key={`s-${index}`} style={[styles.marker, styles.strikerMarker, { left: coord.x - 6, top: coord.y - 6 }]} />)}
          {nonStrikerStumps.map((coord, index) => <View key={`ns-${index}`} style={[styles.marker, styles.nonStrikerMarker, { left: coord.x - 8, top: coord.y - 8 }]} />)}

          {/* LIVE MATCH/PRACTICE MODE */}
          {mode === 'LIVE' && (
            <>
              {/* ADVANCED SCOREBOARD (Only in MATCH mode) */}
              {sessionType === 'MATCH' && (
                <View style={styles.scoreboardContainer}>
                  <View style={styles.teamsRow}>
                    <Text style={styles.teamName}>{matchDetails.teamA}</Text>
                    <View style={styles.formatBadge}><Text style={styles.formatText}>{matchDetails.format}</Text></View>
                  </View>
                  <View style={styles.scoreTopRow}>
                    <Text style={styles.mainScore}>{score.runs}-{score.wickets}</Text>
                    <Text style={styles.overs}>({Math.floor(score.balls / 6)}.{score.balls % 6})</Text>
                  </View>
                  <View style={styles.batsmenRow}>
                    <Text style={[styles.batsmanText, activeStriker === 1 && styles.activeBatsman]}>{strikerName} {activeStriker === 1 && '*'}</Text>
                    <Text style={[styles.batsmanText, activeStriker === 2 && styles.activeBatsman]}>{nonStrikerName} {activeStriker === 2 && '*'}</Text>
                  </View>
                </View>
              )}

              {/* End Session Button */}
              <TouchableOpacity style={styles.endSessionBtn} onPress={() => navigation.navigate('Home')}>
                <LogOut color="#fff" size={20} />
              </TouchableOpacity>

              {engineState === 'RECORDING_CLIP' && (
                <View style={styles.recordingOverlay}>
                  <View style={styles.redDot} />
                  <Text style={styles.recordingText}>RECORDING CLIP...</Text>
                </View>
              )}

              {engineState === 'IDLE' && (
                <TouchableOpacity style={styles.triggerBtn} onPress={triggerBallDetected}>
                  <Target color="#00e676" size={24} />
                  <Text style={styles.triggerText}>SIMULATE BALL DETECTED</Text>
                </TouchableOpacity>
              )}

              {renderBallTrail()}

              {/* NEW BATSMAN SELECTION POPUP */}
              {engineState === 'SELECT_BATSMAN' && (
                <View style={styles.scoringPopup}>
                  <Text style={styles.popupTitle}>Wicket! Select Next Batsman</Text>
                  <ScrollView style={{maxHeight: 200, marginTop: 15}}>
                    {yetToBat.map(player => (
                      <TouchableOpacity key={player} style={styles.playerSelectRow} onPress={() => selectNewBatsman(player)}>
                        <Text style={styles.playerSelectText}>{player}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* ADVANCED SCORING POPUP */}
              {engineState === 'SCORING' && (
                <View style={styles.scoringPopup}>
                  <View style={styles.popupHeader}>
                    <Text style={styles.popupTitle}>{showWicketOptions ? 'Select Wicket Type' : 'Score Delivery'}</Text>
                    <TouchableOpacity style={styles.saveBtn} onPress={() => Alert.alert('Saved', 'Clip automatically saved.')}><Save color="#00e676" size={20}/></TouchableOpacity>
                  </View>
                  
                  {!showWicketOptions ? (
                    <>
                      <View style={styles.scoreGrid}>
                        {[0, 1, 2, 3, 4, 6].map(runs => (
                          <TouchableOpacity key={runs} style={styles.scoreBox} onPress={() => handleScore(runs)}>
                            <Text style={styles.scoreBoxText}>{runs}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={styles.extrasGrid}>
                        <TouchableOpacity style={[styles.scoreBox, styles.wicketBox]} onPress={() => setShowWicketOptions(true)}>
                          <Text style={[styles.scoreBoxText, {color: '#ff1744'}]}>WICKET</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.scoreBox, styles.extraBox]} onPress={() => handleScore(1, 'EXTRA')}>
                          <Text style={[styles.scoreBoxText, {color: '#ffea00'}]}>WD/NB</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <View style={styles.scoreGrid}>
                      {['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket', 'Retired Hurt'].map(type => (
                        <TouchableOpacity key={type} style={[styles.scoreBox, {width: '48%', borderColor: '#ff1744'}]} onPress={() => handleScore(0, 'WICKET')}>
                          <Text style={[styles.scoreBoxText, {fontSize: 16, color: '#ff1744'}]}>{type}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity style={[styles.scoreBox, {width: '48%'}]} onPress={() => setShowWicketOptions(false)}>
                        <Text style={[styles.scoreBoxText, {fontSize: 16, color: '#888'}]}>Back</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </>
          )}

        </TouchableOpacity>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 16 },
  btn: { backgroundColor: '#00e676', padding: 15, borderRadius: 25, marginTop: 20 },
  btnText: { color: '#000', fontWeight: 'bold' },
  
  calibrationOverlay: { position: 'absolute', bottom: 60, width: '100%', alignItems: 'center' },
  instructionText: { color: '#fff', fontSize: 18, marginBottom: 25, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 10 },
  confirmBtn: { flexDirection: 'row', backgroundColor: '#00e676', paddingVertical: 18, paddingHorizontal: 35, borderRadius: 35, alignItems: 'center' },
  confirmBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  
  marker: { position: 'absolute', borderRadius: 10, borderWidth: 2, borderColor: '#fff' },
  strikerMarker: { width: 12, height: 12, backgroundColor: '#00e676' },
  nonStrikerMarker: { width: 16, height: 16, backgroundColor: '#ffea00' },

  scoreboardContainer: { position: 'absolute', top: 40, alignSelf: 'center', backgroundColor: 'rgba(15,15,15,0.85)', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 20, borderWidth: 1, borderColor: '#333', width: '85%' },
  teamsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 10 },
  teamName: { color: '#00e676', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase' },
  formatBadge: { backgroundColor: '#222', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  formatText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  scoreTopRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 5, justifyContent: 'center' },
  mainScore: { color: '#fff', fontSize: 36, fontWeight: '900', marginRight: 10 },
  overs: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  batsmenRow: { flexDirection: 'row', justifyContent: 'space-between' },
  batsmanText: { color: '#888', fontSize: 14, fontWeight: '600' },
  activeBatsman: { color: '#fff' },
  
  endSessionBtn: { position: 'absolute', top: 45, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20 },

  recordingOverlay: { position: 'absolute', top: 160, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  redDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff1744', marginRight: 10 },
  recordingText: { color: '#ff1744', fontWeight: 'bold', letterSpacing: 2 },

  triggerBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', backgroundColor: 'rgba(0, 230, 118, 0.2)', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, borderWidth: 1, borderColor: '#00e676', alignItems: 'center' },
  triggerText: { color: '#00e676', fontWeight: 'bold', marginLeft: 10, letterSpacing: 1 },

  scoringPopup: { position: 'absolute', bottom: 20, left: 10, right: 10, backgroundColor: '#111', padding: 20, borderRadius: 25, borderWidth: 1, borderColor: '#333' },
  popupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10 },
  popupTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 230, 118, 0.1)', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#00e676' },
  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  scoreBox: { width: '31%', backgroundColor: '#1e1e1e', paddingVertical: 20, borderRadius: 15, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  scoreBoxText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  extrasGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  wicketBox: { width: '48%', backgroundColor: 'rgba(255, 23, 68, 0.1)', borderColor: '#ff1744' },
  extraBox: { width: '48%', backgroundColor: 'rgba(255, 234, 0, 0.1)', borderColor: '#ffea00' },

  playerSelectRow: { backgroundColor: '#1e1e1e', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  playerSelectText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
