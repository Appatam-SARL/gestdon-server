import { Router } from 'express';
import ClientController from '../controllers/client.controller';

const router = Router();

// POST /api/clients - Create a new client
router.post('/', ClientController.createClient);

// GET /api/clients - Get all clients
router.get('/', ClientController.getAllClients);

// Add routes for getting, updating, and deleting a single client later if needed.

export default router;
