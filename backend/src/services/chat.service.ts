import { v4 as uuidv4 } from 'uuid';
import { sessionService } from './session.service';
import { llmService } from './llm-gemini.service';
import { cacheService } from './cache.service';
import { messageRepository } from '../repositories/message.repository';
import { ChatResponse, Message } from '../types/chat.types';

/**
 * ChatService
 * Orchestrates the conversation flow by coordinating between
 * repositories, cache, and LLM service
 */
export class ChatService {
  private readonly MAX_MESSAGE_LENGTH = 2000;

  /**
   * Send a message and get AI response
   * Coordinates: validation, session management, persistence, caching, and LLM
   */
  async sendMessage(message: string, sessionId?: string): Promise<ChatResponse> {
    try {
      // 1. Validate input
      const validationResult = this.validateMessage(message);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error || 'Invalid message');
      }

      // 2. Truncate if necessary
      let processedMessage = message;
      let truncated = false;

      if (message.length > this.MAX_MESSAGE_LENGTH) {
        processedMessage = message.substring(0, this.MAX_MESSAGE_LENGTH);
        truncated = true;
        console.warn(`Message truncated from ${message.length} to ${this.MAX_MESSAGE_LENGTH} characters`);
      }

      // 3. Get or create session
      const activeSessionId = await sessionService.getOrCreateSession(sessionId);

      // 4. Persist user message
      const userMessageId = uuidv4();
      await messageRepository.create({
        id: userMessageId,
        conversation_id: activeSessionId,
        sender: 'user',
        content: processedMessage,
      });

      // 5. Fetch conversation history (check cache first)
      let history = await cacheService.getConversationHistory(activeSessionId);

      if (!history) {
        // Cache miss - fetch from database
        history = await messageRepository.findByConversationId(activeSessionId);
        
        // Cache the result
        await cacheService.setConversationHistory(activeSessionId, history);
      }

      // 6. Generate AI response using LLM
      const aiReply = await llmService.generateReply(history, processedMessage);

      // 7. Persist AI response
      const aiMessageId = uuidv4();
      await messageRepository.create({
        id: aiMessageId,
        conversation_id: activeSessionId,
        sender: 'ai',
        content: aiReply,
      });

      // 8. Update cache with new messages
      const updatedHistory = await messageRepository.findByConversationId(activeSessionId);
      await cacheService.setConversationHistory(activeSessionId, updatedHistory);

      // 9. Return response
      return {
        reply: aiReply,
        sessionId: activeSessionId,
        truncated: truncated || undefined,
      };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a session
   */
  async getHistory(sessionId: string): Promise<Message[]> {
    try {
      // Validate session ID format
      if (!sessionId || sessionId.trim() === '') {
        throw new Error('Session ID is required');
      }

      // Check cache first
      let history = await cacheService.getConversationHistory(sessionId);

      if (history) {
        console.log(`Cache hit for session: ${sessionId}`);
        return history;
      }

      // Cache miss - fetch from database
      console.log(`Cache miss for session: ${sessionId}`);
      history = await messageRepository.findByConversationId(sessionId);

      // Cache the result if messages exist
      if (history.length > 0) {
        await cacheService.setConversationHistory(sessionId, history);
      }

      return history;
    } catch (error) {
      console.error('Error in getHistory:', error);
      throw new Error('Failed to retrieve conversation history');
    }
  }

  /**
   * Validate message input
   */
  private validateMessage(message: string): { isValid: boolean; error?: string } {
    // Check if message is empty or only whitespace
    if (!message || message.trim() === '') {
      return {
        isValid: false,
        error: 'Message cannot be empty',
      };
    }

    return { isValid: true };
  }

  /**
   * Clear conversation cache (useful for testing)
   */
  async clearCache(sessionId: string): Promise<void> {
    await cacheService.invalidateConversation(sessionId);
  }
}

// Export singleton instance
export const chatService = new ChatService();
