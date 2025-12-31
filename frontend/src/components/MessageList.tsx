import { useEffect, useRef } from 'react';
import { Message as MessageType } from '../types/chat.types';
import { Message } from './Message';
import './MessageList.css';

interface MessageListProps {
  messages: MessageType[];
  isTyping: boolean;
}

export function MessageList({ messages, isTyping }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="message-list">
      {messages.length === 0 && (
        <div className="empty-state">
          <h3>👋 Welcome to TechStore Support</h3>
          <p>Ask me anything about our products, shipping, returns, or policies!</p>
        </div>
      )}
      
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      
      {isTyping && (
        <div className="typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <span className="typing-text">AI is typing...</span>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
