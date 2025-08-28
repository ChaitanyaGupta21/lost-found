# Google Gemini API Setup for AI Chatbot Assistant

## Overview
The AI Chatbot Assistant in your Lost & Found website is powered by Google's Gemini AI model, providing intelligent responses to user queries about the platform.

## Features
- **24/7 Real-time Support** 🤖
- **Instant Help and Guidance** 💡
- **Question Answering** ❓
- **Smart Recommendations** 🎯
- **Multi-language Support** 🌍
- **Contextual Understanding** 🧠

## Setup Instructions

### 1. Get Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure the API Key
1. Open `js/ai-chatbot.js`
2. Find this line: `this.GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';`
3. Replace `'YOUR_GEMINI_API_KEY'` with your actual API key
4. Save the file

### 3. API Configuration
The chatbot is configured to use:
- **Model**: `gemini-pro` (text generation)
- **API Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 500 (concise responses)

### 4. Testing the Chatbot
1. Open any page of your website
2. Wait 5 seconds for the chatbot to appear
3. Click the "AI Assistant" button
4. Ask questions about the platform
5. Test quick response buttons

## Security Notes
- **Never commit your API key to version control**
- **Keep your API key private and secure**
- **Consider using environment variables for production**
- **Monitor API usage to control costs**

## Fallback System
If the Gemini API is unavailable, the chatbot provides intelligent fallback responses for common queries:
- Lost item reporting
- Found item reporting
- Search functionality
- Reward system
- Contact information
- Login/registration help

## Customization
You can customize the chatbot by:
- Modifying the system prompt in `getGeminiResponse()`
- Adding new quick response buttons
- Adjusting the AI parameters (temperature, tokens)
- Implementing additional fallback responses

## Support
For issues with:
- **Website functionality**: Check browser console for errors
- **API integration**: Verify API key and network connectivity
- **Gemini API**: Refer to [Google AI documentation](https://ai.google.dev/docs)

## Cost Information
- Google Gemini API has usage-based pricing
- Check [Google AI pricing](https://ai.google.dev/pricing) for current rates
- Monitor usage in Google Cloud Console

## Next Steps
1. Test the chatbot with various queries
2. Customize responses for your specific needs
3. Consider adding more quick response options
4. Implement user feedback collection
5. Add analytics to track usage patterns
