import ngrok from 'ngrok';
import "dotenv/config";

class NgrokService {
    constructor() {
        this.tunnel = null;
        this.url = null;
        this.isConnected = false;
    }

    async startTunnel(port = 4000) {
        try {
            console.log('🚇 Starting ngrok tunnel...');
            
            // Configure ngrok with auth token if available
            const config = {
                addr: port,
                proto: 'http'
            };

            if (process.env.NGROK_AUTHTOKEN) {
                config.authtoken = process.env.NGROK_AUTHTOKEN;
                console.log('🔑 Using ngrok auth token');
            } else {
                console.log('⚠️  No NGROK_AUTHTOKEN found - using free tier');
            }

            // Start the tunnel
            this.url = await ngrok.connect(config);
            this.tunnel = ngrok;
            this.isConnected = true;

            console.log('✅ ngrok tunnel established successfully!');
            console.log(`🌐 Public URL: ${this.url}`);
            console.log(`📞 TwiML Voice Webhook: ${this.url}/api/v1/twilio/voice-webhook`);
            console.log(`📹 Recording Status Webhook: ${this.url}/api/v1/twilio/recording-status`);
            
            // Set the BASE_URL environment variable for webhook callbacks
            process.env.BASE_URL = this.url;
            
            return this.url;

        } catch (error) {
            console.error('❌ Failed to start ngrok tunnel:', error.message);
            console.log('💡 Make sure ngrok is installed and your auth token is valid');
            console.log('💡 You can still use the app locally without ngrok');
            this.isConnected = false;
            return null;
        }
    }

    async stopTunnel() {
        try {
            if (this.tunnel && this.isConnected) {
                console.log('🛑 Stopping ngrok tunnel...');
                await ngrok.disconnect();
                await ngrok.kill();
                this.isConnected = false;
                this.url = null;
                this.tunnel = null;
                console.log('✅ ngrok tunnel stopped');
            }
        } catch (error) {
            console.error('❌ Error stopping ngrok tunnel:', error.message);
        }
    }

    getUrl() {
        return this.url;
    }

    isTunnelActive() {
        return this.isConnected;
    }

    // Get webhook URLs for Twilio configuration
    getWebhookUrls() {
        if (!this.isConnected || !this.url) {
            return {
                voiceWebhook: null,
                recordingStatusWebhook: null
            };
        }

        return {
            voiceWebhook: `${this.url}/api/v1/twilio/voice-webhook`,
            recordingStatusWebhook: `${this.url}/api/v1/twilio/recording-status`
        };
    }
}

// Create singleton instance
const ngrokService = new NgrokService();

export default ngrokService;
