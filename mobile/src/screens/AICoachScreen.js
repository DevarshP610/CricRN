import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Send, Cpu, Video } from 'lucide-react-native';

export default function AICoachScreen() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([
    { role: 'coach', text: "Hello! I am your AI Cricket Coach. I have access to all your saved Sessions and Match clips. What would you like to analyze today?" }
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    setChat([...chat, { role: 'user', text: message }]);
    setMessage('');
    
    setTimeout(() => {
      setChat(prev => [...prev, { 
        role: 'coach', 
        text: "Looking at your 'Cover Drive Drills' session from Aug 10... I notice your front foot is planting too early, causing you to reach for the ball. Let me pull up a clip to show you the biomechanics overlay.",
        hasClip: true
      }]);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        
        <View style={styles.header}>
          <Cpu color="#00e676" size={28} />
          <View style={{marginLeft: 10}}>
            <Text style={styles.headerTitle}>Pro AI Coach</Text>
            <Text style={styles.headerSub}>Powered by Vision Model</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} style={styles.chatArea}>
          {chat.map((msg, idx) => (
            <View key={idx} style={[styles.bubbleContainer, msg.role === 'user' ? styles.userBubble : styles.coachBubble]}>
              <Text style={[styles.msgText, msg.role === 'user' ? {color: '#000'} : {color: '#fff'}]}>{msg.text}</Text>
              
              {msg.hasClip && (
                <View style={styles.clipCard}>
                  <Video color="#00e676" size={20} />
                  <Text style={styles.clipText}>Tap to view analyzed clip</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Ask about your technique..." 
            placeholderTextColor="#666" 
            value={message} 
            onChangeText={setMessage} 
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Send color="#000" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 40, backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 12, color: '#00e676', fontWeight: '600', marginTop: 2 },
  
  chatArea: { flex: 1 },
  scroll: { padding: 20 },
  
  bubbleContainer: { maxWidth: '85%', padding: 16, borderRadius: 20, marginBottom: 15 },
  userBubble: { backgroundColor: '#00e676', alignSelf: 'flex-end', borderBottomRightRadius: 5 },
  coachBubble: { backgroundColor: '#1e1e1e', alignSelf: 'flex-start', borderBottomLeftRadius: 5, borderWidth: 1, borderColor: '#333' },
  msgText: { fontSize: 15, lineHeight: 22 },
  
  clipCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', padding: 12, borderRadius: 12, marginTop: 15, borderWidth: 1, borderColor: '#333' },
  clipText: { color: '#00e676', fontWeight: 'bold', marginLeft: 10, fontSize: 12 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#121212', borderTopWidth: 1, borderTopColor: '#222' },
  input: { flex: 1, backgroundColor: '#1e1e1e', color: '#fff', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 15, fontSize: 16, borderWidth: 1, borderColor: '#333', marginRight: 12 },
  sendBtn: { backgroundColor: '#00e676', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' }
});
