import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

export default function MatchSetupScreen({ navigation }) {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [format, setFormat] = useState('T20'); // T20 | ODI | TEST
  
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');

  const startCalibration = () => {
    navigation.navigate('LiveCamera', {
      matchDetails: {
        teamA: teamA || 'Team A',
        teamB: teamB || 'Team B',
        format,
        striker: striker || 'Batsman 1',
        nonStriker: nonStriker || 'Batsman 2'
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
            <TextInput style={styles.input} placeholder="Batting Team Name" placeholderTextColor="#666" value={teamA} onChangeText={setTeamA} />
            <TextInput style={styles.input} placeholder="Bowling Team Name" placeholderTextColor="#666" value={teamB} onChangeText={setTeamB} />
          </View>

          {/* FORMAT */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Format</Text>
            <View style={styles.formatRow}>
              {['T20', 'ODI', 'TEST'].map(fmt => (
                <TouchableOpacity 
                  key={fmt} 
                  style={[styles.formatBtn, format === fmt && styles.formatBtnActive]}
                  onPress={() => setFormat(fmt)}
                >
                  <Text style={[styles.formatText, format === fmt && styles.formatTextActive]}>{fmt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* OPENERS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opening Batsmen</Text>
            <TextInput style={styles.input} placeholder="Striker Name" placeholderTextColor="#666" value={striker} onChangeText={setStriker} />
            <TextInput style={styles.input} placeholder="Non-Striker Name" placeholderTextColor="#666" value={nonStriker} onChangeText={setNonStriker} />
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.startBtn} onPress={startCalibration}>
            <Text style={styles.startBtnText}>Proceed to Calibration</Text>
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
  
  input: { backgroundColor: '#121212', color: '#fff', padding: 18, borderRadius: 12, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#222' },
  
  formatRow: { flexDirection: 'row', justifyContent: 'space-between' },
  formatBtn: { flex: 1, backgroundColor: '#121212', paddingVertical: 15, alignItems: 'center', borderRadius: 10, marginHorizontal: 5, borderWidth: 1, borderColor: '#222' },
  formatBtnActive: { backgroundColor: 'rgba(0, 230, 118, 0.2)', borderColor: '#00e676' },
  formatText: { color: '#888', fontWeight: 'bold', fontSize: 16 },
  formatTextActive: { color: '#00e676' },

  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 24, backgroundColor: '#000', borderTopWidth: 1, borderTopColor: '#222' },
  startBtn: { flexDirection: 'row', backgroundColor: '#00e676', paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  startBtnText: { color: '#000', fontSize: 18, fontWeight: 'bold', marginRight: 10 }
});
