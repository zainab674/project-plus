import axios from 'axios';

async function checkServerStatus() {
    try {
        console.log('🔍 Checking server status...\n');
        
        // Try to connect to the server
        const response = await axios.get('http://localhost:4000/api/v1/twilio/voice');
        
        console.log('✅ Server is running!');
        console.log('Status:', response.status);
        console.log('Response:', response.data);
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Server is not running');
            console.log('Please start your server with: npm start');
        } else if (error.response) {
            console.log('⚠️ Server responded with error:', error.response.status);
        } else {
            console.log('❌ Error:', error.message);
        }
    }
}

checkServerStatus();






























