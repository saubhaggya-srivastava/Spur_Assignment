# AI Live Chat Agent

An AI-powered customer support chat system built with React, Node.js, PostgreSQL, Redis, and Google Gemini. This application demonstrates a production-ready architecture for building intelligent chat interfaces with conversation persistence, caching, and graceful error handling.

## 🎯 Features

- **Real-time AI Chat**: Powered by Google Gemini 2.5 Flash
- **Conversation Persistence**: PostgreSQL database stores all messages
- **Smart Caching**: Redis caching for improved performance
- **Session Management**: Conversations persist across page reloads
- **Graceful Degradation**: System continues working even if Redis is unavailable
- **Input Validation**: Comprehensive validation and error handling
- **Responsive UI**: Clean, modern chat interface
- **FAQ Knowledge**: Pre-configured with store policies (shipping, returns, support hours, payment)

## 🏗️ Architecture Overview

```
┌─────────────────┐
│  React Frontend │  (Port 5173)
│   TypeScript    │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────────────────────────────┐
│         Express Backend (Port 3000)     │
│  ┌─────────────────────────────────┐   │
│  │      API Layer (Routes)         │   │
│  └──────────────┬──────────────────┘   │
│                 ▼                       │
│  ┌─────────────────────────────────┐   │
│  │      Service Layer              │   │
│  │  • ChatService                  │   │
│  │  • LLMService (OpenAI)          │   │
│  │  • SessionService               │   │
│  │  • CacheService (Redis)         │   │
│  └──────────────┬──────────────────┘   │
│                 ▼                       │
│  ┌─────────────────────────────────┐   │
│  │   Data Access Layer             │   │
│  │  • ConversationRepository       │   │
│  │  • MessageRepository            │   │
│  └─────────────────────────────────┘   │
└─────────┬───────────────────┬───────────┘
          │                   │
          ▼                   ▼
    ┌──────────┐        ┌─────────┐
    │PostgreSQL│        │  Redis  │
    │ Database │        │  Cache  │
    └──────────┘        └─────────┘
```

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- **Redis** 7+ (optional but recommended)
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

## 🚀 Local Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd Spur_Assignment

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb ai_chat_db

# Or using psql
psql -U postgres
CREATE DATABASE ai_chat_db;
\q

# Run migrations
cd backend
npm run migrate
```

You should see output like:

```
✅ Database connection successful
🔄 Running migration: 001_initial_schema.sql
✅ Migration completed
📊 Database tables:
  - conversations
  - messages
```

### 3. Environment Configuration

**Backend** - Create `backend/.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/ai_chat_db

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_MAX_TOKENS=500
GEMINI_TEMPERATURE=0.7

# LLM Configuration
LLM_HISTORY_LIMIT=10

# CORS
CORS_ORIGIN=http://localhost:5173
```

**Frontend** - Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 4. Start Services

Open 4 terminal windows:

```bash
# Terminal 1: Start Redis (optional)
redis-server

# Terminal 2: Start PostgreSQL (if not running as service)
# This depends on your installation method

# Terminal 3: Start backend
cd backend
npm run dev

# Terminal 4: Start frontend
cd frontend
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 📡 API Endpoints

### POST /chat/message

Send a message and receive AI response.

**Request:**

```json
{
  "message": "What's your return policy?",
  "sessionId": "optional-uuid"
}
```

**Response:**

```json
{
  "reply": "We offer a 30-day return policy. Items must be unused with original tags attached.",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "truncated": false
}
```

### GET /chat/history/:sessionId

Retrieve conversation history.

**Response:**

```json
{
  "messages": [
    {
      "id": "msg-1",
      "sender": "user",
      "content": "What's your return policy?",
      "created_at": "2025-12-30T10:00:00Z"
    },
    {
      "id": "msg-2",
      "sender": "ai",
      "content": "We offer a 30-day return policy...",
      "created_at": "2025-12-30T10:00:02Z"
    }
  ],
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### GET /health

Check system health.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-12-30T10:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "llm": "configured"
  }
}
```

## 🤖 LLM Integration

**Provider**: Google Gemini (gemini-2.5-flash)

**System Prompt**: The AI agent is configured as a helpful customer support agent for "TechStore" with knowledge about:

