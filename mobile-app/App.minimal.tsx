// Minimal test app - no complex dependencies
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Z99</Text>
      <Text style={styles.subtitle}>App is working!</Text>
      <Text style={styles.info}>If you see this, the basic app works.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10a37f',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 20,
  },
  info: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
});
