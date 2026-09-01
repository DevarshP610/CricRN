import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator } from 'react-native';

export default function AnalysisScreen({ route }) {
  const { videoUri, stumpCoords } = route.params;
  const [status, setStatus] = useState('Uploading video to PC...');

  useEffect(() => {
    // Mocking the backend CV process
    setTimeout(() => setStatus('Extracting MediaPipe Keypoints...'), 2000);
    setTimeout(() => setStatus('Running YOLO Ball Tracking...'), 4000);
    setTimeout(() => setStatus('Generating AI Coaching Feedback...'), 6000);
    setTimeout(() => setStatus('Complete!'), 8000);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#00e676" style={{ marginBottom: 20 }} />
        <Text style={styles.title}>Processing Your Form</Text>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#1e1e1e', padding: 40, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  statusText: { color: '#00e676', fontSize: 14, textAlign: 'center' }
});
