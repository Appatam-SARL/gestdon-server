import mongoose from 'mongoose';

interface IContact {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const ContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

export const Contact = mongoose.model('Contact', ContactSchema);
