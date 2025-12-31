import { database } from '../config/database';
import { Conversation, CreateConversationDto } from '../types/chat.types';

/**
 * ConversationRepository
 * Handles database operations for conversations
 */
export class ConversationRepository {
  /**
   * Create a new conversation
   */
  async create(dto: CreateConversationDto): Promise<Conversation> {
    try {
      const query = `
        INSERT INTO conversations (id, created_at, metadata)
        VALUES ($1, NOW(), $2)
        RETURNING id, created_at, metadata
      `;

      const values = [dto.id, dto.metadata ? JSON.stringify(dto.metadata) : null];

      const result = await database.query<Conversation>(query, values);

      if (result.rows.length === 0) {
        throw new Error('Failed to create conversation');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation in database');
    }
  }

  /**
   * Find a conversation by ID
   */
  async findById(id: string): Promise<Conversation | null> {
    try {
      const query = `
        SELECT id, created_at, metadata
        FROM conversations
        WHERE id = $1
      `;

      const result = await database.query<Conversation>(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error finding conversation:', error);
      throw new Error('Failed to retrieve conversation from database');
    }
  }

  /**
   * Check if a conversation exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1 FROM conversations WHERE id = $1
        ) as exists
      `;

      const result = await database.query<{ exists: boolean }>(query, [id]);

      return result.rows[0].exists;
    } catch (error) {
      console.error('Error checking conversation existence:', error);
      throw new Error('Failed to check conversation existence');
    }
  }

  /**
   * Delete a conversation (cascade deletes messages)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM conversations
        WHERE id = $1
      `;

      const result = await database.query(query, [id]);

      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Failed to delete conversation from database');
    }
  }
}

// Export singleton instance
export const conversationRepository = new ConversationRepository();
