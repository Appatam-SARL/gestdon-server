import Client, { IClient } from '../models/client.model';

class ClientService {
  /**
   * Create a new client.
   * @param clientData The data for the new client, including custom fields.
   * @returns A promise resolving to the created client.
   */
  public static async createClient(
    clientData: Partial<IClient>
  ): Promise<IClient> {
    const client = new Client(clientData);
    await client.save();
    return client;
  }

  /**
   * Get all clients.
   * @returns A promise resolving to an array of clients.
   */
  public static async getAllClients(): Promise<IClient[]> {
    const clients = await Client.find();
    return clients;
  }

  // Add methods for getting, updating, and deleting a single client later if needed.
}

export default ClientService;
