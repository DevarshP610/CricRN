import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { ChevronRight, Plus, Trash2 } from 'lucide-react-native';

export default function MatchSetupScreen({ navigation }) {
  const [teamA, setTeamA] = useState('Strikers');
  const [teamB, setTeamB] = useState('Royals');
  const [format, setFormat] = useState('T20'); // T20 | ODI | TEST
  
  // Full Roster for Batting Team
  const [roster, setRoster] = useState(['Batsman 1', 'Batsman 2', 'Batsman 3', 'Batsman 4', 'Batsman 5', 'Batsman 6']);
  const [strikerIndex, setStrikerIndex] = useState(0);
  const [nonStrikerIndex, setNonStrikerIndex] = useState(1);

  const updatePlayer = (text, index) => {
    let newRoster = [...roster];
    newRoster[index] = text;
    setRoster(newRoster);
  };

  const addPlayer = () => setRoster([...roster, `Batsman ${roster.length + 1}`]);
  
  const removePlayer = (index) => {
    if (roster.length <= 2) return; // Need at least 2 players
    let newRoster = roster.filter((_, i) => i !== index);
    setRoster(newRoster);
    if (strikerIndex >= newRoster.length) setStrikerIndex(0);
    if (nonStrikerIndex >= newRoster.length) setNonStrikerIndex(1);
  };

  const startCalibration = () => {
    navigation.navigate('LiveCamera', {
      sessionType: 'MATCH',
      matchDetails: {
        teamA: teamA || 'Team A',
        teamB: teamB || 'Team B',
        format,
        roster,
        striker: roster[strikerIndex],
        nonStriker: roster[nonStrikerIndex]
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scroll}>
          
          <Text style={styles.headerTitle}>Match Setup</Text>

          {/* TEAMS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Teams</Text>
            <TextInput style={styles.input} placeholder="Batting Team" placeholderTextColor="#666" value={teamA} onChangeText={setTeamA} />
            <TextInput style={styles.input} placeholder="Bowling Team" placeholderTextColor="#666" value={teamB} onChangeText={setTeamB} />
          </View>

          {/* FORMAT */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Format</Text>
            <View style={styles.formatRow}>
              {['T20', 'ODI', 'TEST'].map(fmt => (
                <TouchableOpacity key={fmt} style={[styles.formatBtn, format === fmt && styles.formatBtnActive]} onPress={() => setFormat(fmt)}>
                  <Text style={[styles.formatText, format === fmt && styles.formatTextActive]}>{fmt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* BATTING ROSTER */}
          <View style={styles.section}>
            <View style={styles.rosterHeader}>
              <Text style={styles.sectionTitle}>Batting Lineup ({teamA})</Text>
              <TouchableOpacity onPress={addPlayer} style={styles.addBtn}><Plus color="#00e676" size={20}/></TouchableOpacity>
            </View>
            
            {roster.map((player, index) => (
              <View key={index} style={styles.playerRow}>
                <Text style={styles.playerNum}>{index + 1}.</Text>
                <TextInput style={styles.playerInput} value={player} onChangeText={(t) => updatePlayer(t, index)} placeholder={`Player ${index + 1}`} placeholderTextColor="#555" />
                <TouchableOpacity onPress={() => removePlayer(index)}><Trash2 color="#ff1744" size={20}/></TouchableOpacity>
              </View>
            ))}
          </View>

          {/* OPENERS SELECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Openers</Text>
            
            <Text style={styles.label}>Striker</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.openerScroll}>
              {roster.map((player, idx) => (
                <TouchableOpacity key={`s-${idx}`} style={[styles.pill, strikerIndex === idx && styles.pillActive]} onPress={() => { setStrikerIndex(idx); if(nonStrikerIndex === idx) setNonStrikerIndex((idx + 1) % roster.length); }}>
                  <Text style={[styles.pillText, strikerIndex === idx && styles.pillTextActive]}>{player}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, {marginTop: 15}]}>Non-Striker</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.openerScroll}>
              {roster.map((player, idx) => (
                <TouchableOpacity key={`ns-${idx}`} style={[styles.pill, nonStrikerIndex === idx && styles.pillActive]} onPress={() => { setNonStrikerIndex(idx); if(strikerIndex === idx) setStrikerIndex((idx + 1) % roster.length); }}>
                  <Text style={[styles.pillText, nonStrikerIndex === idx && styles.pillTextActive]}>{player}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.startBtn} onPress={startCalibration}>
            <Text style={styles.startBtnText}>Proceed to Match</Text>
            <ChevronRight color="#000" size={24} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 24, paddingBottom: 100 },
  headerTitle: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 30, marginTop: 20 },
  
  section: { marginBottom: 30 },
  sectionTitle: { color: '#00e676', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
  label: { color: '#888', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10 },
  
  input: { backgroundColor: '#121212', color: '#fff', padding: 18, borderRadius: 12, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#222' },
  
  formatRow: { flexDirection: 'row', justifyContent: 'space-between' },
  formatBtn: { flex: 1, backgroundColor: '#121212', paddingVertical: 15, alignItems: 'center', borderRadius: 10, marginHorizontal: 5, borderWidth: 1, borderColor: '#222' },
  formatBtnActive: { backgroundColor: 'rgba(0, 230, 118, 0.2)', borderColor: '#00e676' },
  formatText: { color: '#888', fontWeight: 'bold', fontSize: 16 },
  formatTextActive: { color: '#00e676' },

  rosterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addBtn: { backgroundColor: 'rgba(0, 230, 118, 0.1)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#00e676' },
  playerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', borderRadius: 10, paddingHorizontal: 15, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  playerNum: { color: '#888', fontWeight: 'bold', width: 25 },
  playerInput: { flex: 1, color: '#fff', paddingVertical: 15, fontSize: 16 },
  
  openerScroll: { flexDirection: 'row' },
  pill: { backgroundColor: '#121212', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#222' },
  pillActive: { backgroundColor: '#00e676', borderColor: '#00e676' },
  pillText: { color: '#888', fontWeight: 'bold' },
  pillTextActive: { color: '#000' },

  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 24, backgroundColor: '#000', borderTopWidth: 1, borderTopColor: '#222' },
  startBtn: { flexDirection: 'row', backgroundColor: '#00e676', paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  startBtnText: { color: '#000', fontSize: 18, fontWeight: 'bold', marginRight: 10 }
});
