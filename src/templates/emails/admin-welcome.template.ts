interface IAdminWelcomeTemplate {
  firstName: string;
  password: string;
  loginUrl: string;
  confirmationUrl: string;
}

export function getAdminWelcomeTemplate(data: IAdminWelcomeTemplate): {
  subject: string;
  html: string;
} {
  return {
    subject: `ValDeli - Confirmation de votre compte administrateur`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2c3e50; text-align: center;">Bienvenue sur ValDeli</h1>
        
        <p>Bonjour ${data.firstName},</p>
        
        <p>Votre compte administrateur a été créé avec succès. Voici vos identifiants de connexion :</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Mot de passe temporaire :</strong> ${data.password}</p>
        </div>
        
        <p><strong>Important :</strong> Pour des raisons de sécurité, vous devrez changer ce mot de passe lors de votre première connexion.</p>

        <p><strong>Étape suivante :</strong> Veuillez confirmer votre compte en cliquant sur le bouton ci-dessous :</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.confirmationUrl}" 
             style="background-color: #2ecc71; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Confirmer mon compte
          </a>
        </div>
        
        <p>Une fois votre compte confirmé, vous pourrez vous connecter à l'adresse suivante : ${data.loginUrl}</p>
        
        <p>Si vous rencontrez des difficultés, n'hésitez pas à contacter le support technique.</p>
        
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
        <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
          Le lien de confirmation expirera dans 24 heures.
        </p>
      </div>
    `,
  };
}
