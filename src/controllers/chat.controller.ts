import { Request, Response } from 'express';
import { ConversationType } from '../models/conversation.model';
import { ChatService } from '../services/chat.service';
import { ApiError } from '../utils/api-error';

export class ChatController {
  // Créer une nouvelle conversation
  async createConversation(req: Request, res: Response) {
    try {
      const {
        participants,
        type = 'GENERAL' as ConversationType,
        order,
        product,
        claim,
        subject,
        initialMessage,
        priority,
        tags,
      } = req.body;

      const sender = req.user.id;
      const senderType = req.user.role;

      const conversation = await ChatService.createConversation({
        participants,
        type,
        order,
        product,
        claim,
        subject,
        initialMessage,
        sender,
        senderType,
        priority,
        tags,
      });

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
      const { content, attachments } = req.body;
      const sender = req.user.id;
      const senderType = req.user.role;

      const conversation = await ChatService.addMessage({
        conversationId,
        sender,
        senderType,
        content,
        attachments,
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
      const {
        page = '1',
        limit = '20',
        type,
        status,
        priority,
        order,
        product,
        claim,
        tag,
      } = req.query;

      const result = await ChatService.getUserConversations(
        userId,
        userType,
        parseInt(page as string),
        parseInt(limit as string),
        {
          type: type as ConversationType,
          status: status as 'OPEN' | 'CLOSED' | 'PENDING',
          priority: priority as 'LOW' | 'MEDIUM' | 'HIGH',
          order: order as string,
          product: product as string,
          claim: claim as string,
          tag: tag as string,
        }
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
        userType,
        query as string,
        parseInt(page as string),
        parseInt(limit as string),
        {
          type: type as ConversationType,
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
}
