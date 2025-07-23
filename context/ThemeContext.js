import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance } from 'react-native';

const ThemeContext = createContext();

const lightTheme = {
  background: '#fff',
  text: '#000',
  userBubble: '#103bcaff',
  botBubble: '#E3E3E3',
  input: '#f1f1f1',
  inputContainer: '#f9f9f9',
  placeholder: '#888',
  primary: '#007AFF',
};

const darkTheme = {
  background: '#121212',
  text: '#f1f1f1',
  userBubble: '#103bcaff',
  botBubble: '#333',
  input: '#1c1c1e',
  inputContainer: '#2a2a2c',
  placeholder: '#aaa',
  primary: '#0A84FF',
};

export const ThemeProvider = ({ children }) => {
  const systemScheme = Appearance.getColorScheme(); // 'dark' or 'light'
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });
    return () => listener.remove();
  }, []);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
