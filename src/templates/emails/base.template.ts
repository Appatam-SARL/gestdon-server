interface IBaseEmailContext {
  title: string;
  previewText?: string;
  content: string;
  footerLinks?: Array<{ text: string; url: string }>;
  year?: number;
}

/**
 * Template de base pour tous les emails
 * @param context Contenu de l'email
 * @returns Template HTML complet
 */
export function getBaseEmailTemplate(context: IBaseEmailContext): string {
  const currentYear = context.year || new Date().getFullYear();
  const previewText = context.previewText || '';

  // Liens de pied de page par défaut
  const defaultFooterLinks = [
    { text: 'Site Web', url: 'https://valdeli.com' },
    { text: 'Conditions', url: 'https://valdeli.com/conditions' },
    { text: 'Confidentialité', url: 'https://valdeli.com/confidentialite' },
  ];

  // Utiliser les liens personnalisés ou les liens par défaut
  const footerLinks = context.footerLinks || defaultFooterLinks;

  // Générer les liens de pied de page
  const footerLinksHtml = footerLinks
    .map(
      (link) =>
        `<a href="${link.url}" style="color: #777; text-decoration: none; margin: 0 10px;">${link.text}</a>`
    )
    .join(' | ');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>${context.title}</title>
      <!--[if mso]>
      <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
      </style>
      <![endif]-->
      
      <!-- Texte de prévisualisation des clients mail -->
      <meta name="description" content="${previewText}">
      <style>
        /* Styles de base */
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .header {
          background: linear-gradient(135deg, #FF5B00 0%, #FF8C00 100%);
          padding: 30px 20px;
          text-align: center;
        }
        
        .logo {
          max-width: 120px;
          margin-bottom: 15px;
        }
        
        .header h1 {
          color: white;
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        
        .content {
          padding: 30px;
        }
        
        .warning-box {
          background-color: #FFF5F5;
          border-left: 4px solid #FF5B00;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        
        .info-box {
          background-color: #F0F7FF;
          border-left: 4px solid #0066CC;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        
        .success-box {
          background-color: #F0FFF4;
          border-left: 4px solid #48BB78;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        
        .button {
          display: inline-block;
          background-color: #FF5B00;
          color: white !important;
          text-decoration: none;
          padding: 12px 25px;
          border-radius: 50px;
          font-weight: 600;
          margin: 15px 0;
          text-align: center;
        }
        
        .button:hover {
          background-color: #E65100;
        }
        
        .divider {
          height: 1px;
          background-color: #eaeaea;
          margin: 25px 0;
        }
        
        .footer {
          background-color: #f4f4f4;
          padding: 20px;
          text-align: center;
          color: #777;
          font-size: 12px;
        }
        
        .social-icons {
          margin: 15px 0;
        }
        
        .social-icons a {
          display: inline-block;
          margin: 0 8px;
        }
        
        /* Styles pour mobile */
        @media screen and (max-width: 480px) {
          .container {
            border-radius: 0;
          }
          
          .content {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
        ${previewText}
      </div>
      
      <div class="container">
        <div class="header">
          <h1>ValDeli</h1>
        </div>
        
        <div class="content">
          ${context.content}
        </div>
        
        <div class="footer">
          <p>ValDeli - Service de livraison instantanée</p>
          <div class="social-icons">
            <a href="https://facebook.com/valdeli" style="color: #1877F2;">Facebook</a>
            <a href="https://twitter.com/valdeli" style="color: #1DA1F2;">Twitter</a>
            <a href="https://instagram.com/valdeli" style="color: #E1306C;">Instagram</a>
          </div>
          <p>
            ${footerLinksHtml}
          </p>
          <p>Ce message est envoyé automatiquement, merci de ne pas y répondre.</p>
          <p>&copy; ${currentYear} ValDeli. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
