/**
 * Frontend type definitions for AI Chat
 */

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  truncated?: boolean;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface HistoryResponse {
  messages: Message[];
  sessionId: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
}