- **Shipping**: Free shipping on orders over $50, 3-5 business days delivery
- **Returns**: 30-day return policy, items must be unused with tags
- **Support Hours**: Monday-Friday, 9 AM - 6 PM EST
- **Payment**: Visa, Mastercard, American Express, PayPal, Apple Pay

**Context Window**: Last 10 messages included for conversation context.

**Error Handling**: Graceful fallback messages for:

- Timeout errors
- Invalid API key
- Rate limiting
- Server errors

## 🗄️ Database Schema

### conversations

```sql
id          UUID PRIMARY KEY
created_at  TIMESTAMP DEFAULT NOW()
metadata    JSONB
```

### messages

```sql
id              UUID PRIMARY KEY
conversation_id UUID REFERENCES conversations(id)
sender          VARCHAR(10) CHECK (sender IN ('user', 'ai'))
content         TEXT NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
token_count     INTEGER
```

## 💾 Caching Strategy

- **Cache Key**: `conv:{sessionId}`
- **TTL**: 1 hour
- **Fallback**: Automatic fallback to database if Redis unavailable
- **Cache Invalidation**: Updated on new messages

## ⚖️ Trade-offs & Design Decisions

### Current Trade-offs

1. **Hardcoded FAQ**: Store policies are hardcoded in the system prompt for simplicity. In production, this would be a database table or CMS for easy updates.

2. **Simple Caching**: Redis caches entire conversation history. Could optimize with message-level caching or LRU eviction.

3. **No Authentication**: Sessions are identified by UUID only. Production would need user authentication and authorization.

4. **Single LLM Provider**: Only OpenAI is integrated. Could add provider abstraction for Claude, Gemini, etc.

5. **Message Truncation**: Messages over 2000 characters are truncated. Could implement chunking or file uploads instead.

6. **No Rate Limiting**: No per-user rate limiting implemented. Production would need this to prevent abuse.

### If I Had More Time

**Features:**

- User authentication and authorization (JWT/OAuth)
- Rate limiting per user/IP
- Conversation analytics and metrics dashboard
- Support for file uploads and rich media
- Multi-language support
- WebSocket for real-time updates
- Conversation export (PDF/JSON)
- Admin dashboard for monitoring

**Technical Improvements:**

- Comprehensive test suite (unit + integration + E2E)
- CI/CD pipeline (GitHub Actions)
- Docker containerization
- Kubernetes deployment
- Semantic search over FAQ knowledge base
- Message streaming for better UX
- Conversation summarization
- Sentiment analysis

**Scalability:**

- Horizontal scaling with load balancer
- Database read replicas
- Redis cluster for high availability
- Message queue for async processing
- CDN for frontend assets

## 🚢 Deployment

### Backend (Render/Railway/Fly.io)

1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `cd backend && npm install && npm run build`
4. Set start command: `cd backend && npm start`
5. Set environment variables (DATABASE_URL, REDIS_URL, GEMINI_API_KEY, etc.)
6. Deploy

### Frontend (Vercel/Netlify)

1. Create new project
2. Connect GitHub repository
3. Set root directory: `frontend`
4. Set build command: `npm run build`
5. Set output directory: `dist`
6. Set environment variable: `VITE_API_BASE_URL`
7. Deploy

### Database (Render PostgreSQL/Supabase/Neon)

1. Create PostgreSQL instance
2. Get connection string
3. Run migrations: `npm run migrate`
4. Update `DATABASE_URL` in backend environment

### Redis (Render Redis/Upstash/Redis Cloud)

1. Create Redis instance
2. Get connection string
3. Update `REDIS_URL` in backend environment

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 🐛 Troubleshooting

**Database connection failed:**

- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

**Redis connection failed:**

- Application will continue without cache
- Verify Redis is running
- Check REDIS_URL format

**Gemini API errors:**

- Verify API key is valid
- Check you're using a supported model (gemini-2.5-flash)
- Review rate limits

**CORS errors:**

- Verify CORS_ORIGIN matches frontend URL
- Check both services are running

## 📝 License

MIT

## 👤 Author

Built for Spur Founding Full-Stack Engineer Take-Home Assignment
