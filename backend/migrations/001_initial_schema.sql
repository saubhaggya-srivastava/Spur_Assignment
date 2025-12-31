-- AI Live Chat Agent - Initial Database Schema
-- This migration creates the conversations and messages tables

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Create index on created_at for performance
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  token_count INTEGER
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Add comment for documentation
COMMENT ON TABLE conversations IS 'Stores conversation sessions between users and AI agent';
COMMENT ON TABLE messages IS 'Stores individual messages within conversations';
COMMENT ON COLUMN messages.sender IS 'Message sender: either "user" or "ai"';
COMMENT ON COLUMN messages.token_count IS 'Optional: Number of tokens used for LLM API cost tracking';
