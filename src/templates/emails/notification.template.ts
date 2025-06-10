interface INotificationTemplate {
  title: string;
  body: string;
  type: 'ORDER' | 'PAYMENT' | 'SYSTEM' | 'PROMOTION';
  data?: Record<string, any>;
  actionUrl?: string;
  actionText?: string;
}

export function getNotificationTemplate(data: INotificationTemplate): {
  subject: string;
  html: string;
} {
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'ORDER':
        return '#2ecc71';
      case 'PAYMENT':
        return '#3498db';
      case 'SYSTEM':
        return '#e74c3c';
      case 'PROMOTION':
        return '#f1c40f';
      default:
        return '#2c3e50';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'ORDER':
        return '📦';
      case 'PAYMENT':
        return '💳';
      case 'SYSTEM':
        return '⚙️';
      case 'PROMOTION':
        return '🎉';
      default:
        return '📢';
    }
  };

  return {
    subject: `ValDeli - ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="font-size: 32px;">${getTypeIcon(data.type)}</span>
        </div>
        
        <h1 style="color: ${getTypeColor(data.type)}; text-align: center;">${
      data.title
    }</h1>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; line-height: 1.6;">${data.body}</p>
        </div>
        
        ${
          data.actionUrl && data.actionText
            ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.actionUrl}" 
               style="background-color: ${getTypeColor(
                 data.type
               )}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              ${data.actionText}
            </a>
          </div>
        `
            : ''
        }
        
        ${
          data.data
            ? `
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Détails supplémentaires :</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${Object.entries(data.data)
                .map(
                  ([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`
                )
                .join('')}
            </ul>
          </div>
        `
            : ''
        }
        
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} ValDeli. Tous droits réservés.<br>
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    `,
  };
}
