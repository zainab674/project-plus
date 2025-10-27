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
            
            // Configure ngrok with auth token if available
            const config = {
                addr: port,
                proto: 'http'
            };

            if (process.env.NGROK_AUTHTOKEN) {
                config.authtoken = process.env.NGROK_AUTHTOKEN;
            } else {
            }

            // Start the tunnel
            this.url = await ngrok.connect(config);
            this.tunnel = ngrok;
            this.isConnected = true;

            // Set the BASE_URL environment variable for webhook callbacks
            process.env.BASE_URL = this.url;
            
            return this.url;

        } catch (error) {
            this.isConnected = false;
            return null;
        }
    }

    async stopTunnel() {
        try {
            if (this.tunnel && this.isConnected) {
                await ngrok.disconnect();
                await ngrok.kill();
                this.isConnected = false;
                this.url = null;
                this.tunnel = null;
            }
        } catch (error) {
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
