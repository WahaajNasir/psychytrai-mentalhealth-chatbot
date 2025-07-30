// utils/questionnaire.js
import * as SecureStore from 'expo-secure-store';
import { getGeminiResponse } from './api';
import { differenceInDays } from 'date-fns';
import { DAYS_TO_CHECKUP } from '@env';

const PHQ9_QUESTIONS = [
  "In the past two weeks, how often have you felt little interest or pleasure in doing things?",
  "How often have you been feeling down, depressed, or hopeless?",
  "Have you had trouble falling or staying asleep, or sleeping too much?",
  "Have you been feeling tired or having little energy?",
  "How often have you had poor appetite or overeating?",
  "How often have you felt bad about yourself — or that you're a failure or let yourself or your family down?",
  "How often have you had trouble concentrating on things like reading or watching TV?",
  "Have you been moving or speaking so slowly others noticed? Or the opposite — being fidgety or restless?",
  "Have you ever thought you’d be better off dead or of hurting yourself?"
];

const GAD7_QUESTIONS = [
  "How often have you been feeling nervous, anxious, or on edge?",
  "How often have you been unable to stop or control worrying?",
  "Have you been worrying too much about different things?",
  "How often have you had trouble relaxing?",
  "Have you been so restless that it's hard to sit still?",
  "How easily have you been annoyed or irritable?",
  "How often have you felt afraid something awful might happen?"
];

const STORAGE_KEY = 'last_checkup_date';

/**
 * Check if it's time to trigger a checkup
 */
export async function shouldTriggerCheckup() {
  const lastCheckup = await SecureStore.getItemAsync(STORAGE_KEY);
  const daysLimit = parseInt(DAYS_TO_CHECKUP);

  if (!lastCheckup) return true;

  const diff = differenceInDays(new Date(), new Date(lastCheckup));
  console.log(diff>=daysLimit)
  return diff >= daysLimit;
}

export async function saveCheckupDate() {
  await SecureStore.setItemAsync(STORAGE_KEY, new Date().toISOString());
}

export async function scoreAnswerWithGemini(question, answer, userInfo) {
  const prompt = `Using PHQ-9 or GAD-7 scale, rate the user's response from 0 (not at all) to 3 (nearly every day). 
Question: "${question}" 
Answer: "${answer}"
Respond only with a number from 0 to 3.`;

  const result = await getGeminiResponse('', prompt, userInfo);
  const numeric = parseInt(result.match(/\d+/)?.[0] || '0');
  return Math.min(Math.max(numeric, 0), 3);
}

export async function runQuestionnaireIfDue(userInfo, appendMessage, setLoading, waitForUserInput) {
  const shouldRun = await shouldTriggerCheckup();
  if (!shouldRun) return false;

  await saveCheckupDate();

  appendMessage({ role: 'system', text: "Let's have a quick mental health check-in. Just answer honestly, and I'll take care of the rest." });

  const questions = [...PHQ9_QUESTIONS, ...GAD7_QUESTIONS];
  let totalScore = 0;

  for (let question of questions) {
    appendMessage({ role: 'bot', text: question });

    const userReply = await waitForUserInput(); // Wait for user to respond
    const score = await scoreAnswerWithGemini(question, userReply.text, userInfo);

    totalScore += score;
    appendMessage({ role: 'system', text: `Thanks for sharing. [Score: ${score}/3]` });
  }

  appendMessage({
    role: 'system',
    text: `Thank you for completing the check-in. Your overall score is ${totalScore}. If you're feeling overwhelmed, consider reaching out to a professional or helpline.`,
  });

  return true; // Questionnaire was run
}
