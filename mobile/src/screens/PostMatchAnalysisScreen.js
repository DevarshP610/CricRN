import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Alert } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect, Line, G, Text as SvgText } from 'react-native-svg';
import { ChevronLeft, Share2, Activity, Target, Zap } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function PostMatchAnalysisScreen({ route, navigation }) {
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  
  const matchDetails = route?.params?.matchDetails || { teamA: 'Unknown', teamB: 'Unknown' };
  const score = route?.params?.score || { runs: 0, wickets: 0, balls: 0 };
  const history = route?.params?.matchHistory || [];

  const handlePostToBackend = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem('cricrn_custom_server_url');
      const API_URL = savedUrl || process.env.EXPO_PUBLIC_API_URL || 'https://salary-ferment-virtual.ngrok-free.dev';
      const matchResp = await fetch(`${API_URL}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({
          team_a: matchDetails.teamA, team_b: matchDetails.teamB,
          format: matchDetails.format || 'T20', overs: matchDetails.overs || 20,
          summary: score
        })
      });
      const matchData = await matchResp.json();
      
      for (const ball of history) {
        await fetch(`${API_URL}/api/matches/${matchData.id}/balls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ball)
        });
      }
      Alert.alert("Success", "Match saved to backend database!");
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Could not save to database.");
    }
  };

  const renderOverview = () => (
    <View>
      <BlurView intensity={40} tint="dark" style={styles.card}>
        <Text style={styles.cardTitle}>MATCH SUMMARY</Text>
        <Text style={styles.scoreText}>{score.runs}-{score.wickets}</Text>
        <Text style={styles.oversText}>Overs: {Math.floor(score.balls/6)}.{score.balls%6}</Text>
      </BlurView>
      
      <BlurView intensity={40} tint="dark" style={styles.card}>
        <Text style={styles.cardTitle}>TOP SPEEDS</Text>
        {history.slice().sort((a,b)=>b.speed-a.speed).slice(0,3).map((ball, i) => (
          <View key={i} style={styles.statRow}>
            <Text style={{color:'#fff'}}>Ball {i+1}</Text>
            <Text style={{color:'#00e676', fontWeight:'bold'}}>{ball.speed} km/h</Text>
          </View>
        ))}
        {history.length === 0 && <Text style={{color:'#666'}}>No deliveries recorded.</Text>}
      </BlurView>

      <TouchableOpacity style={styles.saveBtn} onPress={handlePostToBackend}>
        <Text style={styles.saveBtnText}>SAVE TO CLOUD DATABASE</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBatting = () => {
    // Generate Wagon Wheel from runs
    const angles = history.map((b, i) => (i * 45) % 360); // Mock angles for real balls
    return (
      <View>
        <BlurView intensity={40} tint="dark" style={styles.card}>
          <Text style={styles.cardTitle}>WAGON WHEEL</Text>
          <View style={{alignItems:'center', marginVertical: 20}}>
            <Svg width="200" height="200" viewBox="0 0 200 200">
              <Circle cx="100" cy="100" r="90" stroke="#333" strokeWidth="2" fill="none" />
              <Circle cx="100" cy="100" r="30" stroke="#333" strokeWidth="1" fill="none" />
              <Rect x="90" y="80" width="20" height="40" fill="#fff" opacity="0.2" />
              {history.map((ball, i) => {
                if(ball.runs > 0) {
                  const angle = (i * 73) * (Math.PI / 180);
                  const dist = ball.runs > 4 ? 90 : (ball.runs * 15);
                  const x = 100 + Math.cos(angle) * dist;
                  const y = 100 + Math.sin(angle) * dist;
                  return (
                    <G key={i}>
                      <Line x1="100" y1="100" x2={x} y2={y} stroke={ball.runs >= 4 ? '#00e676' : '#fff'} strokeWidth={ball.runs >= 4 ? "3" : "1"} opacity="0.7" />
                      <Circle cx={x} cy={y} r="3" fill={ball.runs >= 4 ? '#00e676' : '#fff'} />
                    </G>
                  );
                }
                return null;
              })}
            </Svg>
          </View>
        </BlurView>
        
        <BlurView intensity={40} tint="dark" style={styles.card}>
          <Text style={styles.cardTitle}>BATSMAN STATS</Text>
          <View style={styles.statHeader}>
            <Text style={{color:'#888', flex: 2}}>BATSMAN</Text>
            <Text style={{color:'#888', flex: 1, textAlign: 'center'}}>R</Text>
            <Text style={{color:'#888', flex: 1, textAlign: 'center'}}>B</Text>
            <Text style={{color:'#888', flex: 1, textAlign: 'center'}}>SR</Text>
          </View>
          {Array.from(new Set(history.map(b => b.batsman))).map((batsman, idx) => {
            if(!batsman) return null;
            const balls = history.filter(b => b.batsman === batsman);
            const runs = balls.reduce((sum, b) => sum + b.runs, 0);
            const sr = balls.length > 0 ? ((runs / balls.length) * 100).toFixed(1) : 0;
            return (
              <View key={idx} style={styles.statRow}>
                <Text style={{color:'#fff', flex: 2}}>{batsman}</Text>
                <Text style={{color:'#fff', flex: 1, textAlign: 'center'}}>{runs}</Text>
                <Text style={{color:'#fff', flex: 1, textAlign: 'center'}}>{balls.length}</Text>
                <Text style={{color:'#fff', flex: 1, textAlign: 'center'}}>{sr}</Text>
              </View>
            )
          })}
        </BlurView>
      </View>
    );
  };

  const renderBowling = () => {
    return (
      <View>
        <BlurView intensity={40} tint="dark" style={styles.card}>
          <Text style={styles.cardTitle}>PITCH MAP</Text>
          <View style={{alignItems: 'center', marginVertical: 20}}>
            <Svg width="120" height="240" viewBox="0 0 120 240">
              <Rect x="0" y="0" width="120" height="240" fill="#2e7d32" opacity="0.3" rx="10" />
              <Rect x="30" y="20" width="60" height="200" fill="#e0e0e0" opacity="0.1" />
              <Line x1="30" y1="40" x2="90" y2="40" stroke="#fff" strokeWidth="2" />
              <Line x1="30" y1="200" x2="90" y2="200" stroke="#fff" strokeWidth="2" />
              {history.map((ball, i) => {
                let x = 60, y = 120;
                if(ball.pitching.includes("OFF")) x = 30;
                if(ball.pitching.includes("LEG")) x = 90;
                // randomize y slightly based on index
                y = 120 + ((i%5)*20 - 40);
                return <Circle key={i} cx={x} cy={y} r="5" fill={ball.is_wicket === 'Yes' ? '#ff1744' : '#00e676'} />
              })}
            </Svg>
          </View>
        </BlurView>

        <BlurView intensity={40} tint="dark" style={styles.card}>
          <Text style={styles.cardTitle}>BEEHIVE (IMPACT)</Text>
          <View style={{alignItems: 'center', marginVertical: 20}}>
            <Svg width="150" height="200" viewBox="0 0 150 200">
              <Rect x="0" y="0" width="150" height="200" fill="#000" opacity="0.2" rx="10" />
              <Rect x="55" y="80" width="40" height="120" fill="none" stroke="#fff" strokeWidth="2" />
              <Line x1="55" y1="80" x2="95" y2="80" stroke="#fff" strokeWidth="2" />
              <Line x1="75" y1="80" x2="75" y2="200" stroke="#fff" strokeWidth="2" />
              {history.map((ball, i) => {
                let x = 75, y = 140;
                if(ball.impact.includes("OFF") || ball.wickets === "MISSING") x = 40;
                if(ball.impact.includes("LEG")) x = 110;
                y = ball.wickets === 'HITTING' ? 120 : (ball.wickets === 'MISSING' ? 60 : 160);
                return <Circle key={i} cx={x} cy={y} r="5" fill={ball.is_wicket === 'Yes' ? '#ff1744' : '#ffea00'} />
              })}
            </Svg>
          </View>
        </BlurView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MATCH ANALYSIS</Text>
        <Share2 color="#00e676" size={24} />
      </View>

      <View style={styles.tabs}>
        {['OVERVIEW', 'BATTING', 'BOWLING'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{paddingBottom: 50}}>
        {activeTab === 'OVERVIEW' && renderOverview()}
        {activeTab === 'BATTING' && renderBatting()}
        {activeTab === 'BOWLING' && renderBowling()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a192f' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  
  tabs: { flexDirection: 'row', margin: 15, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#00e676' },
  tabText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  activeTabText: { color: '#000', fontWeight: '900' },

  content: { flex: 1, paddingHorizontal: 15 },
  
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  cardTitle: { color: '#00e676', fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, fontSize: 14 },
  
  scoreText: { color: '#fff', fontSize: 48, fontWeight: '900', textAlign: 'center' },
  oversText: { color: '#aaa', fontSize: 16, textAlign: 'center', marginTop: -5 },
  
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)' },
  
  saveBtn: { backgroundColor: '#00e676', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#000', fontWeight: '900', fontSize: 16 }
});
