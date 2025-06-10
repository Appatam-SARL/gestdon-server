import { getBaseEmailTemplate } from './base.template';

interface IAccountDeletionTemplate {
  userName: string;
  deletionDate: Date;
  cancelUrl: string;
}

export function getAccountDeletionTemplate(data: IAccountDeletionTemplate): {
  subject: string;
  html: string;
} {
  const formattedDate = data.deletionDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Contenu spécifique à l'email de suppression de compte
  const content = `
    <h2>Confirmation de suppression de compte</h2>
    
    <p>Bonjour ${data.userName},</p>
    
    <p>Nous avons bien reçu votre demande de suppression de compte ValDeli.</p>
    
    <div class="warning-box">
      <strong>Important :</strong> Votre compte sera définitivement supprimé le <strong>${formattedDate}</strong>.
    </div>
    
    <p>Si vous souhaitez annuler cette demande et conserver votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
    
    <div style="text-align: center;">
      <a href="${data.cancelUrl}" class="button">Annuler la suppression</a>
    </div>
    
    <div class="divider"></div>
    
    <div class="info-box">
      <p><strong>Ce qui se passera après la suppression :</strong></p>
      <ul>
        <li>Toutes vos données personnelles seront définitivement effacées</li>
        <li>Votre historique de commandes sera anonymisé</li>
        <li>Vous ne pourrez plus accéder à votre compte</li>
      </ul>
    </div>
    
    <p>Si vous n'êtes pas à l'origine de cette demande ou si vous avez des questions, veuillez contacter notre support client immédiatement.</p>
  `;

  return {
    subject: `ValDeli - Confirmation de suppression de compte`,
    html: getBaseEmailTemplate({
      title: 'Confirmation de suppression de compte',
      previewText: `Votre compte sera supprimé le ${formattedDate}. Cliquez pour annuler.`,
      content: content,
    }),
  };
}
