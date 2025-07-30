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
import { shouldTriggerCheckup, getQuestionnaire, scoreAnswerWithGemini, saveCheckupDate } from '../utils/Questionnaire';
import { DAYS_TO_CHECKUP } from '@env';



export default function ChatScreen({ navigation }) {
  const { isDark, toggleTheme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [isQuestionnaireMode, setIsQuestionnaireMode] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [scores, setScores] = useState([]);
  const [keyboardPadding, setKeyboardPadding] = useState(0);
  const [userInfo, setUserInfo] = useState(null);

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

useEffect(() => {
  const init = async () => {
    const userData = await AsyncStorage.getItem('userInfo');
    const user = userData ? JSON.parse(userData) : null;
    if (user) {
      setUserInfo(user);
    }

    const due = await shouldTriggerCheckup();
    console.log('Checkup due?', due);

    if (due) {
      setMessages([
        {
          _id: Date.now().toString(),
          text: "Let's have a quick mental health check-in. Just answer honestly.",
          createdAt: new Date(),
          user: { _id: 2, name: 'Bot' },
        },
      ]);
      setIsQuestionnaireActive(true);
      setCurrentQuestionIndex(0);
      return;
    }

    // Only load messages if no checkup is due
    await loadChatHistory();
  };

  init();
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


const checkIfCheckupIsDue = async (user) => {
  const due = await shouldTriggerCheckup();
  console.log('Checkup due?', due);

  if (due) {
    const q = getQuestionnaire();
    const opening = {
      id: Date.now().toString(),
      text: "Let's have a quick mental health check-in. Please answer honestly. This won't be shared with anyone.",
      sender: 'bot',
    };
    const firstQuestion = {
      id: (Date.now() + 1).toString(),
      text: q[0],
      sender: 'bot',
    };
    setMessages((prev) => [...prev, opening, firstQuestion]);
    setIsQuestionnaireMode(true);
    setQuestionIndex(0);
    setUserInfo(user); // just in case
  }
};


  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    if (isQuestionnaireMode) {
      const allQuestions = getQuestionnaire();
      const currentQuestion = allQuestions[questionIndex];
      const score = await scoreAnswerWithGemini(currentQuestion, userMessage.text, userInfo);
      setScores((prev) => [...prev, score]);

      const nextIndex = questionIndex + 1;
      if (nextIndex < allQuestions.length) {
        const nextQuestion = {
          id: (Date.now() + 1).toString(),
          text: allQuestions[nextIndex],
          sender: 'bot',
        };
        setMessages((prev) => [...prev, nextQuestion]);
        setQuestionIndex(nextIndex);
      } else {
        // Done with questionnaire
        const totalPHQ = scores.slice(0, 9).reduce((a, b) => a + b, 0);
        const totalGAD = scores.slice(9).reduce((a, b) => a + b, 0);
        const closingMessage = {
          id: Date.now().toString(),
          text: `Thank you for sharing. PHQ-9 Score: ${totalPHQ}, GAD-7 Score: ${totalGAD}. I'm here to help however I can.`,
          sender: 'bot',
        };
        setMessages((prev) => [...prev, closingMessage]);
        setIsQuestionnaireMode(false);
        await saveCheckupDate();
      }
    } else {
  setLoading(true);
  try {
    const aiResponse = await getGeminiResponse(summary, userMessage.text, userInfo);
    const botMessage = { id: Date.now().toString(), text: aiResponse, sender: 'bot' };

    setMessages((prev) => {
      const updated = [...prev, botMessage];
      return updated;
    });

    await insertMessage(userMessage);
    await insertMessage(botMessage);

    setSummary((prevSummary) => {
      const updatedMessages = [...messages, userMessage, botMessage];
      const trimmedSummary = updatedMessages
        .slice(-10)
        .map((m) => `${m.sender === 'user' ? 'User' : 'Bot'}: ${m.text}`)
        .join('\n');
      saveSummary(trimmedSummary);
      return trimmedSummary;
    });
  } catch (error) {
    console.error('AI response failed:', error);
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: 'Sorry, something went wrong.', sender: 'bot' },
    ]);
  } finally {
    setLoading(false);
  }
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
                value={input}
                onChangeText={setInput}
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