import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Video, Trophy, Calendar } from 'lucide-react-native';

export default function SessionsScreen({ navigation }) {
  // Adding one dummy clip so the user can see the Analysis UI in Phase 1
  const [sessions, setSessions] = useState([
    { id: 1, type: 'PRACTICE', title: 'Cover Drive Drills', date: 'Aug 12, 2026', clips: 1, shotType: 'COVER DRIVE' }
  ]); 

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Vault</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Video color="#333" size={80} style={{marginBottom: 20}} />
          <Text style={styles.emptyTitle}>Vault is Empty</Text>
          <Text style={styles.emptySub}>Your saved matches and practice clips will appear here once the AI backend is active.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {sessions.map(session => (
            <TouchableOpacity key={session.id} style={styles.card} onPress={() => navigation.navigate('Analysis', { session })}>
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
                {/* NEW SHOT TAG UI */}
                <View style={styles.shotTag}>
                  <Text style={styles.shotTagText}>{session.shotType}</Text>
                </View>
                <Text style={styles.clipsText}>{session.clips} Clips</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 24, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#222', backgroundColor: '#121212' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { color: '#666', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  emptySub: { color: '#444', fontSize: 16, textAlign: 'center', lineHeight: 22 },
  
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
  clipsText: { color: '#888', fontSize: 14, fontWeight: '600' },

  shotTag: { backgroundColor: 'rgba(0, 230, 118, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#00e676' },
  shotTagText: { color: '#00e676', fontSize: 10, fontWeight: '900', letterSpacing: 1 }
});
