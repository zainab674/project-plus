export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests for this test endpoint
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Only GET requests are accepted.' 
    });
  }

  try {
    return res.status(200).json({
      success: true,
      message: 'Email proxy API is working!',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        sendEmail: '/api/send-email'
      },
      note: 'This is a public test endpoint'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
