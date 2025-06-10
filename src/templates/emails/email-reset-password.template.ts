import { EmailTemplate } from '../../types/email.types';

interface EmailResetPassword {
  firstName: string;
  resetUrl: string;
}

export const getEmailResetPasswordTemplate = ({
  firstName,
  resetUrl,
}: EmailResetPassword): EmailTemplate => {
  return {
    subject: 'Modification de votre mot de passe Gescom',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Validation de changement d'email</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #FF6B6B;
              color: white;
              padding: 20px;
              text-align: center;
            }
            .content {
              padding: 20px;
              background-color: #ffffff;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #FF6B6B;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background-color: #fff3cd;
              border: 1px solid #ffeeba;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Validation de changement d'email</h1>
            </div>
            <div class="content">
              <p>Bonjour ${firstName},</p>
              
              <p>Vous avez demandé à changer votre mot de passe sur Gescom :</p>

              <div class="warning">
                <p>⚠️ Pour des raisons de sécurité, veuillez confirmer ce changement en cliquant sur le bouton ci-dessous :</p>
              </div>

              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Cliquez ici pour proceder à la modification de votre mot de passe</a>
              </p>

              <p>Si vous n'avez pas demandé ce changement, veuillez ignorer cet email ou contacter notre support.</p>

              <p>Ce lien est valable pendant 30 minutes.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ValDeli. Tous droits réservés.</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Bonjour ${firstName},

      Vous avez demandé à changer votre adresse email sur Gescom :

      Pour des raisons de sécurité, veuillez confirmer ce changement en visitant le lien suivant :
      ${resetUrl}

      Si vous n'avez pas demandé ce changement, veuillez ignorer cet email ou contacter notre support.

      Ce lien est valable pendant 30 minutes.

      © ${new Date().getFullYear()} ValDeli. Tous droits réservés.
      Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    `,
  };
};
