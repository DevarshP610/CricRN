import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { User, Activity, Crosshair, Zap, Home } from 'lucide-react-native';

export default function PlayerProfileScreen({ navigation }) {
  // In Phase 3, this is fetched from a database
  const profile = {
    name: "Coach Devarsh",
    role: "Fast Bowler",
    matches: 12,
    wickets: 28,
    avgSpeed: 135.2,
    topSpeed: 144.5,
    economy: 6.4,
    strikeRate: 14.2
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarBox}>
          <User color="#000" size={40} />
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.role}>{profile.role}</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>CAREER STATS</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.matches}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.wickets}</Text>
            <Text style={styles.statLabel}>Wickets</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.economy}</Text>
            <Text style={styles.statLabel}>Economy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.strikeRate}</Text>
            <Text style={styles.statLabel}>Strike Rate</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>BOWLING METRICS</Text>

        <View style={styles.metricsList}>
          <View style={styles.metricRow}>
            <View style={styles.metricIcon}><Zap color="#ffea00" size={20} /></View>
            <View style={styles.metricTextContainer}>
              <Text style={styles.metricTitle}>Top Speed</Text>
              <Text style={styles.metricDesc}>Fastest recorded delivery</Text>
            </View>
            <Text style={styles.metricValue}>{profile.topSpeed} km/h</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricIcon}><Activity color="#2979ff" size={20} /></View>
            <View style={styles.metricTextContainer}>
              <Text style={styles.metricTitle}>Average Speed</Text>
              <Text style={styles.metricDesc}>Across all sessions</Text>
            </View>
            <Text style={styles.metricValue}>{profile.avgSpeed} km/h</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricIcon}><Crosshair color="#00e676" size={20} /></View>
            <View style={styles.metricTextContainer}>
              <Text style={styles.metricTitle}>Accuracy Rating</Text>
              <Text style={styles.metricDesc}>% Balls on Good Length</Text>
            </View>
            <Text style={styles.metricValue}>72%</Text>
          </View>
        </View>

      </ScrollView>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Home color="#fff" size={24} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { alignItems: 'center', paddingVertical: 40, borderBottomWidth: 1, borderBottomColor: '#333' },
  avatarBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#00e676', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  role: { color: '#888', fontSize: 16, marginTop: 5 },
  
  content: { flex: 1, padding: 20 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { width: '48%', backgroundColor: '#1e1e1e', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  statValue: { color: '#00e676', fontSize: 32, fontWeight: '900' },
  statLabel: { color: '#888', fontSize: 14, marginTop: 5 },

  metricsList: { backgroundColor: '#1e1e1e', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: '#333' },
  metricRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  metricIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  metricTextContainer: { flex: 1, marginLeft: 15 },
  metricTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  metricDesc: { color: '#888', fontSize: 12, marginTop: 2 },
  metricValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  backBtn: { position: 'absolute', top: 50, left: 20, width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }
});
