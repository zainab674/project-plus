import axios from 'axios';

async function checkServerStatus() {
    try {
        // Try to connect to the server
        const response = await axios.get('http://localhost:4000/api/v1/twilio/voice');
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            // Server is not running
        } else if (error.response) {
            // Server responded with error
        } else {
            // Error occurred
        }
    }
}

checkServerStatus();
































