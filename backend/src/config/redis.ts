import Redis from 'ioredis';

/**
 * Redis Configuration and Connection
 * Provides a singleton Redis client with graceful error handling
 */

class RedisClient {
  private client: Redis | null = null;
  private available: boolean = false;

  /**
   * Initialize Redis connection
   */
  public initialize(): void {
    if (this.client) {
      return; // Already initialized
    }

    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn('⚠️  REDIS_URL not set. Redis caching will be disabled.');
      console.warn('   The application will continue using database queries only.');
      this.available = false;
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.error('❌ Redis connection failed after 3 retries');
            this.available = false;
            return null; // Stop retrying
          }
          const delay = Math.min(times * 200, 2000);
          return delay;
        },
        reconnectOnError: (err: Error) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true; // Reconnect on READONLY error
          }
          return false;
        },
      });

      // Handle connection events
      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.available = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis ready');
        this.available = true;
      });

      this.client.on('error', (err: Error) => {
        console.error('❌ Redis error:', err.message);
        this.available = false;
      });

      this.client.on('close', () => {
        console.warn('⚠️  Redis connection closed');
        this.available = false;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
      });

    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error);
      this.available = false;
      this.client = null;
    }
  }

  /**
   * Get Redis client instance
   */
  public getClient(): Redis | null {
    return this.client;
  }

  /**
   * Check if Redis is available
   */
  public isAvailable(): boolean {
    return this.available && this.client !== null;
  }

  /**
   * Test Redis connection
   */
  public async testConnection(): Promise<boolean> {
    if (!this.client || !this.available) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis connection test failed:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  public async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.available = false;
      console.log('Redis connection closed');
    }
  }

  /**
   * Gracefully handle Redis operations with fallback
   */
  public async safeExecute<T>(
    operation: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    if (!this.isAvailable()) {
      return fallback;
    }

    try {
      return await operation();
    } catch (error) {
      console.error('Redis operation failed, using fallback:', error);
      this.available = false;
      return fallback;
    }
  }
}

// Export singleton instance
export const redisClient = new RedisClient();
