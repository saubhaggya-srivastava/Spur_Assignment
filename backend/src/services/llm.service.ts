import OpenAI from 'openai';
import { Message } from '../types/chat.types';

/**
 * LLMService
 * Handles integration with OpenAI API for generating AI responses
 */
export class LLMService {
  private client: OpenAI | null = null;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private historyLimit: number;

  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '500', 10);
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.7');
    this.historyLimit = parseInt(process.env.LLM_HISTORY_LIMIT || '10', 10);
  }

  /**
   * Initialize OpenAI client
   */
  public initialize(): void {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY environment variable is not set. Please configure your .env file.'
      );
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });

    console.log('✅ OpenAI client initialized');
    console.log(`   Model: ${this.model}`);
    console.log(`   Max Tokens: ${this.maxTokens}`);
    console.log(`   Temperature: ${this.temperature}`);
    console.log(`   History Limit: ${this.historyLimit} messages`);
  }

  /**
   * Generate AI reply based on conversation history and user message
   */
  async generateReply(history: Message[], userMessage: string): Promise<string> {
    if (!this.client) {
      throw new Error('LLM Service not initialized. Call initialize() first.');
    }

    try {
      // Limit history to last N messages
      const limitedHistory = history.slice(-this.historyLimit);

      // Build messages array for OpenAI
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.getSystemPrompt(),
        },
      ];

      // Add conversation history
      for (const msg of limitedHistory) {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage,
      });

      // Call OpenAI API
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const reply = completion.choices[0]?.message?.content;

      if (!reply) {
        throw new Error('No response from LLM');
      }

      return reply.trim();
    } catch (error) {
      return this.handleLLMError(error);
    }
  }

  /**
   * Handle LLM API errors and return user-friendly messages
   */
  private handleLLMError(error: any): string {
    console.error('LLM API Error:', error);

    // Check for specific error types
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      // Timeout error
      return "Our AI agent is taking longer than expected. Please try again.";
    }

    if (error?.status === 401 || error?.message?.includes('Incorrect API key')) {
      // Authentication error (invalid API key)
      console.error('❌ Invalid OpenAI API key');
      return "AI service is temporarily unavailable. Please contact support.";
    }

    if (error?.status === 429 || error?.message?.includes('Rate limit')) {
      // Rate limit error
      return "Our AI agent is busy right now. Please try again in a moment.";
    }

    if (error?.status === 503 || error?.message?.includes('overloaded')) {
      // Service overloaded
      return "Our AI agent is busy right now. Please try again in a moment.";
    }

    if (error?.status === 500 || error?.status === 502 || error?.status === 503) {
      // Server errors
      return "Unable to generate response. Please try again.";
    }

    // Generic error
    return "Unable to generate response. Please try again.";
  }

  /**
   * Get system prompt with FAQ context
   */
  private getSystemPrompt(): string {
    return `You are a helpful customer support agent for TechStore, an e-commerce platform.
Answer questions clearly, concisely, and professionally.

Store Information:
- Shipping: Free shipping on orders over $50. Standard delivery takes 3-5 business days.
- Returns: 30-day return policy. Items must be unused with original tags attached.
- Support Hours: Monday-Friday, 9 AM - 6 PM EST. Email: support@techstore.com
- Payment: We accept Visa, Mastercard, American Express, PayPal, and Apple Pay.

Guidelines:
- Be friendly and professional
- Provide accurate information based on the store policies above
- If you don't know something, direct the customer to email support
- Keep responses concise (2-3 sentences when possible)`;
  }

  /**
   * Get current configuration
   */
  public getConfig() {
    return {
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      historyLimit: this.historyLimit,
    };
  }
}

// Export singleton instance
export const llmService = new LLMService();
