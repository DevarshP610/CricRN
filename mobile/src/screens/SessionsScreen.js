import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Video, Trophy, Calendar } from 'lucide-react-native';

export default function SessionsScreen() {
  const dummySessions = [
    { id: 1, type: 'MATCH', title: 'Weekend T20 vs Strikers', date: 'Aug 12, 2026', runs: '184-4', clips: 120 },
    { id: 2, type: 'PRACTICE', title: 'Cover Drive Drills', date: 'Aug 10, 2026', clips: 45 },
    { id: 3, type: 'MATCH', title: 'Club Championship Final', date: 'Aug 5, 2026', runs: '210-2', clips: 240 },
    { id: 4, type: 'PRACTICE', title: 'Pace Bowling Net Session', date: 'Aug 1, 2026', clips: 60 }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Vault</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {dummySessions.map(session => (
          <TouchableOpacity key={session.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.typeBadge, session.type === 'MATCH' ? styles.matchBadge : styles.practiceBadge]}>
                {session.type === 'MATCH' ? <Trophy size={14} color="#00e676" /> : <Video size={14} color="#2979ff" />}
                <Text style={[styles.typeText, session.type === 'MATCH' ? {color: '#00e676'} : {color: '#2979ff'}]}>
                  {session.type}
                </Text>
              </View>
              <View style={styles.dateRow}>
                <Calendar size={14} color="#888" style={{marginRight: 5}}/>
                <Text style={styles.dateText}>{session.date}</Text>
              </View>
            </View>
            
            <Text style={styles.title}>{session.title}</Text>
            
            <View style={styles.footerRow}>
              {session.type === 'MATCH' && (
                <Text style={styles.runsText}>{session.runs}</Text>
              )}
              <Text style={styles.clipsText}>{session.clips} Clips</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 24, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#222', backgroundColor: '#121212' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  
  scroll: { padding: 20 },
  
  card: { backgroundColor: '#121212', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  matchBadge: { backgroundColor: 'rgba(0, 230, 118, 0.1)', borderColor: 'rgba(0, 230, 118, 0.3)' },
  practiceBadge: { backgroundColor: 'rgba(41, 121, 255, 0.1)', borderColor: 'rgba(41, 121, 255, 0.3)' },
  typeText: { fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
  
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateText: { color: '#888', fontSize: 12, fontWeight: '600' },
  
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 15 },
  runsText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  clipsText: { color: '#888', fontSize: 14, fontWeight: '600' }
});
