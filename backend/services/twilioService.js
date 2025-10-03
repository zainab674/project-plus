import twilio from "twilio"
import "dotenv/config"


export const generateToken = async (twilioFromNumber, userId = null) => {
    try {
        // Validate required environment variables
        const requiredEnvVars = {
            TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
            TWILIO_API_KEY: process.env.TWILIO_API_KEY,
            TWILIO_API_SECRET: process.env.TWILIO_API_SECRET,
            TWILIO_TWIML_APP_SID: process.env.TWILIO_TWIML_APP_SID
        };

        for (const [key, value] of Object.entries(requiredEnvVars)) {
            if (!value) {
                throw new Error(`Missing required environment variable: ${key}`);
            }
        }

        const AccessToken = twilio.jwt.AccessToken;
        const VoiceGrant = AccessToken.VoiceGrant;

        const twilioAccountSid = requiredEnvVars.TWILIO_ACCOUNT_SID;
        const twilioApiKey = requiredEnvVars.TWILIO_API_KEY;
        const twilioApiSecret = requiredEnvVars.TWILIO_API_SECRET;
        const outgoingApplicationSid = requiredEnvVars.TWILIO_TWIML_APP_SID;
        
        // Log credentials for debugging (mask sensitive parts)
        console.log('Twilio Account SID:', twilioAccountSid.substring(0, 8) + '***');
        console.log('Twilio API Key:', twilioApiKey.substring(0, 8) + '***');
        console.log('Twilio TwiML App SID:', outgoingApplicationSid.substring(0, 8) + '***');
        
        // Create user-specific identity
        const identity = userId ? `user_${userId}` : `user_${Date.now()}`;

        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: outgoingApplicationSid,
            incomingAllow: true,
        });

        // Create token with expiration (1 hour)
        const token = new AccessToken(
            twilioAccountSid,
            twilioApiKey,
            twilioApiSecret,
            { 
                identity: identity,
                ttl: 3600 // 1 hour expiration
            }
        );
        token.addGrant(voiceGrant);

        return {
            token: token.toJwt(), 
            from: twilioFromNumber,
            identity: identity,
            expiresAt: Date.now() + 3600000 // 1 hour from now
        };

    } catch (error) {
        console.error('Token generation error:', error.message);
        throw new Error(`Failed to generate Twilio token: ${error.message}`);
    }
}