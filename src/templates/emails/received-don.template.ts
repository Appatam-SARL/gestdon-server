import { IBeneficiaire } from '../../models/beneficiaire.model';
import { IContributor } from '../../models/contributor.model';
import { IDon } from '../../models/don.model';
import { getBaseEmailTemplate } from './base.template';

interface ITemplateDonReceived {
  don: IDon;
  qrCodeDataURL: string;
  beneficiaire: IBeneficiaire;
  contributor: IContributor;
  confirmationUrl?: string;
}

// 📁 templates/don.template.ts
export function getReceivedDonTemplate(data: ITemplateDonReceived): {
  subject: string;
  html: string;
} {
  // log qrCodeDataURL
  console.log('qrCodeDataURL' + data.qrCodeDataURL);
  const qrCodeImgTag = data.qrCodeDataURL?.startsWith('data:image')
    ? `<img src="${data.qrCodeDataURL}" alt="QR Code" style="display:block; margin:auto; max-width:200px;" />`
    : '<p>QR Code non disponible</p>';

  const verificationSection = data.confirmationUrl
    ? `
      <div style="margin: 30px 0;">
        <div class="donation-details">
            <h3>Détails du Don</h3>
            <p><strong>ID Don:</strong> ${data.don._id}</p>
            <p><strong>Bénéficiaire:</strong> ${data.beneficiaire.fullName}</p>
            <p><strong>Montant:</strong> <span class="amount">${data.don.montant.toLocaleString()} XOF</span></p>
            <p><strong>Date:</strong> ${new Date(
              data.don.createdAt
            ).toLocaleDateString('fr-FR')}</p>
            ${
              data.contributor.name
                ? `<p><strong>Donateur:</strong> ${data.contributor.name}</p>`
                : ''
            }
        </div>

        <div class="instructions" style="background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>📱 Instructions</h3>
            <p>Pour confirmer la réception de ce don, veuillez scanner le QR code ci-dessous avec votre téléphone :</p>
        </div>

        <div class="qr-section" style="text-align: center; margin: 30px 0;">
            <img src="${
              data.qrCodeDataURL
            }" alt="QR Code de confirmation" class="qr-code" style="border: 2px solid #ddd; border-radius: 10px; max-width: 300px; height: auto;">
            <p><strong>Scannez ce QR code pour confirmer</strong></p>
            <p style="font-size: 12px; color: #666;">
                Lien direct: <a href="${data.confirmationUrl}>Cliquez ici</a>
            </p>
        </div>

        <div class="instructions" style="background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Alternative:</strong> Si vous ne pouvez pas scanner le QR code, cliquez sur ce lien :</p>
            <p><a href='${data.confirmationUrl}'>Confirmer la réception</a></p>
        </div>
      
      </div>
    `
    : `
      <div class="warning-box">
        <p><strong>Note :</strong> Aucune adresse email fournie lors de l'inscription. Veuillez en ajouter une pour recevoir les notifications.</p>
      </div>
    `;

  const content = `
    <h2 style="color: #2c3e50; text-align: center;">🎯 Confirmation de Réception de Don !</h2>
    <p>Bonjour ${data.beneficiaire.fullName},</p>
    ${verificationSection}
    <p>Nous vous remercions pour votre confiance et vous souhaitons une excellente expérience sur notre plateforme.</p>
  `;

  return {
    subject: `🎯 Confirmation de don - ${data.don.montant.toLocaleString()} XOF`,
    html: getBaseEmailTemplate({
      title: 'Don reçu',
      previewText: '🎯 Confirmation de Réception de Don',
      content,
    }),
  };
}
