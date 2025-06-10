import { IUser } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      driver?: any; // Peut être typé avec l'interface du driver si disponible
      partner?: any; // Peut être typé avec l'interface du partner si disponible
      admin?: any; // Peut être typé avec l'interface de l'admin si disponible
      userType?: 'user' | 'driver' | 'partner' | 'admin';
    }
  }
}
