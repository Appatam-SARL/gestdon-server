import { SocketService } from './socket.service';

/**
 * Service pour gérer les notifications WebSocket
 * Adapte le SocketService existant pour les notifications
 */
export class WebSocketService {
  /**
   * Envoie une notification à un utilisateur spécifique
   */
  async sendToUser(userId: string, data: any): Promise<void> {
    try {
      // Utilise le SocketService existant pour envoyer des notifications
      SocketService.emitNotification(userId, data);
    } catch (error) {
      console.error(
        `Erreur d'envoi WebSocket à l'utilisateur ${userId}:`,
        error
      );
    }
  }
}
