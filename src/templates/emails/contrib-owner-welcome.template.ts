interface IContributorOwnerWelcomeTemplate {
  firstName: string;
  name: string;
  password: string;
  loginUrl: string;
  confirmationUrl: string;
}

export function getContributorOwnerWelcomeTemplate(
  data: IContributorOwnerWelcomeTemplate
): {
  subject: string;
  html: string;
} {
  return {
    subject: `Contrib - Confirmation de votre compte`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2c3e50; text-align: center;">Bienvenue sur Contrib</h1>
        
        <p>Bonjour ${data.firstName},</p>
        
        <p>Félicitations ! Votre compte <strong>${
          data.name
        }</strong> a été créé avec succès. Voici les étapes à suivre pour activer votre compte et commencer.</p>
        
        <p>Voici vos identifiants de connexion :</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Mot de passe temporaire :</strong> ${
            data.password
          }</p>
        </div>
        
        <p><strong>Important :</strong> Pour des raisons de sécurité, vous devrez changer ce mot de passe lors de votre première connexion.</p>

        <p><strong>Étape suivante :</strong> Veuillez confirmer votre compte en cliquant sur le bouton ci-dessous :</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.confirmationUrl}" 
             style="background-color: #2ecc71; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Confirmer mon compte
          </a>
        </div>
        
        <p>Une fois votre compte confirmé, vous pourrez vous connecter à votre espace à l'adresse suivante : ${
          data.loginUrl
        }</p>
        
        <p>Votre compte est actuellement en attente de validation. Notre équipe vérifiera vos informations dans les plus brefs délais.</p>
        
        <h3 style="color: #2c3e50;">Prochaines étapes :</h3>
        <ol>
          <li>Confirmez votre compte via le lien ci-dessus</li>
          <li>Configurer les champs de saisie personnalisés</li>
        </ol>
        
        <p>Si vous avez des questions ou besoin d'assistance, n'hésitez pas à contacter notre support partenaire à <a href="mailto:info@appatam.com">info@appatam.com</a>.</p>
        
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Contrib. Tous droits réservés.<br>
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
        <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
          Le lien de confirmation expirera dans 24 heures.
        </p>
      </div>
    `,
  };
}
