import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Camera, Activity, User, Play, MessageSquare } from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import MatchSetupScreen from '../screens/MatchSetupScreen';
import LiveCameraScreen from '../screens/LiveCameraScreen';
import SessionsScreen from '../screens/SessionsScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import AICoachScreen from '../screens/AICoachScreen';
import PostMatchAnalysisScreen from '../screens/PostMatchAnalysisScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#000000',
    card: '#121212',
    text: '#ffffff',
    border: '#222222',
    primary: '#00e676', // Neon green accent
  },
};

function PlayStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="MatchSetup" component={MatchSetupScreen} />
      <Stack.Screen name="LiveCamera" component={LiveCameraScreen} />
      <Stack.Screen name="PostMatchAnalysis" component={PostMatchAnalysisScreen} />
    </Stack.Navigator>
  );
}

function SessionsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SessionsMain" component={SessionsScreen} />
      <Stack.Screen name="Analysis" component={AnalysisScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={customDarkTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0a0a0a',
            borderTopWidth: 1,
            borderTopColor: '#222',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarActiveTintColor: '#00e676',
          tabBarInactiveTintColor: '#888',
          tabBarIcon: ({ focused, color, size }) => {
            let iconSize = focused ? 28 : 24;
            if (route.name === 'Play') {
              return <Play color={color} size={iconSize} />;
            } else if (route.name === 'Sessions') {
              return <Activity color={color} size={iconSize} />;
            } else if (route.name === 'AI Coach') {
              return <MessageSquare color={color} size={iconSize} />;
            }
          },
        })}
      >
        <Tab.Screen name="Play" component={PlayStack} />
        <Tab.Screen name="Sessions" component={SessionsStack} />
        <Tab.Screen name="AI Coach" component={AICoachScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
