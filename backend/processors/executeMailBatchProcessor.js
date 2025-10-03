import { generateMeetingInvitation } from "./generateMeetingInvitationProcessor.js";
import { sendMail } from "./sendMailProcessor.js";

// Function to send email (simulated)
export async function executeBatchMail(batch, heading, description, meeting_id, date, time, senderName, sendEmail) {
  for (const item of batch) {
    const { email, name, user_id } = item.user;
    if (sendEmail == email) continue;
    const meetingInfo = {
      heading,
      recipientName: name,
      scheduledTime: `${date} ${time}`,
      meetingDescription: description,
      acceptLink: `${process.env.BACKEND_URL}/api/v1/meeting/vote/${meeting_id}?user_id=${user_id}&vote=1`,
      cancelLink: `${process.env.BACKEND_URL}/api/v1/meeting/vote/${meeting_id}?user_id=${user_id}&vote=0`,
      senderName,
      companyName: "TechCorp Inc.",
      companyLogo: "https://via.placeholder.com/150", // Replace with your company logo URL
      companyDetails: "1234 Elm Street, Business City, BC 56789 | info@techcorp.com"
    };

    const html = generateMeetingInvitation(meetingInfo);
    await sendMail("Meeting Invitation", email, html);
  }
  console.log('Batch sent successfully!');
}