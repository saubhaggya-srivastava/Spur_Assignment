import { database } from '../config/database';
import { Message, CreateMessageDto } from '../types/chat.types';

/**
 * MessageRepository
 * Handles database operations for messages
 */
export class MessageRepository {
  /**
   * Create a new message
   */
  async create(dto: CreateMessageDto): Promise<Message> {
    try {
      const query = `
        INSERT INTO messages (id, conversation_id, sender, content, created_at, token_count)
        VALUES ($1, $2, $3, $4, NOW(), $5)
        RETURNING id, conversation_id, sender, content, created_at, token_count
      `;

      const values = [
        dto.id,
        dto.conversation_id,
        dto.sender,
        dto.content,
        dto.token_count ?? null,
      ];

      const result = await database.query<Message>(query, values);

      if (result.rows.length === 0) {
        throw new Error('Failed to create message');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error creating message:', error);
      
      // Check for foreign key violation (conversation doesn't exist)
      if (error instanceof Error && error.message.includes('foreign key')) {
        throw new Error('Conversation does not exist');
      }
      
      throw new Error('Failed to create message in database');
    }
  }

  /**
   * Find all messages for a conversation, ordered by creation time
   */
  async findByConversationId(conversationId: string): Promise<Message[]> {
    try {
      const query = `
        SELECT id, conversation_id, sender, content, created_at, token_count
        FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at ASC
      `;

      const result = await database.query<Message>(query, [conversationId]);

      return result.rows;
    } catch (error) {
      console.error('Error finding messages:', error);
      throw new Error('Failed to retrieve messages from database');
    }
  }

  /**
   * Find the last N messages for a conversation
   */
  async findLastNMessages(conversationId: string, limit: number): Promise<Message[]> {
    try {
      const query = `
        SELECT id, conversation_id, sender, content, created_at, token_count
        FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;

      const result = await database.query<Message>(query, [conversationId, limit]);

      // Reverse to get chronological order
      return result.rows.reverse();
    } catch (error) {
      console.error('Error finding last N messages:', error);
      throw new Error('Failed to retrieve messages from database');
    }
  }

  /**
   * Count messages in a conversation
   */
  async countByConversationId(conversationId: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM messages
        WHERE conversation_id = $1
      `;

      const result = await database.query<{ count: string }>(query, [conversationId]);

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('Error counting messages:', error);
      throw new Error('Failed to count messages');
    }
  }

  /**
   * Delete all messages for a conversation
   */
  async deleteByConversationId(conversationId: string): Promise<number> {
    try {
      const query = `
        DELETE FROM messages
        WHERE conversation_id = $1
      `;

      const result = await database.query(query, [conversationId]);

      return result.rowCount ?? 0;
    } catch (error) {
      console.error('Error deleting messages:', error);
      throw new Error('Failed to delete messages from database');
    }
  }
}

// Export singleton instance
export const messageRepository = new MessageRepository();
