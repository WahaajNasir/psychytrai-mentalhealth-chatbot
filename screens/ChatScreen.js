// ChatScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGeminiResponse } from '../utils/api.js';

export default function ChatScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('userInfo');
        if (userData) {
          setUserInfo(JSON.parse(userData));
        } else {
          console.warn('No userInfo found in AsyncStorage');
        }
      } catch (err) {
        console.error('Failed to load userInfo:', err);
      }
    };
    loadUser();
  }, []);

  const handleSend = async () => {
    const userMessage = message.trim();
    if (!userMessage) return;

    if (!userInfo) {
      console.warn('userInfo is null, blocking send.');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-bot',
          text: 'User info is missing. Please restart the app or complete onboarding again.',
          sender: 'bot',
        },
      ]);
      return;
    }

    const newMessages = [
      ...messages,
      { id: Date.now().toString(), text: userMessage, sender: 'user' },
    ];
    setMessages(newMessages);
    setMessage('');
    setLoading(true);

    try {
      const aiText = await getGeminiResponse(newMessages, userInfo);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-bot',
          text: aiText,
          sender: 'bot',
        },
      ]);
    } catch (err) {
      console.error('Error getting AI response:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '-bot',
          text: 'Sorry, something went wrong while contacting Gemini.',
          sender: 'bot',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userBubble : styles.botBubble,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
            />

            {loading && (
              <Text style={styles.typingIndicator}>AI is typing…</Text>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
                style={styles.input}
                multiline
              />
              <TouchableOpacity
                onPress={handleSend}
                style={styles.sendButton}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.sendText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3E3E3',
  },
  messageText: {
    fontSize: 16,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    fontStyle: 'italic',
    color: '#888',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f9f9f9',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
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
