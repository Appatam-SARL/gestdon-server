import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
import QRCode from 'qrcode';
import { Beneficiaire } from '../models/beneficiaire.model';
import Contributor from '../models/contributor.model';
import Don, { IDon } from '../models/don.model';
import { getReceivedDonTemplate } from '../templates/emails/received-don.template';
import { generateICalendarEvent } from '../utils/icalendar';
import { EmailService } from './email.service';

class DonService {
  /**
   * Create a new donation with validation, error handling, and email notification.
   * @param donData - The data for the new donation.
   * @returns The created donation.
   */
  public static async createDon(
    donData: Partial<IDon>,
    startEvent?: Date,
    endEvent?: Date
  ): Promise<IDon> {
    console.log('🚀 ~ DonService ~ endEvent:', endEvent);
    console.log('🚀 ~ DonService ~ startEvent:', startEvent);
    if (!donData.beneficiaire || !donData.contributorId || !donData.montant) {
      throw new Error(
        'Les champs beneficiaire, contributorId et montant sont obligatoires'
      );
    }

    const [foundBeneficiary, foundContributor] = await Promise.all([
      Beneficiaire.findById(donData.beneficiaire),
      Contributor.findById(donData.contributorId),
    ]);

    if (!foundBeneficiary) throw new Error('Bénéficiaire introuvable');
    if (!foundContributor) throw new Error('Contributeur introuvable');

    const don = new Don(donData);
    // await don.save();

    const token = DonService.generateConfirmationToken(
      don._id as string,
      foundContributor._id as string
    );
    don.token = token;

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl)
      throw new Error(
        "L'URL du frontend n'est pas configurée pour cet environnement"
      );

    const confirmationUrl = `${frontendUrl}confirm-don?token=${token}`;

    // Générer le QR code
    const qrCodeImage = await this.generateQRCode(confirmationUrl);
    const base64Data = qrCodeImage.replace(/^data:image\/png;base64,/, '');
    console.log('🚀 ~ DonService ~ createDon ~ base64Data:', base64Data);

    don.qrCode = base64Data;

    await don.save();

    const emailTemplate = getReceivedDonTemplate({
      don,
      qrCodeDataURL: base64Data,
      beneficiaire: foundBeneficiary,
      contributor: foundContributor,
      confirmationUrl,
    });

    // Génération du contenu iCalendar (invitation .ics) personnalisé
    const now = don.createdAt ? new Date(don.createdAt) : new Date();

    const defaultStart = now;
    const defaultEnd = new Date(now.getTime() + 30 * 60000);
    const dtStart = startEvent ? startEvent : defaultStart;
    const dtEnd = endEvent ? endEvent : defaultEnd;

    await EmailService.sendEmail({
      // to: foundBeneficiary.email || 'default@email.com',
      to: 'konn1708980003@outlook.fr',
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      attachments: [
        {
          filename: 'qrcode.png',
          content: base64Data,
          encoding: 'base64',
          cid: 'qrcode', // Référence pour l'image inline
        },
      ],
      icalEvent: {
        filename: 'invitation.ics',
        method: 'REQUEST',
        content: generateICalendarEvent({
          title: 'Confirmation de Don pour ' + foundBeneficiary.fullName,
          description: `Merci ${foundContributor.name} pour votre don à ${foundBeneficiary.fullName}. Cliquez sur le lien pour confirmer`,
          start: dtStart,
          end: dtEnd,
          url: confirmationUrl,
        }).replace(/\\n/g, '\r\n'),
      },
    });

    return don;
  }

  private static async generateQRCode(data: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(data);
      return qrCodeDataURL;
    } catch (error) {
      throw new Error('Erreur lors de la génération du QR code');
    }
  }
  /**
   * Génère un token JWT pour la confirmation du don
   */
  private static generateConfirmationToken(
    donId: string,
    contributorId?: string
  ): string {
    return jwt.sign(
      {
        id: donId,
        contributorId: contributorId,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '365d' }
    );
  }

  /**
   * Génère et sauvegarde un QR code comme fichier image dans public/qrcodes et retourne son URL publique
   */
  private static async generateAndSaveQRCodeFile(
    url: string,
    donId: string
  ): Promise<string> {
    const fileName = `don-${donId}-${Date.now()}.png`;
    const dirPath = path.join(process.cwd(), 'public', 'qrcodes');
    const filePath = path.join(dirPath, fileName);

    // Crée le dossier s'il n'existe pas
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    await QRCode.toFile(filePath, url, { type: 'png', width: 300 });

    // Utilise l'URL du serveur depuis la variable d'environnement
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    const publicUrl = `${serverUrl}/public/qrcodes/${fileName}`;
    return publicUrl;
  }

  /**
   * Get all donations.
   * @returns A list of all donations.
   */
  public static async getAllDons(
    page: number = 1,
    limit: number = 10,
    filter: { [key: string]: any } = {}
  ): Promise<{ dons: IDon[]; total: number }> {
    const skip = (page - 1) * limit;
    const dons = await Don.find(filter)
      .populate('beneficiaire')
      .skip(skip)
      .limit(limit);
    const total = await Don.countDocuments(filter);
    return { dons, total };
  }

  public static async getStats(query: any): Promise<any> {
    const typeDons = ['Nature', 'Espèces'];
    const filter = (type: string) =>
      query.contributorId
        ? { type, contributorId: query.contributorId }
        : { type };

    const stats = await Promise.all(
      typeDons.map(async (type) => ({
        type,
        count: await Don.countDocuments(filter(type)),
      }))
    );
    return stats.reduce(
      (acc, curr) => ({ ...acc, [curr.type]: curr.count }),
      {}
    );
  }

  /**
   * Get a donation by ID.
   * @param donId - The ID of the donation.
   * @returns The donation with the specified ID, or null if not found.
   */
  public static async getDonById(donId: string): Promise<IDon | null> {
    return Don.findById(donId).populate('beneficiaire');
  }

  /**
   * Update a donation by ID.
   * @param donId - The ID of the donation to update.
   * @param updateData - The data to update the donation with.
   * @returns The updated donation, or null if not found.
   */
  public static async updateDon(
    donId: string,
    updateData: Partial<IDon>
  ): Promise<IDon | null> {
    return Don.findByIdAndUpdate(donId, updateData, { new: true }).populate(
      'beneficiaire'
    );
  }

  public static async confirmDon(donId: string): Promise<IDon | null> {
    return Don.findByIdAndUpdate(donId, { status: 'received' }, { new: true })
      .populate('beneficiaire')
      .exec();
  }

  /**
   * Delete a donation by ID.
   * @param donId - The ID of the donation to delete.
   * @returns The deleted donation, or null if not found.
   */
  public static async deleteDon(donId: string): Promise<IDon | null> {
    return Don.findByIdAndDelete(donId).populate('beneficiaire');
  }
}

export default DonService;
