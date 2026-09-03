import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Trophy, Plus, X } from 'lucide-react-native';

export default function MatchSetupScreen({ navigation }) {
  const [teamA, setTeamA] = useState('Strikers');
  const [teamB, setTeamB] = useState('Spartans');
  const [format, setFormat] = useState('T20');
  const [overs, setOvers] = useState('20');
  
  const [teamARoster, setTeamARoster] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6']);
  const [teamBRoster, setTeamBRoster] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6']);
  const [newPlayerA, setNewPlayerA] = useState('');
  const [newPlayerB, setNewPlayerB] = useState('');

  // Toss
  const [tossWinner, setTossWinner] = useState('Team A');
  const [tossDecision, setTossDecision] = useState('BAT');

  const battingTeamName = tossWinner === 'Team A' ? (tossDecision === 'BAT' ? teamA : teamB) : (tossDecision === 'BAT' ? teamB : teamA);
  const bowlingTeamName = tossWinner === 'Team A' ? (tossDecision === 'BOWL' ? teamA : teamB) : (tossDecision === 'BOWL' ? teamB : teamA);
  const battingRoster = battingTeamName === teamA ? teamARoster : teamBRoster;
  const bowlingRoster = bowlingTeamName === teamA ? teamARoster : teamBRoster;

  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');

  const addPlayer = (team) => {
    if (team === 'A' && newPlayerA.trim()) {
      setTeamARoster([...teamARoster, newPlayerA.trim()]);
      setNewPlayerA('');
    } else if (team === 'B' && newPlayerB.trim()) {
      setTeamBRoster([...teamBRoster, newPlayerB.trim()]);
      setNewPlayerB('');
    }
  };

  const removePlayer = (team, index) => {
    if (team === 'A') setTeamARoster(teamARoster.filter((_, i) => i !== index));
    if (team === 'B') setTeamBRoster(teamBRoster.filter((_, i) => i !== index));
  };

  const handleStart = () => {
    if (!striker || !nonStriker) return Alert.alert('Error', 'Please select both opening batsmen.');
    if (striker === nonStriker) return Alert.alert('Error', 'Striker and Non-Striker must be different players.');
    
    navigation.navigate('LiveCamera', { 
      sessionType: 'MATCH',
      matchDetails: { 
        teamA, teamB, format, overs: parseInt(overs) || 20,
        battingTeamName, bowlingTeamName,
        battingRoster, bowlingRoster,
        striker, nonStriker 
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Match Setup</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Team A Name</Text>
          <TextInput style={styles.input} value={teamA} onChangeText={setTeamA} placeholderTextColor="#555" />
          
          <Text style={styles.label}>Team B Name</Text>
          <TextInput style={styles.input} value={teamB} onChangeText={setTeamB} placeholderTextColor="#555" />
        </View>

        <View style={styles.sectionRow}>
          <View style={{flex: 1, marginRight: 10}}>
            <Text style={styles.label}>Format</Text>
            <TextInput style={styles.input} value={format} onChangeText={setFormat} />
          </View>
          <View style={{flex: 1, marginLeft: 10}}>
            <Text style={styles.label}>Overs</Text>
            <TextInput style={styles.input} value={overs} onChangeText={setOvers} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>The Toss</Text>
          <View style={styles.tossRow}>
            <TouchableOpacity style={[styles.tossBtn, tossWinner === 'Team A' && styles.tossActive]} onPress={() => setTossWinner('Team A')}>
              <Text style={styles.tossText}>{teamA} Won</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tossBtn, tossWinner === 'Team B' && styles.tossActive]} onPress={() => setTossWinner('Team B')}>
              <Text style={styles.tossText}>{teamB} Won</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tossRow}>
            <TouchableOpacity style={[styles.tossBtn, tossDecision === 'BAT' && styles.tossActive]} onPress={() => setTossDecision('BAT')}>
              <Text style={styles.tossText}>Bat First</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tossBtn, tossDecision === 'BOWL' && styles.tossActive]} onPress={() => setTossDecision('BOWL')}>
              <Text style={styles.tossText}>Bowl First</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.tossResultText}>🏏 {battingTeamName} is batting first.</Text>
        </View>

        {/* Team A Roster */}
        <View style={styles.section}>
          <Text style={styles.label}>{teamA} Roster ({teamARoster.length})</Text>
          <View style={styles.addPlayerRow}>
            <TextInput style={styles.addPlayerInput} value={newPlayerA} onChangeText={setNewPlayerA} placeholder="Add Player..." placeholderTextColor="#666" />
            <TouchableOpacity style={styles.addBtn} onPress={() => addPlayer('A')}><Plus color="#000" size={20} /></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rosterScroll}>
            {teamARoster.map((p, i) => (
              <View key={i} style={styles.playerChip}>
                <Text style={styles.playerChipText}>{p}</Text>
                <TouchableOpacity onPress={() => removePlayer('A', i)}><X color="#ff1744" size={16}/></TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Team B Roster */}
        <View style={styles.section}>
          <Text style={styles.label}>{teamB} Roster ({teamBRoster.length})</Text>
          <View style={styles.addPlayerRow}>
            <TextInput style={styles.addPlayerInput} value={newPlayerB} onChangeText={setNewPlayerB} placeholder="Add Player..." placeholderTextColor="#666" />
            <TouchableOpacity style={styles.addBtn} onPress={() => addPlayer('B')}><Plus color="#000" size={20} /></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rosterScroll}>
            {teamBRoster.map((p, i) => (
              <View key={i} style={styles.playerChip}>
                <Text style={styles.playerChipText}>{p}</Text>
                <TouchableOpacity onPress={() => removePlayer('B', i)}><X color="#ff1744" size={16}/></TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Select Opening Batsmen</Text>
          <Text style={styles.subLabel}>Striker</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15}}>
            {battingRoster.map((p, i) => (
              <TouchableOpacity key={i} style={[styles.selectPill, striker === p && styles.activePill]} onPress={() => setStriker(p)}>
                <Text style={styles.selectPillText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.subLabel}>Non-Striker</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {battingRoster.map((p, i) => (
              <TouchableOpacity key={i} style={[styles.selectPill, nonStriker === p && styles.activePill]} onPress={() => setNonStriker(p)}>
                <Text style={styles.selectPillText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
          <Text style={styles.startBtnText}>START MATCH</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { padding: 20, paddingTop: 40, paddingBottom: 100 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 20 },
  
  section: { backgroundColor: '#121212', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  
  label: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  subLabel: { color: '#888', fontSize: 14, marginBottom: 5 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#333', marginBottom: 15 },
  
  tossRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  tossBtn: { flex: 1, backgroundColor: '#1a1a1a', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#333', alignItems: 'center', marginHorizontal: 5 },
  tossActive: { backgroundColor: 'rgba(0, 230, 118, 0.2)', borderColor: '#00e676' },
  tossText: { color: '#fff', fontWeight: 'bold' },
  tossResultText: { color: '#00e676', textAlign: 'center', marginTop: 10, fontWeight: 'bold', fontSize: 16 },

  addPlayerRow: { flexDirection: 'row', marginBottom: 15 },
  addPlayerInput: { flex: 1, backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  addBtn: { backgroundColor: '#00e676', padding: 12, borderRadius: 10, marginLeft: 10, justifyContent: 'center' },
  
  rosterScroll: { paddingBottom: 10 },
  playerChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginRight: 10 },
  playerChipText: { color: '#fff', marginRight: 10 },

  selectPill: { backgroundColor: '#222', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#333' },
  activePill: { backgroundColor: '#00e676', borderColor: '#00e676' },
  selectPillText: { color: '#fff', fontWeight: 'bold' },

  startBtn: { backgroundColor: '#00e676', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  startBtnText: { color: '#000', fontSize: 18, fontWeight: '900', letterSpacing: 1 }
});
