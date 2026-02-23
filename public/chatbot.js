// Water Blob® AI Chatbot Widget
// Intelligent customer support powered by AI

(function() {
    'use strict';

    // Configuration
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://waterblob-store.onrender.com';

    let chatOpen = false;
    let conversationHistory = [];
    let chatId = null;

    // Check if localStorage is available
    function isLocalStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Generate unique chat session ID (persistent per user)
    function generateChatId() {
        return `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get or create persistent chat ID for this user
    function getUserChatId() {
        if (!isLocalStorageAvailable()) {
            console.warn('localStorage unavailable, chat will not persist across sessions');
            return generateChatId();
        }

        try {
            let storedChatId = localStorage.getItem('waterblob-chatbot-id');
            if (!storedChatId) {
                storedChatId = generateChatId();
                localStorage.setItem('waterblob-chatbot-id', storedChatId);
            }
            return storedChatId;
        } catch (e) {
            console.error('Error accessing localStorage for chatbot:', e);
            return generateChatId();
        }
    }

    // Create chat widget HTML
    function createChatWidget() {
        const chatHTML = `
            <!-- Chat Button -->
            <button id="chatbot-toggle" class="chatbot-toggle" aria-label="Open chat">
                <svg class="chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                <span class="chat-badge">AI</span>
            </button>

            <!-- Chat Window -->
            <div id="chatbot-window" class="chatbot-window">
                <div class="chatbot-header">
                    <div class="chatbot-header-info">
                        <div class="chatbot-avatar">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                        </div>
                        <div>
                            <div class="chatbot-title">Water Blob® Assistant</div>
                            <div class="chatbot-status">
                                <span class="status-dot"></span>
                                Online
                            </div>
                        </div>
                    </div>
                    <button class="chatbot-minimize" onclick="window.toggleChatbot()" aria-label="Minimize chat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                    </button>
                </div>

                <div id="chatbot-messages" class="chatbot-messages">
                    <div class="chat-message bot-message">
                        <div class="message-avatar">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                        </div>
                        <div class="message-content">
                            <div class="message-text">
                                👋 Hi! I'm your Water Blob® AI assistant. I can help you with:
                                <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                                    <li>Choosing the right blob size</li>
                                    <li>Safety guidelines</li>
                                    <li>Setup & installation</li>
                                    <li>Pricing & ordering</li>
                                    <li>Shipping information</li>
                                </ul>
                                What can I help you with today?
                            </div>
                        </div>
                    </div>
                </div>

                <div class="chatbot-input-container">
                    <div class="quick-questions" id="quick-questions">
                        <button class="quick-question" onclick="window.sendQuickQuestion('What size blob do I need for my camp?')">
                            What size blob do I need?
                        </button>
                        <button class="quick-question" onclick="window.sendQuickQuestion('How much does shipping cost?')">
                            Shipping cost?
                        </button>
                        <button class="quick-question" onclick="window.sendQuickQuestion('How can I contact you?')">
                            Contact info
                        </button>
                    </div>
                    <form id="chatbot-form" class="chatbot-input-form">
                        <input
                            type="text"
                            id="chatbot-input"
                            class="chatbot-input"
                            placeholder="Ask me anything..."
                            autocomplete="off"
                        />
                        <button type="submit" class="chatbot-send-btn" aria-label="Send message">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"/>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                        </button>
                    </form>
                    <div class="chatbot-footer">
                        Powered by AI • <a href="faq.html" target="_blank">FAQ</a> • <a href="contact.html" target="_blank">Contact</a>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    // Toggle chatbot open/close
    window.toggleChatbot = function() {
        chatOpen = !chatOpen;
        const toggle = document.getElementById('chatbot-toggle');
        const window_elem = document.getElementById('chatbot-window');

        if (chatOpen) {
            toggle.classList.add('open');
            window_elem.classList.add('open');
            document.getElementById('chatbot-input').focus();

            // Hide quick questions after first message
            if (conversationHistory.length > 0) {
                document.getElementById('quick-questions').style.display = 'none';
            }
        } else {
            toggle.classList.remove('open');
            window_elem.classList.remove('open');
        }
    };

    // Send quick question
    window.sendQuickQuestion = function(question) {
        document.getElementById('chatbot-input').value = question;
        document.getElementById('chatbot-form').dispatchEvent(new Event('submit'));
    };

    // Add message to chat
    function addMessage(text, isBot = false, isLoading = false) {
        const messagesContainer = document.getElementById('chatbot-messages');

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isBot ? 'bot-message' : 'user-message'}`;

        if (isLoading) {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                </div>
                <div class="message-content">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                ${isBot ? `
                    <div class="message-avatar">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                    </div>
                ` : ''}
                <div class="message-content">
                    <div class="message-text">${text}</div>
                </div>
            `;
        }

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        return messageDiv;
    }

    // Send message to backend
    async function sendMessage(message) {
        if (!message.trim()) return;

        // Hide quick questions after first message
        document.getElementById('quick-questions').style.display = 'none';

        // Add user message
        addMessage(message, false);
        conversationHistory.push({ role: 'user', content: message });

        // Show typing indicator
        const loadingMessage = addMessage('', true, true);

        try {
            const response = await fetch(`${API_BASE}/api/chatbot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    chatId: chatId,
                    conversationHistory: conversationHistory
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            // Remove loading indicator
            loadingMessage.remove();

            // Add bot response
            addMessage(data.reply, true);
            conversationHistory.push({ role: 'assistant', content: data.reply });

        } catch (error) {
            console.error('Chat error:', error);
            loadingMessage.remove();
            addMessage("I'm having trouble connecting right now. Please try again or contact us directly at (417) 864-8461 or lorie@thewaterblob.com", true);
        }
    }

    // Initialize chatbot
    function init() {
        // Get persistent chat ID for this user
        chatId = getUserChatId();

        // Create widget
        createChatWidget();

        // Add event listeners
        document.getElementById('chatbot-toggle').addEventListener('click', window.toggleChatbot);

        document.getElementById('chatbot-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const input = document.getElementById('chatbot-input');
            const message = input.value.trim();
            if (message) {
                sendMessage(message);
                input.value = '';
            }
        });

        // Load conversation from localStorage and restore messages to DOM
        if (isLocalStorageAvailable()) {
            try {
                const savedChat = localStorage.getItem(`chat-${chatId}`);
                if (savedChat) {
                    conversationHistory = JSON.parse(savedChat);

                    // Restore previous messages to the chat UI
                    conversationHistory.forEach(msg => {
                        if (msg.role === 'user') {
                            addMessage(msg.content, false);
                        } else if (msg.role === 'assistant') {
                            addMessage(msg.content, true);
                        }
                    });
                }
            } catch (e) {
                console.error('Error loading chat history:', e);
            }
        }

        // Save conversation on page unload
        window.addEventListener('beforeunload', function() {
            if (conversationHistory.length > 0 && isLocalStorageAvailable()) {
                try {
                    localStorage.setItem(`chat-${chatId}`, JSON.stringify(conversationHistory));
                } catch (e) {
                    console.error('Error saving chat history:', e);
                }
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
