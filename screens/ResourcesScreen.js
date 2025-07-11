import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ResourcesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>You are not alone ❤️</Text>
      <Text>If you're experiencing abuse or depression, please reach out to a local support service:</Text>

      <Text style={styles.link}>🇵🇰 Pakistan: 1099 (Helpline)</Text>
      <Text style={styles.link}>🌐 International: https://www.befrienders.org/</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 50 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  link: { marginTop: 10, color: 'blue' },
});
