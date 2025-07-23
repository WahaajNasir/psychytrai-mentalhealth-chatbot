import axios from 'axios';
import { GEMINI_API_KEY } from '@env';

// Using Gemini 2.0 Flash
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Get response from Gemini based on conversation summary + current message.
 * @param {string} summary - A trimmed summary of the chat so far.
 * @param {string} currentMessage - The user’s new message.
 * @param {object} userInfo - Object containing gender and country.
 */
export async function getGeminiResponse(summary, currentMessage, userInfo) {
  if (!userInfo || !userInfo.gender || !userInfo.country) {
    console.warn('Missing userInfo. Gemini context will be limited.');
  }

  const systemPrompt = `You are a compassionate and emotionally intelligent mental health assistant. 
The user is a ${userInfo?.gender || 'person'} from ${userInfo?.country || 'an unknown location'}. 
Respond like a therapist would: be gentle, validating, and never say you're an AI. 
Avoid disclaimers or identity statements. Always focus on helping the user feel heard and safe.`;

  // Construct minimal message context
  const messages = [
    {
      role: 'user',
      parts: [{ text: systemPrompt }],
    },
    {
      role: 'user',
      parts: [{ text: `Conversation so far:\n${summary}` }],
    },
    {
      role: 'user',
      parts: [{ text: `User just said:\n${currentMessage}` }],
    },
  ];

  try {
    const response = await axios.post(
      GEMINI_API_URL,
      { contents: messages },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10s max wait to avoid UI freezing
      }
    );

    const aiReply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Messages sent to Gemini:', JSON.stringify(messages, null, 2));
    console.log('Gemini Response:', aiReply);
    return aiReply || '[No reply from Gemini]';
  } catch (err) {
    console.error('Gemini API error:', err?.response?.data || err?.message || err);
    return '[Error reaching the Gemini API]';
  }
}
