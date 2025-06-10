import { Request, Response } from 'express';
import { IClientCustomField } from '../models/client.model';
import ClientService from '../services/client.service';

class ClientController {
  /**
   * Create a new client.
   * Handles incoming client data, including custom fields.
   */
  public static async createClient(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, phone, customFields } = req.body;

      // Basic validation (can be enhanced with a validation middleware)
      if (!name) {
        res.status(400).json({ message: 'Client name is required.' });
        return;
      }

      const clientData = {
        name,
        email,
        phone,
        customFields: (customFields as IClientCustomField[]) || [], // Ensure customFields is an array
      };

      const newClient = await ClientService.createClient(clientData);
      res.status(201).json(newClient);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get all clients.
   */
  public static async getAllClients(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const clients = await ClientService.getAllClients();
      res.json(clients);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // Add methods for getting, updating, and deleting a single client later if needed.
}

export default ClientController;
