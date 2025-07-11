// utils/storage.js
// AsyncStorage used to basically save OnboardingScreen.js data locally on user phone
import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveUserData = async (data) => {
  try {
    await AsyncStorage.setItem('userInfo', JSON.stringify(data));
    console.log('User info saved:', data);
  } catch (e) {
    console.error('Failed to save user data:', e);
  }
};
