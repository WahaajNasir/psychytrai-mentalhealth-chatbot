
# Mental Health Chatbot Powered by GEMINI API

This is a mental health chatbot, created using the Gemini API to help with users who are experiencing emotional trauma, in the forms of mental and physical abuse.

The chatbot is currently a standalone application which is to be integrated later on with the psychytrai application.

**⚠️ CAUTION ⚠️**
The following program is not to be used as a replacement for real world professionals. It is merely meant to aid and assist you with your thoughts and feelings. If you are suffering from real issues, please contact a professional according to your location

## Installation

The following are the dependancies required before you can run the project:
- [Node.js (npm)](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- A Gemini API key which can be found [here](https://ai.google.dev/gemini-api/docs/api-key)

After npm has been installed, you can utilize the following code to clone the repository:

```bash
  git clone https://github.com/WahaajNasir/psychytrai-mentalhealth-chatbot.git
  cd mental-health-bot
  npm install
```

After this installation, you can run the file by using 
```bash
  npx expo start
```

- Scan the QR code using the **Expo Go** application _(Android/iOS)_
- Make sure you have the `.env` file before running
    
## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

```bash
GEMINI_API_KEY=your-api-key-here
```




## Working
- On first launch, the user completes an onboarding screen.
- Their input is stored via `AsyncStorage`.
- Each chat message is sent (with history and user info) to Gemini.
- Gemini replies in a compassionate, therapist-style tone.
- Messages are displayed in a styled chat UI
## Project Structure
Your project structure will look similar to this:
```bash
MentalHealthBot/
├── assets/
├── screens/
│   ├── OnboardingScreen.js
│   └── ChatScreen.js
├── utils/
│   ├── api.js
│   └── storage.js
├── App.js
├── .env
├── app.json
```

**_You may find a few additional files in `/utils` and `/screens` which are currently placeholders for features to be implemented later_**