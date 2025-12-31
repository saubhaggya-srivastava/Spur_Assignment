import { Router, Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import { validateChatMessage, validateSessionId } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { ChatRequest, ChatResponse, HistoryResponse } from '../types/chat.types';

const router = Router();

/**
 * POST /chat/message
 * Send a message and receive AI response
 */
router.post(
  '/message',
  validateChatMessage,
  asyncHandler(async (req: Request, res: Response) => {
    const { message, sessionId } = req.body as ChatRequest;

    // Send message and get AI response
    const response: ChatResponse = await chatService.sendMessage(message, sessionId);

    res.status(200).json(response);
  })
);

/**
 * GET /chat/history/:sessionId
 * Retrieve conversation history for a session
 */
router.get(
  '/history/:sessionId',
  validateSessionId,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    // Get conversation history
    const messages = await chatService.getHistory(sessionId);

    const response: HistoryResponse = {
      messages,
      sessionId,
    };

    res.status(200).json(response);
  })
);

export default router;
