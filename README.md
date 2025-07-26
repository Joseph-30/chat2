# Chat2 - Interactive Horror/Romance Story Chat

An interactive chat-based story game built with React Native and Expo.

## Setup

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

To get an OpenRouter API key:
1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Sign up for an account
3. Get your API key from the dashboard
4. The app uses the DeepSeek Chat V3 model via OpenRouter for AI responses

### Installation

```bash
npm install
```

### Running the App

```bash
npx expo start
```

## Features

- Interactive horror/romance storytelling
- Multiple character relationships
- Choice-driven narrative
- AI-powered story generation using DeepSeek via OpenRouter
- Character relationship progression
- Save/load game state
