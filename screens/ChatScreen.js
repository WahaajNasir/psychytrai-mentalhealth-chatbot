import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform,
  Keyboard, TouchableWithoutFeedback, ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGeminiResponse } from '../utils/api';
import {
  insertMessage,
  getMessages,
  getSummary,
  saveSummary,
} from '../utils/db';
import { useTheme } from '../context/ThemeContext';

export default function ChatScreen({ navigation }) {
  const { isDark, toggleTheme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState([]);
  const [keyboardPadding, setKeyboardPadding] = useState(0);

  const colors = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    inputBackground: isDark ? '#1e1e1e' : '#f0f0f0',
    border: isDark ? '#333333' : '#e0e0e0',
    bubbleUser: isDark ? '#103bcaff' : '#b6e98cff',
    bubbleBot: isDark ? '#2A2A2A' : '#E3E3E3',
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardPadding(50); // Adjust this value to increase/decrease padding
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardPadding(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 15 }}>
          <Text style={{ color: colors.text, fontSize: 20 }}>
            {isDark ? '☀️' : '🌙'}
          </Text>
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTitleStyle: {
        color: colors.text,
      },
    });
  }, [navigation, toggleTheme, isDark]);

  useEffect(() => {
    const init = async () => {
      const userData = await AsyncStorage.getItem('userInfo');
      if (userData) setUserInfo(JSON.parse(userData));

      const storedMessages = await getMessages();
      const storedSummary = await getSummary();
      setMessages(storedMessages);
      setSummary(storedSummary);
    };
    init();
  }, []);

  const handleSend = async () => {
    const userText = message.trim();
    if (!userText || !userInfo) return;

    const userId = Date.now().toString();
    const userMsg = { id: userId, text: userText, sender: 'user' };

    setMessage('');
    setLoading(true);
    setMessages(prev => [...prev, userMsg]);
    await insertMessage(userId, userText, 'user');

    try {
      const aiText = await getGeminiResponse(summary, userText, userInfo);
      const botId = `${Date.now().toString()}-bot`;
      const botMsg = { id: botId, text: aiText, sender: 'bot' };

      setMessages(prev => [...prev, botMsg]);
      await insertMessage(botId, aiText, 'bot');

      const newSummary = `${summary}\nUser: ${userText}\nAI: ${aiText}`;
      const trimmed = newSummary.length > 1500 ? newSummary.slice(-1500) : newSummary;
      await saveSummary(trimmed);
      setSummary(trimmed);
    } catch (err) {
      const errorMsg = {
        id: Date.now().toString() + '-err',
        sender: 'bot',
        text: 'Sorry, something went wrong.',
      };
      setMessages(prev => [...prev, errorMsg]);
      await insertMessage(errorMsg.id, errorMsg.text, 'bot');
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        {
          alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start',
          backgroundColor: item.sender === 'user' ? colors.bubbleUser : colors.bubbleBot,
        },
      ]}
    >
      <Text style={{ color: colors.text }}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight + insets.top : 0}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={[
                styles.messagesList,
                { 
                  paddingBottom: (Platform.OS === 'ios' ? 80 : 70) + keyboardPadding 
                }
              ]}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              onLayout={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />

            {loading && (
              <Text style={[styles.typingIndicator, { color: colors.text }]}>
                AI is typing…
              </Text>
            )}

            <View style={[
              styles.inputContainer,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
                paddingBottom: (insets.bottom || 10) + keyboardPadding,
                paddingTop: 10 + keyboardPadding/2,
              },
            ]}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Type your message..."
                placeholderTextColor={isDark ? '#aaa' : '#666'}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                  },
                ]}
                multiline
              />
              <TouchableOpacity
                onPress={handleSend}
                style={styles.sendButton}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.sendText}>Send</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  messagesList: {
    padding: 10,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
    maxWidth: '80%',
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});