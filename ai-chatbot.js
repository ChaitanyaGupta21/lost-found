// AI Chatbot Assistant with Google Gemini API Integration
class AIChatbot {
    constructor() {
        this.isOpen = false;
        this.isMinimized = false;
        this.conversationHistory = [];
        this.isTyping = false;
        
        // Google Gemini API Configuration
        this.GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Replace with your actual API key
        this.GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        
        this.initializeChatbot();
        this.bindEvents();
    }

    initializeChatbot() {
        this.chatbotWidget = document.getElementById('chatbotWidget');
        this.chatbotToggle = document.getElementById('chatbotToggle');
        this.chatbotBody = document.getElementById('chatbotBody');
        this.chatbotHeader = document.getElementById('chatbotHeader');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.minimizeBtn = document.getElementById('minimizeBtn');
        this.closeBtn = document.getElementById('closeBtn');
        
        // Set initial state
        this.chatbotWidget.classList.add('hidden');
    }

    bindEvents() {
        // Toggle chatbot
        this.chatbotToggle.addEventListener('click', () => this.toggleChatbot());
        
        // Minimize chatbot
        this.minimizeBtn.addEventListener('click', () => this.minimizeChatbot());
        
        // Close chatbot
        this.closeBtn.addEventListener('click', () => this.closeChatbot());
        
        // Send message on Enter key
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Send message on button click
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Quick response buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-response-btn')) {
                const query = e.target.getAttribute('data-query');
                this.chatInput.value = query;
                this.sendMessage();
            }
        });

        // Make header draggable
        this.makeHeaderDraggable();
        
        // Auto-show chatbot after 5 seconds
        setTimeout(() => {
            this.showChatbot();
        }, 5000);
    }

    toggleChatbot() {
        if (this.isOpen) {
            this.closeChatbot();
        } else {
            this.openChatbot();
        }
    }

    openChatbot() {
        this.isOpen = true;
        this.isMinimized = false;
        this.chatbotWidget.classList.remove('hidden', 'minimized');
        this.chatInput.focus();
    }

    closeChatbot() {
        this.isOpen = false;
        this.chatbotWidget.classList.add('hidden');
    }

    minimizeChatbot() {
        this.isMinimized = true;
        this.chatbotWidget.classList.add('minimized');
    }

    showChatbot() {
        this.chatbotWidget.classList.remove('hidden');
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isTyping) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.chatInput.value = '';
        this.sendBtn.disabled = true;

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Get AI response from Google Gemini
            const response = await this.getGeminiResponse(message);
            this.addMessage(response, 'bot');
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.addMessage('Sorry, I encountered an error. Please try again or contact support.', 'bot');
        }

        // Hide typing indicator and re-enable send button
        this.hideTypingIndicator();
        this.sendBtn.disabled = false;
    }

    async getGeminiResponse(userMessage) {
        // Add context about the Lost & Found platform
        const systemPrompt = `You are an AI assistant for a Lost & Found platform in India. Help users with:
        - Reporting lost or found items
        - Searching for items
        - Understanding the reward system
        - Platform navigation and features
        - General support and guidance
        
        Be helpful, friendly, and provide accurate information. Keep responses concise but informative.`;
        
        const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage}`;

        try {
            const response = await fetch(`${this.GEMINI_API_URL}?key=${this.GEMINI_API_KEY}`, {
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
            
            // Fallback responses for common queries
            return this.getFallbackResponse(userMessage);
        }
    }

    getFallbackResponse(userMessage) {
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
        } else {
            return "I'm here to help with any questions about our Lost & Found platform. You can ask about reporting items, searching, rewards, or general platform usage. How can I assist you today?";
        }
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <i class="fas fa-${sender === 'bot' ? 'robot' : 'user'}"></i>
                <div>
                    <p>${this.formatMessage(content)}</p>
                </div>
            </div>
            <div class="message-time">${currentTime}</div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        // Add to conversation history
        this.conversationHistory.push({ sender, content, timestamp: new Date() });
    }

    formatMessage(content) {
        // Convert line breaks to <br> tags and escape HTML
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = `
            <i class="fas fa-robot"></i>
            <div class="typing-dots">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
        
        this.chatMessages.appendChild(typingDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = this.chatMessages.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    makeHeaderDraggable() {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        this.chatbotHeader.addEventListener('mousedown', (e) => {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;

                this.chatbotWidget.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AIChatbot();
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIChatbot;
}
