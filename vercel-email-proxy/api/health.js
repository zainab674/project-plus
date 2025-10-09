export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Only GET requests are accepted.' 
    });
  }

  try {
    // Check if SMTP credentials are configured
    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    
    return res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      smtpConfigured,
      smtpUser: process.env.SMTP_USER ? 'SET' : 'NOT_SET',
      smtpPass: process.env.SMTP_PASS ? 'SET' : 'NOT_SET',
      version: '1.0.0',
      message: 'Email proxy API is running'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
