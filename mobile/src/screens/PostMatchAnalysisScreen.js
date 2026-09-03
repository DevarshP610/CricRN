import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Home, Activity, Target, Zap, Video, Crosshair } from 'lucide-react-native';
import Svg, { Rect, Circle, Line, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function PostMatchAnalysisScreen({ navigation, route }) {
  // Mock Data from Python Backend Aggregation
  const overallStats = {
    avgSpeed: 132.5,
    maxSpeed: 141.2,
    avgSwing: 2.1,
    goodLengthPct: 65,
    corridorPct: 45,
    noBalls: 1,
    wickets: 3
  };

  const wicketHighlights = [
    { id: 1, type: 'Bowled', speed: 141.2, swing: 3.2, description: 'Late Inswing, hit top of Off' },
    { id: 2, type: 'LBW', speed: 138.5, swing: 1.1, description: 'Pitched middle, straightened' },
    { id: 3, type: 'Caught Behind', speed: 139.9, swing: -2.4, description: 'Outswing in the corridor' },
  ];

  // Pitch Map data (x, y coordinates normalized to 0-100)
  // x: 0 = wide off, 50 = middle stump, 100 = wide leg
  // y: 0 = stumps, 30 = yorker, 50 = full, 70 = good, 90 = short
  const pitchMapData = [
    { x: 50, y: 70, type: 'dot' },
    { x: 45, y: 65, type: 'dot' },
    { x: 30, y: 72, type: 'wicket' }, // Caught behind
    { x: 55, y: 35, type: 'wicket' }, // LBW
    { x: 50, y: 20, type: 'wicket' }, // Bowled
    { x: 20, y: 85, type: 'run' },
    { x: 80, y: 70, type: 'run' },
    { x: 48, y: 68, type: 'dot' },
    { x: 52, y: 71, type: 'dot' },
    { x: 40, y: 50, type: 'run' },
  ];

  // Beehive data (x, y coordinates mapping where ball passes the stumps)
  const beehiveData = [
    { x: 50, y: 80, type: 'wicket' }, // Bowled (Top of off)
    { x: 45, y: 40, type: 'wicket' }, // LBW (Knee roll)
    { x: 30, y: 60, type: 'wicket' }, // Caught behind (Outside off, waist height)
    { x: 48, y: 75, type: 'dot' },
    { x: 52, y: 85, type: 'dot' },
    { x: 20, y: 90, type: 'dot' }, // Play and miss wide
    { x: 70, y: 40, type: 'run' }, // Leg glance
    { x: 45, y: 20, type: 'run' },
  ];

  const renderPitchMap = () => (
    <View style={styles.pitchMapContainer}>
      <Svg height="300" width="100%" viewBox="0 0 100 100">
        {/* Pitch Background */}
        <Rect x="20" y="0" width="60" height="100" fill="#d2b48c" />
        {/* Crease lines */}
        <Line x1="20" y1="10" x2="80" y2="10" stroke="#fff" strokeWidth="1" />
        <Line x1="20" y1="25" x2="80" y2="25" stroke="#fff" strokeWidth="1" />
        {/* Stumps */}
        <Rect x="46" y="5" width="2" height="5" fill="#fff" />
        <Rect x="49" y="5" width="2" height="5" fill="#fff" />
        <Rect x="52" y="5" width="2" height="5" fill="#fff" />

        {/* Zones */}
        <Rect x="20" y="60" width="60" height="20" fill="rgba(0,230,118,0.2)" /> {/* Good Length */}
        
        {/* Deliveries */}
        {pitchMapData.map((ball, index) => (
          <Circle 
            key={index} 
            cx={ball.x} 
            cy={ball.y} 
            r="3" 
            fill={ball.type === 'wicket' ? '#ff1744' : ball.type === 'dot' ? '#00e676' : '#2979ff'} 
            stroke="#fff" 
            strokeWidth="0.5" 
          />
        ))}
      </Svg>
    </View>
  );

  const renderBeehive = () => (
    <View style={styles.beehiveContainer}>
      <Svg height="200" width="100%" viewBox="0 0 100 100">
        {/* Stumps (Front View) */}
        <Rect x="42" y="30" width="4" height="70" fill="#fff" />
        <Rect x="48" y="30" width="4" height="70" fill="#fff" />
        <Rect x="54" y="30" width="4" height="70" fill="#fff" />
        {/* Bails */}
        <Rect x="42" y="28" width="6" height="2" fill="#fff" />
        <Rect x="48" y="28" width="6" height="2" fill="#fff" />

        {/* Deliveries */}
        {beehiveData.map((ball, index) => (
          <Circle 
            key={index} 
            cx={ball.x} 
            cy={ball.y} 
            r="3" 
            fill={ball.type === 'wicket' ? '#ff1744' : ball.type === 'dot' ? '#00e676' : '#2979ff'} 
            stroke="#fff" 
            strokeWidth="0.5" 
          />
        ))}
      </Svg>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>POST-MATCH ANALYSIS</Text>
        <Text style={styles.headerSubtitle}>AI Aggregated Coaching Report</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 50 }}>
        
        {/* TOP LEVEL KPIs */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Zap color="#ffea00" size={24} />
            <Text style={styles.kpiValue}>{overallStats.maxSpeed} km/h</Text>
            <Text style={styles.kpiLabel}>Top Speed</Text>
          </View>
          <View style={styles.kpiCard}>
            <Target color="#00e676" size={24} />
            <Text style={styles.kpiValue}>{overallStats.goodLengthPct}%</Text>
            <Text style={styles.kpiLabel}>Good Length</Text>
          </View>
          <View style={styles.kpiCard}>
            <Crosshair color="#ff1744" size={24} />
            <Text style={styles.kpiValue}>{overallStats.corridorPct}%</Text>
            <Text style={styles.kpiLabel}>Corridor of Uncert.</Text>
          </View>
        </View>

        {/* WICKET HIGHLIGHTS */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>WICKET DELIVERIES</Text>
            <Video color="#888" size={20} />
          </View>
          {wicketHighlights.map(w => (
            <TouchableOpacity key={w.id} style={styles.wicketCard}>
              <View style={styles.wicketIconBox}>
                <Text style={styles.wicketIconText}>W</Text>
              </View>
              <View style={styles.wicketInfo}>
                <Text style={styles.wicketType}>{w.type} ({w.speed} km/h)</Text>
                <Text style={styles.wicketDesc}>{w.description}</Text>
              </View>
              <View style={styles.playBtn}>
                <PlayIcon />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* PITCH MAP */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PITCH MAP</Text>
          <Text style={styles.sectionDesc}>Green zone indicates Good Length area.</Text>
          {renderPitchMap()}
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: '#ff1744'}]}/><Text style={styles.legendText}>Wickets</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: '#00e676'}]}/><Text style={styles.legendText}>Dots</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: '#2979ff'}]}/><Text style={styles.legendText}>Runs</Text></View>
          </View>
        </View>

        {/* BEEHIVE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BEEHIVE (IMPACT POINTS)</Text>
          <Text style={styles.sectionDesc}>Where the ball passed the batsman.</Text>
          {renderBeehive()}
        </View>

        {/* AI COACHING INSIGHTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI COACHING INSIGHTS</Text>
          <View style={styles.insightBox}>
            <Text style={styles.insightText}>
              • You bowled 65% of your deliveries on a Good Length, an elite level of consistency.{'\n'}
              • Your inswing is highly effective, yielding 2 wickets when generating over 2.5° of movement.{'\n'}
              • Suggestion: You tend to bowl shorter when your speed drops below 135 km/h. Focus on front-arm follow-through when tired.
            </Text>
          </View>
        </View>

      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
          <Home color="#000" size={24} />
          <Text style={styles.homeBtnText}>BACK TO HOME</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const PlayIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="#00e676">
    <Path d="M8 5v14l11-7z" />
  </Svg>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#333', alignItems: 'center' },
  headerTitle: { color: '#00e676', fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  headerSubtitle: { color: '#888', fontSize: 14, marginTop: 5 },
  
  content: { flex: 1, padding: 20 },
  
  kpiGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  kpiCard: { width: '31%', backgroundColor: '#1e1e1e', padding: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  kpiValue: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  kpiLabel: { color: '#888', fontSize: 12, marginTop: 5, textAlign: 'center' },

  section: { marginBottom: 30 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  sectionDesc: { color: '#888', fontSize: 12, marginBottom: 15 },
  
  wicketCard: { flexDirection: 'row', backgroundColor: '#1e1e1e', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  wicketIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 23, 68, 0.2)', justifyContent: 'center', alignItems: 'center' },
  wicketIconText: { color: '#ff1744', fontWeight: 'bold', fontSize: 18 },
  wicketInfo: { flex: 1, marginLeft: 15 },
  wicketType: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  wicketDesc: { color: '#aaa', fontSize: 12, marginTop: 4 },
  playBtn: { padding: 10 },

  pitchMapContainer: { backgroundColor: '#1a2e1a', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#00e676' },
  beehiveContainer: { backgroundColor: '#111', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#333' },
  
  legend: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15, backgroundColor: '#1e1e1e', padding: 10, borderRadius: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { color: '#fff', fontSize: 12 },

  insightBox: { backgroundColor: '#1a1a2e', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#2979ff' },
  insightText: { color: '#cbd5e1', fontSize: 14, lineHeight: 24 },

  bottomBar: { padding: 20, borderTopWidth: 1, borderTopColor: '#333' },
  homeBtn: { backgroundColor: '#00e676', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18, borderRadius: 30 },
  homeBtnText: { color: '#000', fontWeight: '900', fontSize: 16, marginLeft: 10 }
});
