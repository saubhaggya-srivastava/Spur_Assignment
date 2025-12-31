import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from '../types/chat.types';

/**
 * LLMService for Google Gemini
 * Handles integration with Google Gemini API for generating AI responses
 */
export class LLMGeminiService {
  private client: GoogleGenerativeAI | null = null;
  private model: any = null;
  private modelName: string;
  private maxTokens: number;
  private temperature: number;
  private historyLimit: number;

  constructor() {
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    this.maxTokens = parseInt(process.env.GEMINI_MAX_TOKENS || '500', 10);
    this.temperature = parseFloat(process.env.GEMINI_TEMPERATURE || '0.7');
    this.historyLimit = parseInt(process.env.LLM_HISTORY_LIMIT || '10', 10);
  }

  /**
   * Initialize Gemini client
   */
  public initialize(): void {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY environment variable is not set. Please configure your .env file.'
      );
    }

    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ 
      model: this.modelName,
      generationConfig: {
        temperature: this.temperature,
        maxOutputTokens: this.maxTokens,
      },
    });

    console.log('✅ Gemini client initialized');
    console.log(`   Model: ${this.modelName}`);
    console.log(`   Max Tokens: ${this.maxTokens}`);
    console.log(`   Temperature: ${this.temperature}`);
    console.log(`   History Limit: ${this.historyLimit} messages`);
  }

  /**
   * Generate AI reply based on conversation history and user message
   */
  async generateReply(history: Message[], userMessage: string): Promise<string> {
    if (!this.model) {
      throw new Error('LLM Service not initialized. Call initialize() first.');
    }

    try {
      // Limit history to last N messages
      const limitedHistory = history.slice(-this.historyLimit);

      // Build conversation context
      const systemPrompt = this.getSystemPrompt();
      
      // Format conversation history for Gemini
      let conversationContext = systemPrompt + '\n\nConversation History:\n';
      
      for (const msg of limitedHistory) {
        const role = msg.sender === 'user' ? 'Customer' : 'Support Agent';
        conversationContext += `${role}: ${msg.content}\n`;
      }
      
      conversationContext += `\nCustomer: ${userMessage}\nSupport Agent:`;

      // Call Gemini API
      const result = await this.model.generateContent(conversationContext);
      const response = await result.response;
      const reply = response.text();

      if (!reply) {
        throw new Error('No response from LLM');
      }

      return reply.trim();
    } catch (error) {
      return this.handleLLMError(error);
    }
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
   * Handle LLM API errors and return user-friendly messages
   */
  private handleLLMError(error: any): string {
    console.error('LLM API Error:', error);

    // Check for specific error types
    if (error?.message?.includes('timeout')) {
      return "Our AI agent is taking longer than expected. Please try again.";
    }

    if (error?.message?.includes('API key') || error?.message?.includes('authentication')) {
      console.error('❌ Invalid Gemini API key');
      return "AI service is temporarily unavailable. Please contact support.";
    }

    if (error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
      return "Our AI agent is busy right now. Please try again in a moment.";
    }

    if (error?.message?.includes('500') || error?.message?.includes('503')) {
      return "Unable to generate response. Please try again.";
    }

    // Generic error
    return "Unable to generate response. Please try again.";
  }

  /**
   * Get current configuration
   */
  public getConfig() {
    return {
      model: this.modelName,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      historyLimit: this.historyLimit,
    };
  }
}

// Export singleton instance
export const llmService = new LLMGeminiService();
