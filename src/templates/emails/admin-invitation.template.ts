import { getBaseEmailTemplate } from './base.template';

interface IAdminInvitationTemplate {
  invitingAdminFirstName: string;
  invitingAdminLastName: string;
  registrationUrl: string;
}

export function getAdminInvitationTemplate(data: IAdminInvitationTemplate): {
  subject: string;
  html: string;
} {
  const subject =
    'Invitation à rejoindre Contrib - Créez votre compte Utilisateur';

  const html = `
    <p>Bonjour,</p>
    <p>Vous avez été invité(e) par <strong>${data.invitingAdminFirstName} ${data.invitingAdminLastName}</strong> à rejoindre la plateforme de gestion des activitées appelée <strong>Contrib</strong>.</p>
    <p>Pour créer votre compte, <strong>veuillez cliquer sur le lien ci-dessous</strong> :</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.registrationUrl}" 
         style="background-color: #2ecc71; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        Créer mon compte Utilisateur
      </a>
    </div>
   
    <p>Ce lien est personnel et valide pour une durée de 30 Jours. Ne le partagez pas.</p>
    <br>
    <p>À bientôt,</p>
    <p>L'équipe Appatam</p>
  `;

  return {
    subject,
    html: getBaseEmailTemplate({
      title: 'Invitation à créer votre compte Utilisateur',
      previewText: `Demande de création de compte Utilisateur`,
      content: html,
    }),
  };
}
