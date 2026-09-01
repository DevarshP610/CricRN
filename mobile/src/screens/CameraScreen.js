import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleRecord = async () => {
    if (isRecording) {
      setIsRecording(false);
      cameraRef.current?.stopRecording();
    } else {
      setIsRecording(true);
      try {
        const video = await cameraRef.current?.recordAsync();
        if (video) {
          navigation.navigate('Calibration', { videoUri: video.uri });
        }
      } catch (e) {
        console.error(e);
        setIsRecording(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing="back"
        mode="video"
        ref={cameraRef}
      >
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.recordButtonContainer} 
            onPress={toggleRecord}
          >
            <View style={[styles.recordButton, isRecording && styles.recordingButton]} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  recordButtonContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
  recordButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  recordingButton: { backgroundColor: '#ff1744', width: 40, height: 40, borderRadius: 10 },
  text: { color: '#fff', textAlign: 'center', marginBottom: 20 },
  btn: { backgroundColor: '#00e676', padding: 15, borderRadius: 10 },
  btnText: { color: '#000', fontWeight: 'bold' }
});
