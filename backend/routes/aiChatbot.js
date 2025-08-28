const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Google Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * @route   POST /api/ai-chatbot/chat
 * @desc    Get AI response from Google Gemini
 * @access  Public (but can be restricted if needed)
 */
router.post('/chat', [
    body('message')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Message must be between 1 and 1000 characters'),
    body('conversationHistory')
        .optional()
        .isArray()
        .withMessage('Conversation history must be an array'),
    body('context')
        .optional()
        .isString()
        .withMessage('Context must be a string')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { message, conversationHistory = [], context = '' } = req.body;

        // Check if Gemini API is configured
        if (!GEMINI_API_KEY) {
            return res.status(503).json({
                success: false,
                message: 'AI Chatbot service is temporarily unavailable',
                code: 'AI_SERVICE_UNAVAILABLE'
            });
        }

        // Get AI response from Google Gemini
        const aiResponse = await getGeminiResponse(message, conversationHistory, context);

        res.json({
            success: true,
            message: 'AI response generated successfully',
            data: {
                response: aiResponse,
                timestamp: new Date().toISOString(),
                model: 'gemini-pro'
            }
        });

    } catch (error) {
        console.error('AI Chatbot error:', error);
        
        // Provide fallback response if AI service fails
        const fallbackResponse = getFallbackResponse(req.body.message);
        
        res.status(200).json({
            success: true,
            message: 'AI response generated (fallback)',
            data: {
                response: fallbackResponse,
                timestamp: new Date().toISOString(),
                model: 'fallback',
                note: 'Using fallback response due to AI service unavailability'
            }
        });
    }
});

/**
 * @route   POST /api/ai-chatbot/quick-responses
 * @desc    Get quick response suggestions based on user query
 * @access  Public
 */
