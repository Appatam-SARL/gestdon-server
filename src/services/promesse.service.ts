import { z } from 'zod';
import { Beneficiaire } from '../models/beneficiaire.model';
import Promesse, {
  IPromesse,
  PromesseZodSchema,
} from '../models/promesse.model';
import { User } from '../models/user.model';
import { generateICalendarEvent } from '../utils/icalendar';
import { EmailService } from './email.service';

class PromesseService {
  static async createPromesse(
    promesseData: z.infer<typeof PromesseZodSchema>,
    startEvent?: Date,
    endEvent?: Date
  ): Promise<IPromesse> {
    // Validate input data using Zod
    PromesseZodSchema.parse(promesseData);
    const promesse = new Promesse(promesseData);
    await promesse.save();

    //found beneficiary
    const beneficiary = await Beneficiaire.findById(
      promesse.beneficiaireId
    ).exec();
    if (!beneficiary) throw new Error('Bénéficiaire introuvable');
    // found manager
    const manager = await User.findOne({
      role: 'MANAGER',
      contributorId: promesse.contributorId,
    }).exec();
    if (!manager) throw new Error('Manager introuvable');

    // Génération du contenu iCalendar (invitation .ics) personnalisé
    const now = promesse.createdAt ? new Date(promesse.createdAt) : new Date();
    const defaultStart = now;
    const defaultEnd = new Date(now.getTime() + 30 * 60000);
    const dtStart = startEvent ? startEvent : defaultStart;
    const dtEnd = endEvent ? endEvent : defaultEnd;

    // envoie email
    await EmailService.sendEmail({
      // to: foundBeneficiary.email || 'default@email.com',
      to: manager.email || 'default@email.com',
      subject: 'Nouvelle activité de promesse',
      html: 'Nouvelle activité de promesse',
      icalEvent: {
        filename: 'invitation.ics',
        method: 'REQUEST',
        content: generateICalendarEvent({
          title: 'Enregistrer la promesse dans votre agenda',
          description: `Vous avez faire une promesse à ${beneficiary.fullName} `,
          start: dtStart,
          end: dtEnd,
        }).replace(/\\n/g, '\r\n'),
      },
    });

    return promesse;
  }

  static async getAllPromesses(page: string, limit: string, filters: any) {
    // Calcul de la pagination
    const skip = (Number(page) - 1) * Number(limit);
    // Préparation du tri
    const sort: { [key: string]: 'asc' | 'desc' } = {
      createdAt: 'desc',
    };

    const [promesses, total, totalData] = await Promise.all([
      Promesse.find(filters)
        .populate('beneficiaireId')
        .limit(Number(limit))
        .skip(skip)
        .sort({ createdAt: -1 })
        .exec(),
      Promesse.countDocuments(filters).exec(),
      Promesse.countDocuments({ contributorId: filters.contributorId }).exec(),
    ]);

    // Calcul des métadonnées de pagination
    const totalPages = Math.ceil(total / Number(limit));
    const hasNextPage = Number(page) < totalPages;
    const hasPrevPage = Number(page) > 1;
    const pagination = {
      total,
      page: Number(page),
      totalPages,
      hasNextPage,
      hasPrevPage,
      limit: Number(limit),
    };
    return [promesses, pagination, totalData];
  }

  static async getPromesseById(id: string): Promise<IPromesse | null> {
    return Promesse.findById(id).populate('beneficiaireId', 'fullName');
  }

  static async updatePromesse(
    id: string,
    promesseData: z.infer<typeof PromesseZodSchema>
  ): Promise<IPromesse | null> {
    // Validate input data using Zod
    PromesseZodSchema.parse(promesseData);
    return Promesse.findByIdAndUpdate(id, promesseData, { new: true });
  }

  static async deletePromesse(id: string): Promise<IPromesse | null> {
    return Promesse.findByIdAndDelete(id);
  }
}

export default PromesseService;
