import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalSetup() {
  const instance = await MongoMemoryServer.create();
  const uri = instance.getUri();
  (global as any).__MONGOINSTANCE = instance;
  process.env.MONGODB_URI = uri.slice(0, uri.lastIndexOf('/'));
  process.env.PORT = '3001'; // Utiliser un port différent pour les tests
}
