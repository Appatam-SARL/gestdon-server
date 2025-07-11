import mongoose from 'mongoose';
import { redisClient } from '../config/redis';
import {
  Conversation,
  IConversation,
  IMessage,
} from '../models/conversation.model';

export class ChatService {
  // Créer une nouvelle conversation
  static async createConversation(data: {
    participants: { id: string; type: string }[];
    subject?: string;
    initialMessage?: string;
    sender: string;
  }): Promise<IConversation> {
    const { participants, subject, initialMessage, sender } = data;

    // Vérifier si une conversation existe déjà selon le contexte
    let existingQuery: any = {};

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
    };

    const existingConversation = await Conversation.findOne(existingQuery);

    if (existingConversation) {
      // Si un message initial est fourni, l'ajouter à la conversation existante
      if (initialMessage) {
        await this.addMessage({
          conversationId:
            existingConversation._id?.toString() || existingConversation.id,
          sender,
          content: initialMessage,
        });
      }
      return existingConversation;
    }

    // Créer une nouvelle conversation
    const conversation = new Conversation({
      participants,
      subject,
      messages: initialMessage
        ? [
            {
              sender: new mongoose.Types.ObjectId(sender),
              content: initialMessage,
              readBy: [new mongoose.Types.ObjectId(sender)],
              createdAt: new Date(),
            },
          ]
        : [],
      lastMessageAt: new Date(),
      status: 'OPEN',
    });

    await conversation.save();

    return conversation;
  }

  // Ajouter un message à une conversation
  static async addMessage(data: {
    conversationId: string;
    sender: string;
    content: string;
  }): Promise<IConversation> {
    const { conversationId, sender, content } = data;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation non trouvée');
    }

    const newMessage: IMessage = {
      sender: new mongoose.Types.ObjectId(sender) as any,
      content,
      readBy: [new mongoose.Types.ObjectId(sender) as any],
      createdAt: new Date(),
    };

    conversation.messages.push(newMessage);
    conversation.lastMessageAt = new Date();

    await conversation.save();

    // Mettre à jour en cache les derniers messages pour un accès rapide
    await this.cacheLastMessages(conversationId, newMessage);

    return conversation;
  }

  // Récupérer les conversations d'un utilisateur avec filtres
  static async getUserConversations(
    userId: string,
    page = 1,
    limit = 20,
    filters: {
      status?: 'OPEN' | 'CLOSED' | 'PENDING';
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
      participants: { $elemMatch: { id: userId } },
    };

    if (filters.status) query.status = filters.status;

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

    const conversation = await Conversation.findById(conversationId).lean();

    if (!conversation) {
      throw new Error('Conversation non trouvée');
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

    if (typeof updates.isActive === 'boolean')
      conversation.isActive = updates.isActive;

    await conversation.save();

    return conversation;
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
    query: string,
    page = 1,
    limit = 20,
    filters: {
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
      participants: { $elemMatch: { id: userId } },
      $or: [
        { subject: searchRegex },
        { 'messages.content': searchRegex },
        { tags: searchRegex },
      ],
    };

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

  static async closedConversation(conversationId: string, userId: string) {
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { status: 'CLOSED' },
      { new: true }
    );
    return conversation;
  }
}
