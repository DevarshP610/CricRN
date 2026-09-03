import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, Dimensions, ImageBackground } from 'react-native';
import { Play, Calendar, Trophy, Clock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

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
              setRecentMatch(parsed[0]); // get most recent
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome Back,</Text>
        <Text style={styles.coachName}>Coach Devarsh</Text>
      </View>

      <View style={styles.content}>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>482</Text>
            <Text style={styles.statLabel}>Clips Saved</Text>
          </View>
        </View>

        <View style={styles.actionCenter}>
          <TouchableOpacity 
            style={[styles.mainActionBtn, styles.matchBtn]} 
            onPress={() => navigation.navigate('MatchSetup')}
          >
            <Trophy color="#000" size={32} fill="#000" />
            <View style={styles.btnTextContainer}>
              <Text style={styles.mainActionText}>START MATCH</Text>
              <Text style={styles.subActionText}>Full Scoring & Teams</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.mainActionBtn, styles.practiceBtn]} 
            onPress={() => navigation.navigate('LiveCamera', { sessionType: 'PRACTICE' })}
          >
            <Play color="#fff" size={32} fill="#fff" />
            <View style={styles.btnTextContainer}>
              <Text style={[styles.mainActionText, {color: '#fff'}]}>PRACTICE SESSION</Text>
              <Text style={[styles.subActionText, {color: 'rgba(255,255,255,0.7)'}]}>Continuous Clip Recording</Text>
            </View>
          </TouchableOpacity>
          
          {recentMatch && (
            <TouchableOpacity 
              style={[styles.mainActionBtn, styles.resumeBtn]} 
              onPress={() => navigation.navigate('LiveCamera', { 
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
              })}
            >
              <Clock color="#fff" size={32} />
              <View style={styles.btnTextContainer}>
                <Text style={[styles.mainActionText, {color: '#fff'}]}>RESUME RECENT</Text>
                <Text style={[styles.subActionText, {color: 'rgba(255,255,255,0.7)'}]}>
                  {recentMatch.score.runs}-{recentMatch.score.wickets} ({Math.floor(recentMatch.score.balls/6)}.{recentMatch.score.balls%6})
                </Text>
              </View>
            </TouchableOpacity>
          )}

        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 24, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#222' },
  greeting: { fontSize: 16, color: '#888', letterSpacing: 1 },
  coachName: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  
  content: { flex: 1, padding: 24 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  statBox: { backgroundColor: '#1e1e1e', width: '48%', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  statNumber: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 14, marginTop: 4 },

  actionCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  
  mainActionBtn: { flexDirection: 'row', width: '100%', paddingVertical: 25, paddingHorizontal: 20, borderRadius: 25, alignItems: 'center', marginBottom: 20, elevation: 10 },
  matchBtn: { backgroundColor: '#00e676', shadowColor: '#00e676', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
  practiceBtn: { backgroundColor: '#2979ff', borderRadius: 12, shadowColor: '#2979ff', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
  resumeBtn: { backgroundColor: '#ff9100', borderRadius: 12, shadowColor: '#ff9100', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
  
  btnTextContainer: { marginLeft: 16 },
  mainActionText: { color: '#000', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  subActionText: { color: 'rgba(0,0,0,0.7)', fontSize: 12, fontWeight: '600', marginTop: 2 }
});
