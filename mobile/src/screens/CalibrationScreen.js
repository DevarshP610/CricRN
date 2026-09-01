import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function CalibrationScreen({ route, navigation }) {
  const { videoUri } = route.params;
  const [stumpCoords, setStumpCoords] = useState([]);

  const handleTap = (e) => {
    if (stumpCoords.length < 3) {
      setStumpCoords([...stumpCoords, { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }]);
    }
  };

  const startAnalysis = () => {
    // Navigate to processing/analysis screen, passing videoUri and custom stumpCoords
    navigation.navigate('Analysis', { videoUri, stumpCoords });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calibration</Text>
        <Text style={styles.subtitle}>Tap the screen to mark your 3 stumps (or objects)</Text>
      </View>

      <TouchableOpacity activeOpacity={1} style={styles.videoPlaceholder} onPress={handleTap}>
        <Text style={styles.placeholderText}>[Video Frame preview will go here]</Text>
        <Text style={styles.placeholderText}>Tap to drop stump markers.</Text>
        
        {stumpCoords.map((coord, index) => (
          <View 
            key={index} 
            style={[styles.marker, { left: coord.x - 10, top: coord.y - 10 }]} 
          />
        ))}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.countText}>{stumpCoords.length} / 3 Stumps Marked</Text>
        <TouchableOpacity 
          style={[styles.btn, stumpCoords.length < 1 ? styles.btnDisabled : null]} 
          onPress={startAnalysis}
          disabled={stumpCoords.length < 1}
        >
          <Text style={styles.btnText}>Confirm & Analyze</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setStumpCoords([])}>
          <Text style={{ color: '#ff1744', textAlign: 'center' }}>Reset Markers</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 20, alignItems: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  subtitle: { color: '#888', marginTop: 8 },
  videoPlaceholder: { 
    flex: 1, 
    backgroundColor: '#1e1e1e', 
    margin: 20, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333'
  },
  placeholderText: { color: '#555', textAlign: 'center' },
  marker: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#00e676', borderWidth: 2, borderColor: '#fff' },
  footer: { padding: 20 },
  countText: { color: '#fff', textAlign: 'center', marginBottom: 15, fontSize: 16 },
  btn: { backgroundColor: '#00e676', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#333' },
  btnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});
