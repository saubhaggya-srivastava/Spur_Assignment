import { v4 as uuidv4 } from 'uuid';
import { conversationRepository } from '../repositories/conversation.repository';

/**
 * SessionService
 * Manages conversation session lifecycle
 */
export class SessionService {
  /**
   * Create a new session (conversation)
   * Generates a UUID and creates a conversation record in the database
   */
  async createSession(): Promise<string> {
    try {
      // Generate unique session ID
      const sessionId = uuidv4();

      // Create conversation record in database
      await conversationRepository.create({
        id: sessionId,
        metadata: {
          created_by: 'system',
          source: 'web_chat',
        },
      });

      console.log(`✅ New session created: ${sessionId}`);

      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create new session');
    }
  }

  /**
   * Check if a session exists
   * Validates that the session ID corresponds to an existing conversation
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    try {
      // Validate UUID format
      if (!this.isValidUUID(sessionId)) {
        return false;
      }

      // Check if conversation exists in database
      return await conversationRepository.exists(sessionId);
    } catch (error) {
      console.error('Error checking session existence:', error);
      throw new Error('Failed to validate session');
    }
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Get or create session
   * If sessionId is provided and valid, return it; otherwise create new session
   */
  async getOrCreateSession(sessionId?: string): Promise<string> {
    try {
      // If no sessionId provided, create new session
      if (!sessionId) {
        return await this.createSession();
      }

      // If sessionId provided, validate it exists
      const exists = await this.sessionExists(sessionId);

      if (exists) {
        return sessionId;
      }

      // If session doesn't exist, create new one
      console.warn(`Session ${sessionId} not found, creating new session`);
      return await this.createSession();
    } catch (error) {
      console.error('Error in getOrCreateSession:', error);
      throw new Error('Failed to get or create session');
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService();
