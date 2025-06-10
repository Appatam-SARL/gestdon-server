import mongoose from 'mongoose';
import { redisClient } from '../config/redis';
import {
  Conversation,
  ConversationType,
  IConversation,
  IMessage,
} from '../models/conversation.model';
import { SocketService } from './socket.service';

export class ChatService {
  // Créer une nouvelle conversation
  static async createConversation(data: {
    participants: { id: string; type: string }[];
    type?: ConversationType;
    order?: string;
    product?: string;
    claim?: string;
    subject?: string;
    initialMessage?: string;
    sender: string;
    senderType: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    tags?: string[];
  }): Promise<IConversation> {
    const {
      participants,
      type = 'GENERAL',
      order,
      product,
      claim,
      subject,
      initialMessage,
      sender,
      senderType,
      priority = 'MEDIUM',
      tags = [],
    } = data;

    // Vérifier si une conversation existe déjà selon le contexte
    let existingQuery: any = {};

    if (order) {
      existingQuery.order = order;
    } else if (product) {
      existingQuery.product = product;
      // Pour les conversations de produit, on peut vouloir une conversation par client et produit
      existingQuery.participants = {
        $elemMatch: {
          id: sender,
        },
      };
    } else if (claim) {
      existingQuery.claim = claim;
    } else {
      // Pour les conversations générales, on vérifie si les mêmes participants existent
      existingQuery = {
        participants: {
          $all: participants.map((p) => ({
            $elemMatch: {
              id: new mongoose.Types.ObjectId(p.id),
              type: p.type,
            },
          })),
        },
        order: { $exists: false },
        product: { $exists: false },
        claim: { $exists: false },
      };
    }

    const existingConversation = await Conversation.findOne(existingQuery);

    if (existingConversation) {
      // Si un message initial est fourni, l'ajouter à la conversation existante
      if (initialMessage) {
        await this.addMessage({
          conversationId:
            existingConversation._id?.toString() || existingConversation.id,
          sender,
          senderType,
          content: initialMessage,
        });
      }
      return existingConversation;
    }

    // Créer une nouvelle conversation
    const conversation = new Conversation({
      participants,
      type,
      order,
      product,
      claim,
      subject,
      messages: initialMessage
        ? [
            {
              sender: new mongoose.Types.ObjectId(sender),
              senderType,
              content: initialMessage,
              readBy: [new mongoose.Types.ObjectId(sender)],
              createdAt: new Date(),
            },
          ]
        : [],
      lastMessageAt: new Date(),
      priority,
      tags,
      status: type === 'SUPPORT' || type === 'CLAIM' ? 'PENDING' : 'OPEN',
    });

    await conversation.save();

    // Notifier les participants via WebSocket
    participants.forEach((participant) => {
      if (participant.id !== sender) {
        SocketService.emitNewConversation(participant.id, {
          conversationId: conversation._id?.toString() || conversation.id,
          subject: subject || `Nouvelle conversation ${type.toLowerCase()}`,
          lastMessage: initialMessage || '',
          type,
        });
      }
    });

    // Notifications spéciales pour le support et les réclamations
    if (type === 'SUPPORT' || type === 'CLAIM') {
      // Notifier les administrateurs pour les conversations de support ou réclamation
      SocketService.emitSupportRequest(
        conversation._id?.toString() || conversation.id,
        {
          type,
          subject:
            subject ||
            `Nouvelle ${
              type === 'SUPPORT' ? 'demande de support' : 'réclamation'
            }`,
          priority,
        }
      );
    }

    return conversation;
  }

  // Ajouter un message à une conversation
  static async addMessage(data: {
    conversationId: string;
    sender: string;
    senderType: string;
    content: string;
    attachments?: string[];
  }): Promise<IConversation> {
    const { conversationId, sender, senderType, content, attachments } = data;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation non trouvée');
    }

    const newMessage: IMessage = {
      sender: new mongoose.Types.ObjectId(sender) as any,
      senderType: senderType as 'USER' | 'PARTNER' | 'DRIVER' | 'ADMIN',
      content,
      attachments: attachments || [],
      readBy: [new mongoose.Types.ObjectId(sender) as any],
      createdAt: new Date(),
    };

    conversation.messages.push(newMessage);
    conversation.lastMessageAt = new Date();

    // Si la conversation était en attente et que c'est un admin qui répond, la marquer comme ouverte
    if (conversation.status === 'PENDING' && senderType === 'ADMIN') {
      conversation.status = 'OPEN';
    }

    await conversation.save();

    // Mettre à jour en cache les derniers messages pour un accès rapide
    await this.cacheLastMessages(conversationId, newMessage);

    // Notifier les participants via WebSocket
    conversation.participants.forEach((participant) => {
      if (participant.id.toString() !== sender) {
        SocketService.emitNewMessage(participant.id.toString(), {
          conversationId,
          message: {
            ...newMessage,
            sender: sender,
            createdAt: newMessage.createdAt,
          },
          type: conversation.type,
        });
      }
    });

