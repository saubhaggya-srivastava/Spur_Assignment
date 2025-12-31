import { Pool, PoolClient, QueryResult } from 'pg';

/**
 * Database Configuration and Connection Pool
 * Provides a singleton PostgreSQL connection pool with error handling
 */

class Database {
  private pool: Pool | null = null;
  private isConnected: boolean = false;

  /**
   * Initialize the database connection pool
   */
  public initialize(): void {
    if (this.pool) {
      return; // Already initialized
    }

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL environment variable is not set. Please configure your .env file.'
      );
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Timeout after 10 seconds if connection cannot be established
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false, // Required for hosted PostgreSQL (Render, Heroku, etc.)
      } : undefined,
    });

    // Handle pool errors
    this.pool.on('error', (err: Error) => {
      console.error('Unexpected database pool error:', err);
      this.isConnected = false;
    });

    // Handle pool connection
    this.pool.on('connect', () => {
      this.isConnected = true;
    });

    console.log('✅ Database connection pool initialized');
  }

  /**
   * Get the database pool instance
   */
  public getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  /**
   * Execute a query with automatic error handling
   */
  public async query(
    text: string,
    params?: any[]
  ): Promise<QueryResult> {
    const pool = this.getPool();

    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Database operation failed');
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  public async getClient(): Promise<PoolClient> {
    const pool = this.getPool();
    try {
      return await pool.connect();
    } catch (error) {
      console.error('Failed to get database client:', error);
      throw new Error('Unable to connect to database');
    }
  }

  /**
   * Test database connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      console.log('✅ Database connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Close all database connections
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('Database connection pool closed');
    }
  }

  /**
   * Check if database is connected
   */
  public isHealthy(): boolean {
    return this.isConnected && this.pool !== null;
  }
}

// Export singleton instance
export const database = new Database();

// Export types for use in repositories
export type { Pool, PoolClient, QueryResult };
