import { Request, Response } from 'express';
import { ContactService } from '../services/contact.service';
import {
  ContactCreateSchema,
  ContactUpdateSchema,
} from '../validations/contact.validation';

export class ContactController {
  static async index(req: Request, res: Response): Promise<void> {
    try {
      const contacts = await ContactService.getAll();
      res.status(200).json({ success: true, data: contacts });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: 'Error fetching contacts', error });
    }
  }

  static async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const contact = await ContactService.getById(id);
      if (!contact) {
        res.status(404).json({ success: false, message: 'Contact not found' });
        return;
      }
      res.status(200).json({ success: true, data: contact });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: 'Error fetching contact', error });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = ContactCreateSchema.safeParse(req.body);
      if (!validationResult.success) {
        res
          .status(400)
          .json({ success: false, errors: validationResult.error.errors });
        return;
      }
      const newContact = await ContactService.create(validationResult.data);
      res.status(201).json({ success: true, data: newContact });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: 'Error creating contact', error });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validationResult = ContactUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        res
          .status(400)
          .json({ success: false, errors: validationResult.error.errors });
        return;
      }
      const updatedContact = await ContactService.update(
        id,
        validationResult.data
      );
      if (!updatedContact) {
        res.status(404).json({ success: false, message: 'Contact not found' });
        return;
      }
      res.status(200).json({ success: true, data: updatedContact });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: 'Error updating contact', error });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedContact = await ContactService.delete(id);
      if (!deletedContact) {
        res.status(404).json({ success: false, message: 'Contact not found' });
        return;
      }
      res
        .status(200)
        .json({ success: true, message: 'Contact deleted successfully' });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: 'Error deleting contact', error });
    }
  }
}