    return conversation;
  }

  // Récupérer les conversations d'un utilisateur avec filtres
  static async getUserConversations(
    userId: string,
    userType: string,
    page = 1,
    limit = 20,
    filters: {
      type?: ConversationType;
      status?: 'OPEN' | 'CLOSED' | 'PENDING';
      priority?: 'LOW' | 'MEDIUM' | 'HIGH';
      order?: string;
      product?: string;
      claim?: string;
      tag?: string;
    } = {}
  ): Promise<{
    conversations: IConversation[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    // Construire la requête avec les filtres
    const query: any = {
      participants: { $elemMatch: { id: userId, type: userType } },
    };

    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.order) query.order = filters.order;
    if (filters.product) query.product = filters.product;
    if (filters.claim) query.claim = filters.claim;
    if (filters.tag) query.tags = filters.tag;

    const total = await Conversation.countDocuments(query);

    const conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('order', 'orderNumber status')
      .populate('product', 'name price')
      .populate('claim', 'reference status')
      .lean();

    return {
      conversations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Récupérer les détails d'une conversation avec pagination des messages
  static async getConversationById(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 30
  ): Promise<{
    conversation: IConversation;
    messages: IMessage[];
    totalMessages: number;
  }> {
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(conversationId)
      .populate('order', 'orderNumber status stops')
      .populate('product', 'name price images description')
      .populate('claim', 'reference status description')
      .lean();

    if (!conversation) {
      throw new Error('Conversation non trouvée');
    }

    // Vérifier si l'utilisateur est un participant ou un admin
    const isParticipant = conversation.participants.some(
      (p) => p.id.toString() === userId
    );

    const isAdmin = await this.isUserAdmin(userId);

    if (!isParticipant && !isAdmin) {
      throw new Error('Accès non autorisé à cette conversation');
    }

    // Pagination des messages (les plus récents d'abord)
    const totalMessages = conversation.messages.length;
    const messages = conversation.messages
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(skip, skip + limit)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ); // Trier chronologiquement pour l'affichage

    // Marquer les messages comme lus
    await Conversation.updateOne(
      { _id: conversationId, 'messages.readBy': { $ne: userId } },
      { $addToSet: { 'messages.$[elem].readBy': userId } },
      { arrayFilters: [{ 'elem.readBy': { $ne: userId } }], multi: true }
    );

    // Émettre le statut de lecture
    SocketService.emitReadStatus(conversationId, userId);

    return {
      conversation,
      messages,
      totalMessages,
    };
  }

  // Mettre à jour le statut et d'autres propriétés d'une conversation
  static async updateConversation(
    conversationId: string,
    updates: {
      status?: 'OPEN' | 'CLOSED' | 'PENDING';
      priority?: 'LOW' | 'MEDIUM' | 'HIGH';
      tags?: string[];
      isActive?: boolean;
    }
  ): Promise<IConversation> {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation non trouvée');
    }

    if (updates.status) conversation.status = updates.status;
    if (updates.priority) conversation.priority = updates.priority;
    if (updates.tags) conversation.tags = updates.tags;
    if (typeof updates.isActive === 'boolean')
      conversation.isActive = updates.isActive;

    await conversation.save();

    // Notifier tous les participants de la mise à jour
    conversation.participants.forEach((participant) => {
      SocketService.emitConversationUpdate(participant.id.toString(), {
        conversationId,
        updates,
      });
    });

    return conversation;
  }

  // Vérifier si un utilisateur est admin (méthode d'aide)
  private static async isUserAdmin(userId: string): Promise<boolean> {
    // Implémenter selon votre système d'authentification
    // Exemple simple: Vérifier dans la collection Admin
    try {
      const { Admin } = mongoose.models;
      if (Admin) {
        const admin = await Admin.findById(userId);
        return !!admin;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification des droits admin', error);
      return false;
    }
  }

  // Mettre en cache les derniers messages pour un accès rapide
  private static async cacheLastMessages(
    conversationId: string,
    message: IMessage
  ): Promise<void> {
    try {
      const cacheKey = `chat:last-messages:${conversationId}`;
      const cachedMessages = await redisClient.lrange(cacheKey, 0, -1);

      // Limiter à 50 derniers messages en cache
      if (cachedMessages.length >= 50) {
        await redisClient.rpop(cacheKey);
      }

      await redisClient.lpush(
        cacheKey,
        JSON.stringify({
          ...message,
          sender: message.sender.toString(),
        })
      );
      await redisClient.expire(cacheKey, 86400); // 24 heures
    } catch (error) {
      console.error('Erreur lors de la mise en cache des messages', error);
      // Ne pas bloquer le flux d'exécution en cas d'erreur de cache
    }
  }

  // Rechercher dans les conversations et messages avec filtres supplémentaires
  static async searchConversations(
    userId: string,
    userType: string,
    query: string,
    page = 1,
    limit = 20,
    filters: {
      type?: ConversationType;
      status?: 'OPEN' | 'CLOSED' | 'PENDING';
    } = {}
  ): Promise<{
    results: IConversation[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const searchRegex = new RegExp(query, 'i');

    // Construire la requête avec filtres
    const searchQuery: any = {
      participants: { $elemMatch: { id: userId, type: userType } },
      $or: [
        { subject: searchRegex },
        { 'messages.content': searchRegex },
        { tags: searchRegex },
      ],
    };

    if (filters.type) searchQuery.type = filters.type;
    if (filters.status) searchQuery.status = filters.status;

    const total = await Conversation.countDocuments(searchQuery);

    const results = await Conversation.find(searchQuery)
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('order', 'orderNumber status')
      .populate('product', 'name price')
      .populate('claim', 'reference status')
      .lean();

    return {
      results,
      total,
    };
  }
}
