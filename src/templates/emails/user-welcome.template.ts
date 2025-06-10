import { getBaseEmailTemplate } from './base.template';

interface IUserWelcomeTemplate {
  firstName: string;
  verificationUrl?: string;
}

export function getUserWelcomeTemplate(data: IUserWelcomeTemplate): {
  subject: string;
  html: string;
} {
  // Section de vérification conditionnelle
  const verificationSection = data.verificationUrl
    ? `
    <div style="margin: 30px 0;">
      <p><strong>Veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</strong></p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${data.verificationUrl}" class="button">
          Vérifier mon email
        </a>
      </div>
      <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
      <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${data.verificationUrl}</p>
    </div>
  `
    : `
    <div class="warning-box">
      <p><strong>Note :</strong> Vous n'avez pas fourni d'adresse email lors de votre inscription. L'email est facultatif, mais nous vous recommandons d'en ajouter un pour sécuriser votre compte et recevoir des notifications importantes.</p>
    </div>
  `;

  // Contenu spécifique à l'email de bienvenue
  const content = `
    <h2 style="color: #2c3e50; text-align: center;">Bienvenue sur Contrib !</h2>
    
    <p>Bonjour ${data.firstName},</p>
    
    <p>Votre compte a été créé avec succès. Vous pouvez maintenant profiter de tous les services de Contrib.</p>
    
    ${verificationSection}
    
    <div class="success-box">
      <h3>Prochaines étapes :</h3>
      <ul>
        <li>Connectez-vous à votre compte avec votre adresse email et votre mot de passe ou avec votre numéro de téléphone</li>
        <li>Consulter vos activités</li>
      </ul>
    </div>
    
    <p>Nous vous remercions pour votre confiance et vous souhaitons une excellente expérience sur notre plateforme.</p>
  `;

  return {
    subject: `Bienvenue sur Contrib - Votre compte a été créé`,
    html: getBaseEmailTemplate({
      title: 'Bienvenue sur Contrib',
      previewText: `Bienvenue ${data.firstName} ! Votre compte Contrib a été créé avec succès.`,
      content: content,
    }),
  };
}
