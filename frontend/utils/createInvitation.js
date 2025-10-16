export function generateInvitation(inviteLink, projectName, userName, userRole, invitedRole, isClient, legalRole) {
  // For client invitations
  if (invitedRole === 'CLIENT' || isClient === 'True') {
    return `Dear Client,

We are excited to invite you to join our project management platform for "${projectName}".

As a client, you will have access to:
• Real-time project updates and progress tracking
• Direct communication with the project team
• Document sharing and collaboration tools
• Project timeline and milestone visibility

To access your project dashboard, please click the link below:
${inviteLink}

This link will give you secure access to view and interact with your project.

We look forward to providing you with excellent service and keeping you informed every step of the way.

Best regards,
${userName}
${userRole}

---
If you have any questions, please don't hesitate to contact us.`;
  }

  // For team member invitations (project-specific or general)
  if (invitedRole === 'TEAM' || invitedRole === 'BILLER') {
    const roleText = invitedRole === 'BILLER' ? 'Biller' : 'Team Member';
    const legalRoleText = legalRole && legalRole !== 'CUSTOM' ? ` (${legalRole.replace('_', ' ')})` : '';
    
    // Check if this is a project-specific invitation
    const isProjectSpecific = projectName && projectName !== '';
    
    return `Dear ${roleText}${legalRoleText},

We are excited to invite you to join our team on the FlexyWexy project management platform${isProjectSpecific ? ` for the "${projectName}" project` : ''}.

As a ${roleText.toLowerCase()}, you will have access to:
• Project collaboration and task management
• Team communication tools
• Document sharing and editing capabilities
• Real-time project updates and progress tracking
• Billing and time tracking features (if applicable)${isProjectSpecific ? `
• Direct access to the "${projectName}" project` : ''}

To join our team${isProjectSpecific ? ' and project' : ''}, please click the link below:
${inviteLink}

This invitation link will expire in 7 days for security purposes.

We look forward to working with you and having you as part of our team${isProjectSpecific ? ' on this project' : ''}!

Best regards,
${userName}
${userRole}

---
If you have any questions, please don't hesitate to contact us.`;
  }

  // For team member invitations (keeping this for future use)
  return `Dear Team Member,

We are excited to invite you to join our team on the FlexyWexy project management platform.

As a team member, you will have access to:
• Project collaboration and task management
• Team communication tools
• Document sharing and editing capabilities
• Real-time project updates and progress tracking

To join our team, please click the link below:
${inviteLink}

This invitation link will expire in 7 days for security purposes.

We look forward to working with you and having you as part of our team!

Best regards,
${userName}
${userRole}

---
If you have any questions, please don't hesitate to contact us.`;
}