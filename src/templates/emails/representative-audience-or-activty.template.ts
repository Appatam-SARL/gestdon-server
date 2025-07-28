import { EmailTemplate } from '../../types/email.types';

interface EmailAssignRepresentativeTemplateProps {
  firstName: string;
  url: string;
}

export const getEmailAssignRepresentativeTemplate = ({
  firstName,
  url,
}: EmailAssignRepresentativeTemplateProps): EmailTemplate => {
  return {
    subject: "Rapport d'activité ou d'audience",
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
            .content {
              padding: 20px;
              background-color: #ffffff;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #2ecc71;
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
              <h1>Rapport d'activité ou d'audience</h1>
            </div>
            <div class="content">
              <p>Bonjour ${firstName},</p>
              
              <p>Vous devez renseigner ce formulaire pour faire votre rapport sur l'activité ou l'audience en cliquant sur le bouton ci-dessous :</p>
              <p style="text-align: center;">
                <a href="${url}" class="button">Valider le rapport</a>
              </p>

              <p>Si vous n'avez pas demandé ce rapport, veuillez ignorer cet email ou contacter notre support.</p>

              <p>Ce lien est valable pendant 1 an.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Contrib. Tous droits réservés.</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Bonjour ${firstName},

      Vous devez renseigner ce formulaire pour faire votre rapport sur l'activité ou l'audience en cliquant sur le bouton ci-dessous : ${url}

      Si vous n'avez pas demandé ce changement, veuillez ignorer cet email ou contacter notre support.

      Ce lien est valable pendant 1 an.

      © ${new Date().getFullYear()} Contrib. Tous droits réservés.
      Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    `,
  };
};
