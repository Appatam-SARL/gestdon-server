import { Contact } from '../models/contact.model';

export class ContactService {
  static async create(contactData: any) {
    const contact = new Contact(contactData);
    return contact.save();
  }

  static async getAll(filter: any = {}) {
    return Contact.find(filter);
  }

  static async getById(id: string) {
    return Contact.findById(id);
  }

  static async update(id: string, updateData: any) {
    return Contact.findByIdAndUpdate(id, updateData, { new: true });
  }

  static async delete(id: string) {
    return Contact.findByIdAndDelete(id);
  }
}
