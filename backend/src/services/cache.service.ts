import { redisClient } from '../config/redis';
import { Message } from '../types/chat.types';

/**
 * CacheService
 * Handles Redis caching operations with graceful fallback
 */
export class CacheService {
  private readonly TTL = 3600; // 1 hour in seconds
  private readonly KEY_PREFIX = 'conv:';

  /**
   * Get conversation history from cache
   * Returns null if not found or Redis unavailable
   */
  async getConversationHistory(sessionId: string): Promise<Message[] | null> {
    if (!redisClient.isAvailable()) {
      return null; // Cache miss, fallback to database
    }

    try {
      const client = redisClient.getClient();
      if (!client) {
        return null;
      }

      const key = this.getKey(sessionId);
      const data = await client.get(key);

      if (!data) {
        return null; // Cache miss
      }

      const messages = JSON.parse(data) as Message[];
      
      // Convert created_at strings back to Date objects
      return messages.map(msg => ({
        ...msg,
        created_at: new Date(msg.created_at),
      }));
    } catch (error) {
      console.error('Error getting conversation from cache:', error);
      return null; // Fallback to database on error
    }
  }

  /**
   * Set conversation history in cache with TTL
   */
  async setConversationHistory(sessionId: string, messages: Message[]): Promise<void> {
    if (!redisClient.isAvailable()) {
      return; // Skip caching if Redis unavailable
    }

    try {
      const client = redisClient.getClient();
      if (!client) {
        return;
      }

      const key = this.getKey(sessionId);
      const data = JSON.stringify(messages);

      await client.setex(key, this.TTL, data);
    } catch (error) {
      console.error('Error setting conversation in cache:', error);
      // Don't throw - caching is optional
    }
  }

  /**
   * Invalidate (delete) conversation cache
   */
  async invalidateConversation(sessionId: string): Promise<void> {
    if (!redisClient.isAvailable()) {
      return;
    }

    try {
      const client = redisClient.getClient();
      if (!client) {
        return;
      }

      const key = this.getKey(sessionId);
      await client.del(key);
    } catch (error) {
      console.error('Error invalidating conversation cache:', error);
      // Don't throw - caching is optional
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return redisClient.isAvailable();
  }

  /**
   * Get cache key for a session
   */
  private getKey(sessionId: string): string {
    return `${this.KEY_PREFIX}${sessionId}`;
  }

  /**
   * Clear all cache entries (use with caution)
   */
  async clearAll(): Promise<void> {
    if (!redisClient.isAvailable()) {
      return;
    }

    try {
      const client = redisClient.getClient();
      if (!client) {
        return;
      }

      const keys = await client.keys(`${this.KEY_PREFIX}*`);
      
      if (keys.length > 0) {
        await client.del(...keys);
        console.log(`Cleared ${keys.length} cache entries`);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ available: boolean; keyCount: number }> {
    if (!redisClient.isAvailable()) {
      return { available: false, keyCount: 0 };
    }

    try {
      const client = redisClient.getClient();
      if (!client) {
        return { available: false, keyCount: 0 };
      }

      const keys = await client.keys(`${this.KEY_PREFIX}*`);
      
      return {
        available: true,
        keyCount: keys.length,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { available: false, keyCount: 0 };
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
