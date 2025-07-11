// screens/OnboardingScreen.js
// 
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { saveUserData } from '../utils/storage';

export default function OnboardingScreen({ navigation }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');

const handleContinue = async () => 
  {
  if (!name || !age || !gender || !country) {
    alert("Please fill all fields.");
    return;
  }

  const user = { name, age: parseInt(age), gender, country };
  console.log('Saving userInfo:', user);

  await saveUserData(user);
  navigation.replace('Chat');
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome! Tell us about yourself</Text>

      <TextInput placeholder="Your Name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Your Age" value={age} onChangeText={setAge} keyboardType="numeric" style={styles.input} />
      <TextInput placeholder="Your Country" value={country} onChangeText={setCountry} style={styles.input} />

      <Picker selectedValue={gender} onValueChange={setGender} style={styles.picker}>
        <Picker.Item label="Select Gender" value="" />
        <Picker.Item label="Male" value="male" />
        <Picker.Item label="Female" value="female" />
        <Picker.Item label="Non-binary" value="non-binary" />
        <Picker.Item label="Prefer not to say" value="unspecified" />
      </Picker>

      <Button title="Continue" onPress={handleContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 60 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, marginBottom: 12, padding: 10, borderRadius: 6 },
  picker: { marginBottom: 12 }
});
