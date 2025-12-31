import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { database } from './config/database';
import { redisClient } from './config/redis';
import { llmService } from './services/llm-gemini.service';
import chatRoutes from './routes/chat.routes';
import { errorHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

/**
 * Initialize Express application
 */
const app: Express = express();
const PORT = process.env.PORT || 3000;

/**
 * Middleware setup
 */

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

// JSON body parser
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

/**
 * Health check endpoint
 */
app.get('/health', async (req: Request, res: Response) => {
  const dbHealthy = database.isHealthy();
  const redisHealthy = redisClient.isAvailable();

  const health = {
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'connected' : 'disconnected',
      redis: redisHealthy ? 'connected' : 'disconnected (optional)',
      llm: 'configured',
    },
  };

  const statusCode = dbHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * API Routes
 */
app.use('/chat', chatRoutes);

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    code: 'NOT_FOUND',
    path: req.path,
  });
});

/**
 * Global error handler (must be last)
 */
app.use(errorHandler);

/**
 * Initialize services and start server
 */
async function startServer() {
  try {
    console.log('🚀 Starting AI Chat Backend...\n');

    // Initialize database
    console.log('📊 Initializing database...');
    database.initialize();
    const dbConnected = await database.testConnection();
    
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Initialize Redis (optional)
    console.log('\n💾 Initializing Redis cache...');
    redisClient.initialize();
    const redisConnected = await redisClient.testConnection();
    
    if (redisConnected) {
      console.log('✅ Redis cache is available');
    } else {
      console.log('⚠️  Redis cache is not available (continuing without cache)');
    }

    // Initialize LLM service
    console.log('\n🤖 Initializing LLM service...');
    llmService.initialize();

    // Start Express server
    app.listen(PORT, () => {
      console.log('\n✅ Server is running!');
      console.log(`   URL: http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('\n📡 Ready to accept requests\n');
    });
  } catch (error) {
    console.error('\n❌ Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
  await database.close();
  await redisClient.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...');
  await database.close();
  await redisClient.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;
