// Test script for the email proxy API
const testEmailProxy = async () => {
    const API_URL = 'https://vercel-email-proxy.vercel.app';
    const API_KEY = 'zainab'; // The API key we set earlier
    
    console.log('🧪 Testing Email Proxy API...');
    console.log('URL:', API_URL);
    
    try {
        // Test health endpoint
        console.log('\n1. Testing health endpoint...');
        const healthResponse = await fetch(`${API_URL}/api/health`);
        const healthData = await healthResponse.json();
        console.log('Health check result:', healthData);
        
        // Test email sending (with a test email)
        console.log('\n2. Testing email sending...');
        const emailData = {
            to: 'test@example.com', // Replace with your actual email for testing
            subject: 'Test Email from Vercel Proxy',
            html: '<h1>Test Email</h1><p>This is a test email sent via the Vercel proxy API.</p>',
            apiKey: API_KEY
        };
        
        const emailResponse = await fetch(`${API_URL}/api/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData)
        });
        
        const emailResult = await emailResponse.json();
        console.log('Email sending result:', emailResult);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

// Run the test
testEmailProxy();
