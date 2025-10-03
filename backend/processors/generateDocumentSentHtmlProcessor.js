export function generateDocumentSentHtml(documentName, description, senderName) {
    const emailHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document Sent</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
            background-color: #f8f9fa;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background-color: #ffffff;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
          }
          h1 {
            text-align: center;
            color: #333;
            margin-bottom: 20px;
          }
          .document-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            border: 1px solid #e9ecef;
          }
          .document-info h3 {
            color: #495057;
            margin-top: 0;
          }
          .document-info p {
            color: #6c757d;
            margin: 5px 0;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #adb5bd;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
            padding-top: 20px;
          }
          .highlight {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 10px;
            border-radius: 4px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📄 Document Sent</h1>
          
          <p>Hello,</p>
          
          <p>A document has been sent to you by <strong>${senderName}</strong>.</p>
          
          <div class="document-info">
            <h3>Document Details:</h3>
            <p><strong>Document Name:</strong> ${documentName}</p>
            <p><strong>Description:</strong> ${description}</p>
          </div>
          
          <div class="highlight">
            <p><strong>Note:</strong> This document has been uploaded to your account. You can access it through your dashboard.</p>
          </div>
          
          <p>Please log in to your account to view and manage this document.</p>
          
          <div class="footer">
            <p>Best regards,<br>${senderName}</p>
            <p>This is an automated message from the FlexyWexy platform.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return emailHTML;
} 