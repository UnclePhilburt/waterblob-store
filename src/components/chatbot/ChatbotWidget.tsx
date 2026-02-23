'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import './chatbot.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function getChatId(): string {
  try {
    let id = localStorage.getItem('waterblob-chatbot-id');
    if (!id) {
      id = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('waterblob-chatbot-id', id);
    }
    return id;
  } catch {
    return `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

const BotAvatar = () => (
  <div className="message-avatar">
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
    </svg>
  </div>
);

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatIdRef = useRef<string>('');

  // Load persisted conversation on mount
  useEffect(() => {
    chatIdRef.current = getChatId();
    try {
      const saved = localStorage.getItem(`chat-${chatIdRef.current}`);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        setMessages(parsed);
        if (parsed.length > 0) setShowQuickQuestions(false);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save conversation before unload
  useEffect(() => {
    const handler = () => {
      if (messages.length > 0) {
        try {
          localStorage.setItem(`chat-${chatIdRef.current}`, JSON.stringify(messages));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setShowQuickQuestions(false);

      const userMsg: Message = { role: 'user', content: text };
      const next = [...messages, userMsg];
      setMessages(next);
      setInput('');
      setLoading(true);

      try {
        const res = await fetch('/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            chatId: chatIdRef.current,
            conversationHistory: next,
          }),
        });

        if (!res.ok) throw new Error('Failed to get response');
        const data = await res.json();
        const botMsg: Message = { role: 'assistant', content: data.reply };
        setMessages((prev) => [...prev, botMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              "I'm having trouble connecting right now. Please try again or contact us directly at (417) 864-8461 or lorie@thewaterblob.com",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages]
  );

  return (
    <>
      {/* Toggle button */}
      <button
        className={`chatbot-toggle${open ? ' open' : ''}`}
        aria-label="Open chat"
        onClick={() => setOpen(!open)}
      >
        <svg className="chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <svg className="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        <span className="chat-badge">AI</span>
      </button>

      {/* Chat window */}
      <div className={`chatbot-window${open ? ' open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </div>
            <div>
              <div className="chatbot-title">Water Blob® Assistant</div>
              <div className="chatbot-status">
                <span className="status-dot" />
                Online
              </div>
            </div>
          </div>
          <button className="chatbot-minimize" onClick={() => setOpen(false)} aria-label="Minimize chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        <div className="chatbot-messages">
          {/* Welcome message */}
          <div className="chat-message bot-message">
            <BotAvatar />
            <div className="message-content">
              <div className="message-text">
                👋 Hi! I&apos;m your Water Blob® AI assistant. I can help you with:
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>Choosing the right blob size</li>
                  <li>Safety guidelines</li>
                  <li>Setup &amp; installation</li>
                  <li>Pricing &amp; ordering</li>
                  <li>Shipping information</li>
                </ul>
                What can I help you with today?
              </div>
            </div>
          </div>

          {/* Conversation */}
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role === 'assistant' ? 'bot-message' : 'user-message'}`}>
              {msg.role === 'assistant' && <BotAvatar />}
              <div className="message-content">
                <div className="message-text">{msg.content}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-message bot-message">
              <BotAvatar />
              <div className="message-content">
                <div className="typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-input-container">
          {showQuickQuestions && (
            <div className="quick-questions">
              <button className="quick-question" onClick={() => sendMessage('What size blob do I need for my camp?')}>
                What size blob do I need?
              </button>
              <button className="quick-question" onClick={() => sendMessage('How much does shipping cost?')}>
                Shipping cost?
              </button>
              <button className="quick-question" onClick={() => sendMessage('How can I contact you?')}>
                Contact info
              </button>
            </div>
          )}
          <form
            className="chatbot-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              type="text"
              className="chatbot-input"
              placeholder="Ask me anything..."
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="chatbot-send-btn" aria-label="Send message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
          <div className="chatbot-footer">
            Powered by AI &bull; <a href="/faq">FAQ</a> &bull; <a href="/contact">Contact</a>
          </div>
        </div>
      </div>
    </>
  );
}
