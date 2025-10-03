export function generateMeetingInfoHtml(participants, recipientUser, meetingDetails, scheduledLink, CanceledLink) {
  const { title, description, scheduledTime } = meetingDetails;

  const participantRows = participants
    .map(participant => {
      return `
          <tr>
            <td>${participant.user.name}</td>
            <td>${participant.vote == "PENDING" ? "NO RESPONSE" : participant.vote}</td>
          </tr>
        `;
    })
    .join("");

  const emailHTML = `
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
            <p><strong>Recipient:</strong> ${recipientUser.name} (${recipientUser.email})</p>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Description:</strong> ${description}</p>
            <p><strong>Scheduled Time:</strong> ${scheduledTime}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              ${participantRows}
            </tbody>
          </table>
          <div class="buttons">
            <button class="button scheduled">
                <a href="${scheduledLink}">
                    Scheduled
                </a>
            </button>
            <button class="button canceled">
                <a href="${CanceledLink}">
                    Canceled
                </a>
            </button>
          </div>
        </div>
      </body>
      </html>
    `;

  return emailHTML;
}


