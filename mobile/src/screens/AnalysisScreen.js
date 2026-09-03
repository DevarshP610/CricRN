import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ChevronLeft, Play, Activity, Target, Wind, Maximize2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AnalysisScreen({ route, navigation }) {
  const session = route?.params?.session || { title: 'Cover Drive Drills', date: 'Aug 10, 2026', type: 'PRACTICE' };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{session.title}</Text>
          <Text style={styles.headerSub}>{session.date}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Cinematic Video Player Mock */}
        <View style={styles.videoContainer}>
          <View style={styles.videoMock}>
            <Play color="#fff" size={48} opacity={0.5} />
            <View style={styles.shotBadge}>
              <Text style={styles.shotBadgeText}>COVER DRIVE</Text>
            </View>
            <TouchableOpacity style={styles.fullscreenBtn}>
              <Maximize2 color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Telemetry Dashboard */}
        <Text style={styles.sectionTitle}>Biomechanics Telemetry</Text>
        
        <View style={styles.telemetryGrid}>
          
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Target color="#00e676" size={20} />
              <Text style={styles.metricLabel}>Release Point</Text>
            </View>
            <Text style={styles.metricValue}>2.1m <Text style={styles.metricUnit}>Height</Text></Text>
            <Text style={styles.metricSub}>Optimal trajectory achieved.</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Wind color="#2979ff" size={20} />
              <Text style={styles.metricLabel}>Swing / Seam</Text>
            </View>
            <Text style={styles.metricValue}>3.4° <Text style={styles.metricUnit}>Inswing</Text></Text>
            <Text style={styles.metricSub}>Late movement detected.</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Activity color="#ffea00" size={20} />
              <Text style={styles.metricLabel}>Weight Transfer</Text>
            </View>
            <Text style={styles.metricValue}>85% <Text style={styles.metricUnit}>Front Foot</Text></Text>
            <Text style={styles.metricSub}>Perfect balance at impact.</Text>
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#222', backgroundColor: '#121212' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: '#888', marginTop: 2 },
  
  scroll: { paddingBottom: 50 },

  videoContainer: { width: '100%', height: width * 0.75, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#333' },
  videoMock: { flex: 1, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  shotBadge: { position: 'absolute', top: 15, left: 15, backgroundColor: 'rgba(0, 230, 118, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#00e676' },
  shotBadgeText: { color: '#00e676', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  fullscreenBtn: { position: 'absolute', bottom: 15, right: 15, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 10 },

  sectionTitle: { color: '#fff', fontSize: 22, fontWeight: '900', margin: 20, marginTop: 30, letterSpacing: 1 },
  
  telemetryGrid: { paddingHorizontal: 20 },
  metricCard: { backgroundColor: '#121212', borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  metricHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  metricLabel: { color: '#888', fontSize: 14, fontWeight: 'bold', marginLeft: 10, textTransform: 'uppercase', letterSpacing: 1 },
  metricValue: { color: '#fff', fontSize: 32, fontWeight: '900' },
  metricUnit: { fontSize: 16, color: '#666', fontWeight: 'bold' },
  metricSub: { color: '#00e676', fontSize: 12, marginTop: 10, fontWeight: '600' }
});
