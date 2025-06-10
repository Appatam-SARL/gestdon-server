import { getBaseEmailTemplate } from './base.template';

interface IAdminInvitationTemplate {
  invitedEmail: string;
  invitingAdminFirstName: string;
  invitingAdminLastName: string;
  registrationUrl: string;
}

export function getAdminInvitationTemplate(data: IAdminInvitationTemplate): {
  subject: string;
  html: string;
} {
  const subject = 'Invitation à rejoindre ValDeli - Créez votre compte Admin';

  const html = `
    <p>Bonjour,</p>
    <p>Vous avez été invité(e) par ${data.invitingAdminFirstName} ${data.invitingAdminLastName} à rejoindre la plateforme d'administration ValDeli.</p>
    <p>Pour créer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
    <p><a href="${data.registrationUrl}">Créer mon compte Admin</a></p>
    <p>Ce lien est personnel et valide pour une durée limitée. Ne le partagez pas.</p>
    <br>
    <p>À bientôt,</p>
    <p>L'équipe ValDeli</p>
  `;

  return {
    subject,
    html: getBaseEmailTemplate({
      title: 'Invitation à créer votre compte Admin',
      previewText: `Demande de création de compte Admin`,
      content: html,
    }),
  };
}
