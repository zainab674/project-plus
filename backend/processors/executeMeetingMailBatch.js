import { generateMeetingInvitation } from "./generateMeetingInvitationProcessor.js";
import { sendMail } from "./sendMailProcessor.js";

// Function to send email (simulated)
export async function executeUpdateMailsBatch(html, batch) {
  for (const item of batch) {
    const { email } = item.user;
    await sendMail("Meeting Update: Scheduled/Canceled and Voting Status", email, html);
  }
  console.log('Batch sent successfully!');
}