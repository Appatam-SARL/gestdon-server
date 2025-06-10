import { Types } from 'mongoose';
import { IAdmin } from '../models/admin.model';
import { InviteAdmin } from '../models/invitation-admin.model';

interface IAdminDocument extends IAdmin {
  _id: Types.ObjectId;
}

export class InviteAdminService {
  private static readonly JWT_SECRET =
    process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN = '1d';

  public static async createInviteAdminForRejoindAWordSpace(
    email: string,
    admin: IAdmin
  ) {
    try {
      const newInviteAdmin = {
        email: email,
        adminId: admin._id,
        contributorId: admin.contributorId,
        opened: false,
      };

      const newAdminByInvite = new InviteAdmin(newInviteAdmin);
      newAdminByInvite.generateConfirmationToken();
      newAdminByInvite.save();
    } catch (error) {
      return error;
    }
  }
}
