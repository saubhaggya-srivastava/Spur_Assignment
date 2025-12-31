/**
 * Type definitions for the AI Chat system
 */

// Conversation types
export interface Conversation {
  id: string;
  created_at: Date;
  metadata?: Record<string, any>;
}

export interface CreateConversationDto {
  id: string;
  metadata?: Record<string, any>;
}

// Message types
export interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'ai';
  content: string;
  created_at: Date;
  token_count?: number;
}

export interface CreateMessageDto {
  id: string;
  conversation_id: string;
  sender: 'user' | 'ai';
  content: string;
  token_count?: number;
}

// API types
export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  truncated?: boolean;
}

export interface HistoryResponse {
  messages: Message[];
  sessionId: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
}