router.post('/quick-responses', [
    body('query')
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Query must be between 1 and 500 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { query } = req.body;
        const suggestions = getQuickResponseSuggestions(query);

        res.json({
            success: true,
            message: 'Quick response suggestions generated',
            data: {
                suggestions,
                query,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Quick responses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate quick responses',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/ai-chatbot/status
 * @desc    Get AI Chatbot service status
 * @access  Public
 */
router.get('/status', async (req, res) => {
    try {
        const isConfigured = !!GEMINI_API_KEY;
        let status = 'disabled';
        let details = 'AI Chatbot is not configured';

        if (isConfigured) {
            try {
                // Test API connection
                const testResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: 'Hello'
                            }]
                        }],
                        generationConfig: {
                            maxOutputTokens: 10,
                        }
                    })
                });

                if (testResponse.ok) {
                    status = 'operational';
                    details = 'AI Chatbot is operational and ready';
                } else {
                    status = 'error';
                    details = 'AI Chatbot API test failed';
                }
            } catch (testError) {
                status = 'error';
                details = 'AI Chatbot API connection failed';
            }
        }

        res.json({
            success: true,
            data: {
                status,
                details,
                configured: isConfigured,
                model: 'gemini-pro',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check AI Chatbot status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Get AI response from Google Gemini API
 * @param {string} userMessage - User's message
 * @param {Array} conversationHistory - Previous conversation messages
 * @param {string} context - Additional context
 * @returns {Promise<string>} AI response
 */
async function getGeminiResponse(userMessage, conversationHistory = [], context = '') {
    // Build system prompt with Lost & Found context
    const systemPrompt = `You are an AI assistant for a Lost & Found platform in India. Help users with:
- Reporting lost or found items
- Searching for items
- Understanding the reward system
- Platform navigation and features
- General support and guidance

Be helpful, friendly, and provide accurate information. Keep responses concise but informative.
${context ? `\nAdditional Context: ${context}` : ''}`;

    // Build conversation context
    let conversationContext = '';
    if (conversationHistory.length > 0) {
        conversationContext = '\n\nConversation History:\n' + 
            conversationHistory.slice(-5).map(msg => 
                `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
            ).join('\n');
    }

    const fullPrompt = `${systemPrompt}${conversationContext}\n\nUser: ${userMessage}`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: fullPrompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 500,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid response format from Gemini API');
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw error;
    }
}

/**
 * Get fallback response when AI service is unavailable
 * @param {string} userMessage - User's message
 * @returns {string} Fallback response
 */
function getFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('lost') && lowerMessage.includes('report')) {
        return "To report a lost item, go to the 'Report Lost Item' page, fill in the details including item description, location, date, and upload a photo if possible. This helps others identify your item.";
    } else if (lowerMessage.includes('found') && lowerMessage.includes('report')) {
        return "To report a found item, use the 'Report Found Item' page. Include details like where you found it, when, and upload a clear photo. This helps the owner identify their lost item.";
    } else if (lowerMessage.includes('search')) {
        return "You can search for items using the search bar on the homepage. Filter by location, item type, or use keywords. The platform also shows recent items and popular searches.";
    } else if (lowerMessage.includes('reward')) {
        return "The reward system encourages people to return lost items. When reporting a lost item, you can offer a reward. This motivates finders to actively look for and return your belongings.";
    } else if (lowerMessage.includes('contact') || lowerMessage.includes('support')) {
        return "For support, you can email us at info@lostandfound.com or call +91 1234567890. Our team is available to help with any questions or issues you may have.";
    } else if (lowerMessage.includes('login') || lowerMessage.includes('register')) {
        return "To access your account, use the login page. New users can register by providing their name, email, phone, and creating a password. This helps track your reported items.";
    } else if (lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('where')) {
        return "I'm here to help with any questions about our Lost & Found platform. You can ask about reporting items, searching, rewards, or general platform usage. How can I assist you today?";
    } else {
        return "I'm here to help with any questions about our Lost & Found platform. You can ask about reporting items, searching, rewards, or general platform usage. How can I assist you today?";
    }
}

/**
 * Get quick response suggestions based on user query
 * @param {string} query - User's query
 * @returns {Array} Array of quick response suggestions
 */
function getQuickResponseSuggestions(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('lost') || lowerQuery.includes('report')) {
        return [
            "How to report a lost item?",
            "What information do I need to report?",
            "Can I upload photos?",
            "How long does it take to process?"
        ];
    } else if (lowerQuery.includes('found') || lowerQuery.includes('return')) {
        return [
            "How to report a found item?",
            "What should I do with found items?",
            "How do I contact the owner?",
            "Is there a reward system?"
        ];
    } else if (lowerQuery.includes('search') || lowerQuery.includes('find')) {
        return [
            "How to search for items?",
            "Can I filter by location?",
            "How to get notifications?",
            "What search options are available?"
        ];
    } else if (lowerQuery.includes('reward') || lowerQuery.includes('payment')) {
        return [
            "How does the reward system work?",
            "What types of rewards can I offer?",
            "How are rewards distributed?",
            "Are rewards mandatory?"
        ];
    } else if (lowerQuery.includes('account') || lowerQuery.includes('profile')) {
        return [
            "How to update my profile?",
            "Can I change my contact information?",
            "How to manage notifications?",
            "How to delete my account?"
        ];
    } else {
        return [
            "How to report a lost item?",
            "How to report a found item?",
            "How to search for items?",
            "How does the reward system work?",
            "How to contact support?",
            "How to update my profile?"
        ];
    }
}

/**
 * @route   POST /api/ai-chatbot/feedback
 * @desc    Submit feedback about AI responses
 * @access  Private (authenticated users)
 */
router.post('/feedback', authenticateToken, [
    body('responseId')
        .notEmpty()
        .withMessage('Response ID is required'),
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    body('feedback')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Feedback cannot exceed 500 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { responseId, rating, feedback } = req.body;
        const userId = req.user.userId;

        // Here you would typically save feedback to database
        // For now, we'll just acknowledge it
        
        res.json({
            success: true,
            message: 'Feedback submitted successfully',
            data: {
                responseId,
                rating,
                feedback,
                userId,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Feedback submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
