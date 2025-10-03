export function generateMeetingUpdateHtml({ meetingTitle, meetingDescription, scheduledTime, meetingStatus, participants, meetingLink }) {
  // Generate the participant table rows
  let participantRows = participants.map(participant => {
    return `
        <tr>
          <td>${participant.user.name}</td>
          <td>${participant.vote == "PENDING" ? "NO RESPONSE" : participant.vote}</td>
        </tr>
      `;
  }).join('');

  // Return the full HTML email content
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Meeting Information</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
          h1 {
            text-align: center;
            color: #333;
          }
          .details {
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          table th, table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          table th {
            background-color: #f4f4f4;
          }
          .buttons {
            text-align: center;
          }
          .button {
            padding: 10px 20px;
            margin: 0 10px;
            border: none;
            border-radius: 5px;
            color: white;
            font-size: 16px;
            cursor: pointer;
          }
          .scheduled {
            background-color: #4CAF50;
          }
          .canceled {
            background-color: #f44336;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Meeting Information</h1>
          <div class="details">
            <p><strong>Title:</strong> ${meetingTitle}</p>
            <p><strong>Description:</strong> ${meetingDescription}</p>
            <p><strong>Scheduled Time:</strong> ${scheduledTime}</p>
            <p><strong>Joining Link:</strong> ${meetingLink}</p>
          </div>
          <h3>Meeting Status: ${meetingStatus}</h3>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Vote Status</th>
              </tr>
            </thead>
            <tbody>
              ${participantRows}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
}
