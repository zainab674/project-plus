export function generateMeetingInvitation({
    heading,
    recipientName,
    scheduledTime,
    meetingDescription,
    acceptLink,
    cancelLink,
    senderName,
    companyName,
    companyLogo,
    companyDetails
}) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Meeting Invitation</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background-color: #f8f9fa;
                    margin: 0;
                    padding: 0;
                }
                .email-container {
                    background-color: #ffffff;
                    padding: 20px;
                    max-width: 600px;
                    margin: 30px auto;
                    border-radius: 8px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                    overflow: hidden;
                }
                .header {
                    text-align: center;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #e9ecef;
                }
                .header img {
                    max-height: 50px;
                    margin-bottom: 10px;
                }
                .header h2 {
                    font-size: 18px;
                    color: #495057;
                    margin: 0;
                }
                h1 {
                    color: #343a40;
                    font-size: 24px;
                    text-align: center;
                    margin: 20px 0;
                }
                p {
                    color: #6c757d;
                    font-size: 16px;
                    line-height: 1.5;
                }
                .details {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                    border: 1px solid #e9ecef;
                }
                .details strong {
                    color: #495057;
                }
                .buttons {
                    text-align: center;
                    margin-top: 20px;
                }
                .btn {
                    display: inline-block;
                    padding: 12px 20px;
                    font-size: 16px;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 0 10px;
                    transition: background-color 0.3s ease;
                }
                .btn.accept {
                    background-color: #28a745;
                }
                .btn.accept:hover {
                    background-color: #218838;
                }
                .btn.cancel {
                    background-color: #dc3545;
                }
                .btn.cancel:hover {
                    background-color: #c82333;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    color: #adb5bd;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <!-- Company Logo and Details -->
                <div class="header">
                    <img src="${companyLogo}" alt="${companyName} Logo">
                    <h2>${companyName}</h2>
                    <p>${companyDetails}</p>
                </div>
                <!-- Meeting Invitation Content -->
                <h1>${heading}</h1>
                <p>Dear ${recipientName},</p>
                <div class="details">
                    <p><strong>Scheduled Time:</strong> ${scheduledTime}</p>
                    <p><strong>Description:</strong> ${meetingDescription}</p>
                </div>
                <p>Please choose one of the following options:</p>
                <div class="buttons">
                    <a href="${acceptLink}" class="btn accept">Accept</a>
                    <a href="${cancelLink}" class="btn cancel">Cancel</a>
                </div>
                <p>We look forward to your participation!</p>
                <div class="footer">
                    <p>Best regards,<br>${senderName}<br>${companyName}</p>
                </div>
            </div>
        </body>
        </html>
    `;
}