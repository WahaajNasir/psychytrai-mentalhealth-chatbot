// api.js
import axios from 'axios';
import { GEMINI_API_KEY } from '@env';

//Using Gemini 2.0 Flash
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function getGeminiResponse(history, userInfo) {
  const systemPrompt = `You are a compassionate and emotionally intelligent mental health assistant. The user is a ${userInfo.gender} from ${userInfo.country}. 
Respond like a therapist would: be gentle, validating, and never say you're an AI. Avoid disclaimers or identity statements. Always focus on helping the user feel heard and safe.`;

  //Build conversation history for context
  const messages = history.map((msg) => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  // Add system prompt at the beginning
  messages.unshift({
    role: 'user',
    parts: [{ text: systemPrompt }],
  });

  try {
    const res = await axios.post(
      GEMINI_API_URL,
      { contents: messages },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

        const aiReply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('Gemini Response:', aiReply);

    return (
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      '[No reply from Gemini]'
    );
  } catch (err) {
    console.error('Gemini API error:', err);
    return '[Error reaching the Gemini API]';
  }
}
