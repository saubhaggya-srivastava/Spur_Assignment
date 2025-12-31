import axios, { AxiosError } from 'axios';
import { ChatRequest, ChatResponse, HistoryResponse, Message } from '../types/chat.types';

/**
 * Chat API Service
 * Handles all API calls to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

/**
 * Send a message and get AI response
 */
export async function sendMessage(
  message: string,
  sessionId?: string
): Promise<ChatResponse> {
  try {
    const request: ChatRequest = {
      message,
      sessionId,
    };

    const response = await api.post<ChatResponse>('/chat/message', request);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Get conversation history for a session
 */
export async function getHistory(sessionId: string): Promise<Message[]> {
  try {
    const response = await api.get<HistoryResponse>(`/chat/history/${sessionId}`);
    
    // Convert timestamp strings to Date objects
    const messages = response.data.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
    
    return messages;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Handle API errors and return user-friendly messages
 */
function handleApiError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; code?: string }>;
    
    // Server returned an error response
    if (axiosError.response) {
      const errorMessage = axiosError.response.data?.error || 'An error occurred';
      return new Error(errorMessage);
    }
    
    // Network error (no response)
    if (axiosError.request) {
      return new Error('Unable to connect to server. Please check your connection.');
    }
  }
  
  // Generic error
  return new Error('An unexpected error occurred. Please try again.');
}
