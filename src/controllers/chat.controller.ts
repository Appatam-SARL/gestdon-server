import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';
import { ApiError } from '../utils/api-error';
import { sendEmail } from '../utils/email';

export class ChatController {
  // Créer une nouvelle conversation
  async createConversation(req: Request, res: Response) {
    try {
      const { participants, subject, initialMessage } = req.body;

      const sender = req.user.id;

      const conversation = await ChatService.createConversation({
        participants,
        subject,
        initialMessage,
        sender,
      });

      const emails = [participants[0].email, participants[1].email];

      const conversationUrl = process.env.FRONTEND_URL || 'https://val.com';

      for (const email of emails) {
        await sendEmail({
          to: email,
          subject: `Conversation avec ${participants[0].firstName}`,
          text: `Bonjour ${participants[0].firstName}, nous avons créé une nouvelle conversation avec vous. Cliquez sur ce lien pour y acceder : ${conversationUrl}`,
        });
      }

      res.status(201).json({
        status: 'success',
        data: conversation,
      });
    } catch (error) {
      throw new ApiError(400, (error as Error).message);
    }
  }

  // Ajouter un message à une conversation
  async addMessage(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const { content } = req.body;
      const sender = req.user.id;
      const conversation = await ChatService.addMessage({
        conversationId,
        sender,
        content,
      });
      res.status(200).json({
        status: 'success',
        data: conversation,
      });
    } catch (error) {
      throw new ApiError(400, (error as Error).message);
    }
  }

  // Obtenir les conversations d'un utilisateur
  async getUserConversations(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const userType = req.user.role;
      const { page = '1', limit = '20', status } = req.query;

      const result = await ChatService.getUserConversations(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        status: 'success',
        data: result.conversations,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      throw new ApiError(400, (error as Error).message);
    }
  }

  // Obtenir une conversation spécifique
  async getConversation(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      const { page = '1', limit = '30' } = req.query;

      const result = await ChatService.getConversationById(
        conversationId,
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        status: 'success',
        data: {
          conversation: result.conversation,
          messages: result.messages,
          totalMessages: result.totalMessages,
        },
      });
    } catch (error) {
      throw new ApiError(404, (error as Error).message);
    }
  }

  // Mettre à jour une conversation (statut, priorité, tags)
  async updateConversation(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const { status, priority, tags, isActive } = req.body;

      // Vérifier si l'utilisateur est autorisé (admin ou propriétaire)
      const userId = req.user.id;
      const userRole = req.user.role;

      // Seuls les administrateurs peuvent modifier certains champs
      if ((status || priority) && userRole !== 'ADMIN') {
        throw new ApiError(
          403,
          "Vous n'êtes pas autorisé à modifier le statut ou la priorité"
        );
      }

      const conversation = await ChatService.updateConversation(
        conversationId,
        { status, priority, tags, isActive }
      );

      res.status(200).json({
        status: 'success',
        data: conversation,
      });
    } catch (error) {
      throw new ApiError(400, (error as Error).message);
    }
  }

  // Rechercher dans les conversations
  async searchConversations(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const userType = req.user.role;
      const { query, type, status, page = '1', limit = '20' } = req.query;

      if (!query) {
        throw new ApiError(400, 'Le paramètre de recherche est requis');
      }

      const results = await ChatService.searchConversations(
        userId,
        query as string,
        parseInt(page as string),
        parseInt(limit as string),
        {
          status: status as 'OPEN' | 'CLOSED' | 'PENDING',
        }
      );

      res.status(200).json({
        status: 'success',
        data: results.results,
        pagination: {
          total: results.total,
          page: parseInt(page as string),
          totalPages: Math.ceil(results.total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      throw new ApiError(400, (error as Error).message);
    }
  }

  async closedConversation(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      const conversation = await ChatService.closedConversation(
        conversationId,
        userId
      );

      res.status(200).json({
        status: 'success',
        data: conversation,
      });
    } catch (error) {
      throw new ApiError(400, (error as Error).message);
    }
  }
}
