import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function MatchSetupScreen({ navigation }) {
  const [teamA, setTeamA] = useState('Strikers');
  const [teamB, setTeamB] = useState('Spartans');
  const [format, setFormat] = useState('T20');
  const [overs, setOvers] = useState('20');
  
  const [teamARoster, setTeamARoster] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6']);
  const [teamBRoster, setTeamBRoster] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6']);

  const [tossWinner, setTossWinner] = useState('Team A');
  const [tossDecision, setTossDecision] = useState('BAT');

  const battingTeamName = tossWinner === 'Team A' ? (tossDecision === 'BAT' ? teamA : teamB) : (tossDecision === 'BAT' ? teamB : teamA);
  const bowlingTeamName = tossWinner === 'Team A' ? (tossDecision === 'BOWL' ? teamA : teamB) : (tossDecision === 'BOWL' ? teamB : teamA);
  const battingRoster = battingTeamName === teamA ? teamARoster : teamBRoster;
  const bowlingRoster = bowlingTeamName === teamA ? teamARoster : teamBRoster;

  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');

  const handleStart = () => {
    if (!striker || !nonStriker) return Alert.alert('Error', 'Please select both opening batsmen.');
    if (striker === nonStriker) return Alert.alert('Error', 'Striker and Non-Striker must be different players.');
    
    navigation.navigate('LiveCamera', { 
      sessionType: 'MATCH',
      matchDetails: { 
        teamA, teamB, format, overs: parseInt(overs) || 20,
        toss: { winner: tossWinner, decision: tossDecision }
      },
      battingTeam: { name: battingTeamName, roster: battingRoster },
      bowlingTeam: { name: bowlingTeamName, roster: bowlingRoster },
      openingBatsmen: { striker, nonStriker }
    });
  };

  return (
    <LinearGradient colors={['#0a192f', '#020c1b']} style={styles.container}>
      <SafeAreaView style={{flex:1}}>
        <View style={styles.header}>
          <Trophy color="#00e676" size={28} />
          <Text style={styles.headerTitle}>MATCH SETUP</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 50 }}>
          
          <BlurView intensity={40} tint="dark" style={styles.section}>
            <Text style={styles.sectionTitle}>TEAMS & FORMAT</Text>
            
            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Team A</Text>
                <TextInput style={styles.input} value={teamA} onChangeText={setTeamA} placeholderTextColor="#666" />
              </View>
              <Text style={styles.vsText}>VS</Text>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Team B</Text>
                <TextInput style={styles.input} value={teamB} onChangeText={setTeamB} placeholderTextColor="#666" />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Format</Text>
                <View style={styles.toggleGroup}>
                  <TouchableOpacity style={[styles.toggleBtn, format === 'T20' && styles.toggleActive]} onPress={() => setFormat('T20')}>
                    <Text style={[styles.toggleText, format === 'T20' && styles.toggleTextActive]}>T20</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.toggleBtn, format === 'Custom' && styles.toggleActive]} onPress={() => setFormat('Custom')}>
                    <Text style={[styles.toggleText, format === 'Custom' && styles.toggleTextActive]}>Cstm</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Overs</Text>
                <TextInput style={styles.input} value={overs} onChangeText={setOvers} keyboardType="numeric" />
              </View>
            </View>
          </BlurView>

          <BlurView intensity={40} tint="dark" style={styles.section}>
            <Text style={styles.sectionTitle}>THE TOSS</Text>
            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Toss Won By</Text>
                <View style={styles.toggleGroup}>
                  <TouchableOpacity style={[styles.toggleBtn, tossWinner === 'Team A' && styles.toggleActive]} onPress={() => setTossWinner('Team A')}>
                    <Text style={[styles.toggleText, tossWinner === 'Team A' && styles.toggleTextActive]}>Team A</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.toggleBtn, tossWinner === 'Team B' && styles.toggleActive]} onPress={() => setTossWinner('Team B')}>
                    <Text style={[styles.toggleText, tossWinner === 'Team B' && styles.toggleTextActive]}>Team B</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Decision</Text>
                <View style={styles.toggleGroup}>
                  <TouchableOpacity style={[styles.toggleBtn, tossDecision === 'BAT' && styles.toggleActive]} onPress={() => setTossDecision('BAT')}>
                    <Text style={[styles.toggleText, tossDecision === 'BAT' && styles.toggleTextActive]}>BAT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.toggleBtn, tossDecision === 'BOWL' && styles.toggleActive]} onPress={() => setTossDecision('BOWL')}>
                    <Text style={[styles.toggleText, tossDecision === 'BOWL' && styles.toggleTextActive]}>BOWL</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <Text style={styles.tossSummary}>{battingTeamName} will bat first.</Text>
          </BlurView>

          <BlurView intensity={40} tint="dark" style={styles.section}>
            <Text style={styles.sectionTitle}>OPENING BATSMEN</Text>
            <Text style={styles.subLabel}>Select from {battingTeamName} roster:</Text>
            
            <View style={styles.rosterSelection}>
              {battingRoster.map((player, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.rosterPill, striker === player && styles.strikerPill, nonStriker === player && styles.nonStrikerPill]}
                  onPress={() => {
                    if (striker === player) setStriker('');
                    else if (nonStriker === player) setNonStriker('');
                    else if (!striker) setStriker(player);
                    else if (!nonStriker) setNonStriker(player);
                  }}
                >
                  <Text style={styles.rosterPillText}>{player}</Text>
                  {striker === player && <Text style={styles.pillBadge}>ST</Text>}
                  {nonStriker === player && <Text style={styles.pillBadge}>NS</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>

        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
            <Text style={styles.startBtnText}>START MATCH</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: '#00e676', fontSize: 24, fontWeight: '900', marginLeft: 15, letterSpacing: 1 },
  
  content: { flex: 1, padding: 15 },
  
  section: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
  
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  halfInput: { flex: 1 },
  vsText: { color: '#888', fontWeight: 'bold', marginHorizontal: 15, marginTop: 25 },
  
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 8, fontWeight: 'bold' },
  input: { backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  
  toggleGroup: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 3, borderWidth: 1, borderColor: '#333' },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleActive: { backgroundColor: '#00e676' },
  toggleText: { color: '#888', fontWeight: 'bold' },
  toggleTextActive: { color: '#000' },
  
  tossSummary: { color: '#00e676', textAlign: 'center', marginTop: 10, fontWeight: 'bold' },

  subLabel: { color: '#888', fontSize: 12, marginBottom: 15 },
  rosterSelection: { flexDirection: 'row', flexWrap: 'wrap' },
  rosterPill: { backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginRight: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  rosterPillText: { color: '#fff' },
  strikerPill: { backgroundColor: '#ff1744', borderColor: '#ff1744' },
  nonStrikerPill: { backgroundColor: '#2979ff', borderColor: '#2979ff' },
  pillBadge: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 5, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  
  bottomBar: { padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  startBtn: { backgroundColor: '#00e676', paddingVertical: 18, borderRadius: 30, alignItems: 'center', shadowColor: '#00e676', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  startBtnText: { color: '#000', fontSize: 18, fontWeight: '900', letterSpacing: 1 }
});
