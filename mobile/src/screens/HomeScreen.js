import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, Dimensions, ImageBackground } from 'react-native';
import { Play, Calendar, Trophy, Clock, User } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [recentMatch, setRecentMatch] = React.useState(null);

  useFocusEffect(
    React.useCallback(() => {
      const fetchMatches = async () => {
        try {
          const stored = await AsyncStorage.getItem('saved_matches');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.length > 0) {
              setRecentMatch(parsed[0]); 
            }
          }
        } catch (e) {
          console.log(e);
        }
      };
      fetchMatches();
    }, [])
  );

  return (
    <LinearGradient colors={['#0a192f', '#020c1b']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <SafeAreaView style={{flex:1}}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome Back,</Text>
            <Text style={styles.coachName}>Coach Devarsh</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('PlayerProfile')}>
            <User color="#000" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          
          <View style={styles.statsRow}>
            <BlurView intensity={40} tint="dark" style={styles.statBox}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </BlurView>
            <BlurView intensity={40} tint="dark" style={styles.statBox}>
              <Text style={styles.statNumber}>482</Text>
              <Text style={styles.statLabel}>Clips Saved</Text>
            </BlurView>
          </View>

          <View style={styles.actionCenter}>
            <TouchableOpacity onPress={() => navigation.navigate('MatchSetup')} style={styles.touchableWrapper}>
              <BlurView intensity={60} tint="light" style={[styles.mainActionBtn, { borderColor: 'rgba(0, 230, 118, 0.4)' }]}>
                <View style={[styles.iconBox, { backgroundColor: '#00e676' }]}>
                  <Trophy color="#000" size={28} fill="#000" />
                </View>
                <View style={styles.btnTextContainer}>
                  <Text style={[styles.mainActionText, {color: '#fff'}]}>START MATCH</Text>
                  <Text style={[styles.subActionText, {color: 'rgba(255,255,255,0.7)'}]}>Full Scoring & Teams</Text>
                </View>
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('LiveCamera', { sessionType: 'PRACTICE' })} style={styles.touchableWrapper}>
              <BlurView intensity={50} tint="dark" style={[styles.mainActionBtn, { borderColor: 'rgba(41, 121, 255, 0.4)' }]}>
                <View style={[styles.iconBox, { backgroundColor: '#2979ff' }]}>
                  <Play color="#fff" size={28} fill="#fff" />
                </View>
                <View style={styles.btnTextContainer}>
                  <Text style={[styles.mainActionText, {color: '#fff'}]}>PRACTICE SESSION</Text>
                  <Text style={[styles.subActionText, {color: 'rgba(255,255,255,0.7)'}]}>Continuous Clip Recording</Text>
                </View>
              </BlurView>
            </TouchableOpacity>
            
            {recentMatch && (
              <TouchableOpacity style={styles.touchableWrapper} onPress={() => navigation.navigate('LiveCamera', { 
                  isResume: true,
                  savedMatchId: recentMatch.id,
                  sessionType: recentMatch.sessionType,
                  matchDetails: recentMatch.matchDetails,
                  score: recentMatch.score,
                  innings: recentMatch.innings,
                  battingTeam: recentMatch.battingTeam,
                  bowlingTeam: recentMatch.bowlingTeam,
                  activeStriker: recentMatch.activeStriker,
                  strikerName: recentMatch.strikerName,
                  nonStrikerName: recentMatch.nonStrikerName,
                  yetToBat: recentMatch.yetToBat,
                  targetScore: recentMatch.targetScore
                })}>
                <BlurView intensity={50} tint="dark" style={[styles.mainActionBtn, { borderColor: 'rgba(255, 145, 0, 0.4)' }]}>
                  <View style={[styles.iconBox, { backgroundColor: '#ff9100' }]}>
                    <Clock color="#fff" size={28} />
                  </View>
                  <View style={styles.btnTextContainer}>
                    <Text style={[styles.mainActionText, {color: '#fff'}]}>RESUME RECENT</Text>
                    <Text style={[styles.subActionText, {color: 'rgba(255,255,255,0.7)'}]}>
                      {recentMatch.score.runs}-{recentMatch.score.wickets} ({Math.floor(recentMatch.score.balls/6)}.{recentMatch.score.balls%6})
                    </Text>
                  </View>
                </BlurView>
              </TouchableOpacity>
            )}

          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  coachName: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  profileBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#00e676', justifyContent: 'center', alignItems: 'center', shadowColor: '#00e676', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8 },
  
  content: { flex: 1, padding: 24 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  statBox: { width: '48%', padding: 20, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  statNumber: { color: '#00e676', fontSize: 32, fontWeight: '900', textShadowColor: 'rgba(0, 230, 118, 0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4, fontWeight: '600' },

  actionCenter: { flex: 1, justifyContent: 'center', paddingBottom: 40 },
  touchableWrapper: { width: '100%', marginBottom: 20 },
  mainActionBtn: { flexDirection: 'row', width: '100%', paddingVertical: 20, paddingHorizontal: 20, borderRadius: 30, alignItems: 'center', borderWidth: 1, overflow: 'hidden' },
  iconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  btnTextContainer: { marginLeft: 20 },
  mainActionText: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  subActionText: { fontSize: 13, fontWeight: '600', marginTop: 4 }
});
