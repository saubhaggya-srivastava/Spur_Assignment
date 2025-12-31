import { useState, useEffect } from 'react';
import { Message } from '../types/chat.types';
import { sendMessage, getHistory } from '../services/chatApi';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import './ChatWidget.css';

const SESSION_STORAGE_KEY = 'chat_session_id';

export function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Load sessionId from localStorage on mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (storedSessionId) {
      setSessionId(storedSessionId);
      loadHistory(storedSessionId);
    }
  }, []);

  // Load conversation history
  const loadHistory = async (sid: string) => {
    try {
      setIsLoading(true);
      const history = await getHistory(sid);
      setMessages(history);
      setError(null);
    } catch (err) {
      console.error('Failed to load history:', err);
      // Don't show error for empty history
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (message: string) => {
    try {
      setError(null);
      setIsTyping(true);

      // Add user message to UI immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        sender: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send message to backend
      const response = await sendMessage(message, sessionId || undefined);

      // Store sessionId in localStorage
      if (response.sessionId !== sessionId) {
        setSessionId(response.sessionId);
        localStorage.setItem(SESSION_STORAGE_KEY, response.sessionId);
      }

      // Add AI response to UI
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        content: response.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Show truncation warning if applicable
      if (response.truncated) {
        setError('Your message was truncated to 2000 characters.');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Error sending message:', err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chat-widget">
      <div className="chat-header">
        <div className="chat-header-content">
          <h2>🤖 TechStore Support</h2>
          <p>AI-powered customer support</p>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} aria-label="Close error">
            ×
          </button>
        </div>
      )}

      <MessageList messages={messages} isTyping={isTyping} />

      <MessageInput onSendMessage={handleSendMessage} disabled={isLoading || isTyping} />
    </div>
  );
}
