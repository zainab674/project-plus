# Environment Variables Documentation

This document describes all environment variables used by the project-plus backend.

## Server Configuration
- `PORT`: Backend server port (default: 4000)
- `NODE_ENV`: Environment (development/production)

## Database Configuration
- `DATABASE_URL`: PostgreSQL database connection string
- `POSTGRES_USER`: PostgreSQL username
- `POSTGRES_PASSWORD`: PostgreSQL password
- `POSTGRES_DB`: PostgreSQL database name
- `POSTGRES_HOST`: PostgreSQL host (default: localhost)
- `POSTGRES_PORT`: PostgreSQL port (default: 5432)

## Frontend Configuration
- `FRONTEND_URL`: Frontend URL for CORS configuration

## Authentication & Security
- `JWT_SECRET`: JWT secret key for token signing
- `JWT_EXPIRE`: JWT expiration time (default: 7d)
- `COOKIE_EXPIRE`: Cookie expiration time (default: 7)

## Email Configuration
- `EMAIL_HOST`: SMTP host for email sending
- `EMAIL_PORT`: SMTP port (default: 587)
- `EMAIL_USER`: SMTP username
- `EMAIL_PASS`: SMTP password
- `EMAIL_FROM`: From email address

## Email Proxy Configuration (For DigitalOcean/Blocked SMTP)
- `USE_EMAIL_PROXY`: Enable email proxy (true/false, default: false)
- `EMAIL_PROXY_URL`: Vercel email proxy API URL
- `EMAIL_PROXY_API_KEY`: API key for email proxy authentication

## Twilio Configuration (Required for Voice Bot)
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_API_KEY`: Twilio API key
- `TWILIO_API_SECRET`: Twilio API secret
- `TWILIO_TWIML_APP_SID`: Twilio TwiML application SID
- `TWILIO_PHONE_NUMBER`: Twilio phone number for outgoing calls

## ngrok Configuration (Optional - for Development)
- `NGROK_AUTHTOKEN`: ngrok authentication token for tunnel creation
- `NGROK_URL`: Automatically set by the application when tunnel is established
- `BACKEND_URL`: Fallback backend URL when ngrok is not available

## Cloudinary Configuration (Optional - for file uploads)
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret

## Redis Configuration (Optional - for caching and sessions)
- `REDIS_URL`: Redis connection URL (e.g., redis://localhost:6379)
- `REDIS_HOST`: Redis host (default: localhost)
- `REDIS_PORT`: Redis port (default: 6379)
- `REDIS_PASSWORD`: Redis password (if required)

## Kafka Configuration (Optional - for message queuing)
- `KAFKA_BROKER`: Kafka broker URL
- `KAFKA_CLIENT_ID`: Kafka client ID
- `KAFKA_GROUP_ID`: Kafka consumer group ID

## Google OAuth Configuration (Optional)
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_CALLBACK_URL`: Google OAuth callback URL

## LiveKit Configuration (Required for Video Meetings)
- `LIVEKIT_URL`: LiveKit WebSocket URL (e.g., wss://your-project.livekit.cloud)
- `LIVEKIT_HOST`: LiveKit HTTP API host (e.g., https://your-project.livekit.cloud)
- `LIVEKIT_API_KEY`: LiveKit API key
- `LIVEKIT_API_SECRET`: LiveKit API secret

## AI/ML Services (Optional)
- `OPENAI_API_KEY`: OpenAI API key for AI responses
- `DEEPGRAM_API_KEY`: Deepgram API key for speech-to-text
- `CARTESIA_API_KEY`: Cartesia API key for text-to-speech

## API Endpoints

The following API endpoints are available:

- **Twilio Token Generation**: `{BASE_URL}/api/v1/twilio/token`
- **General API Base**: `{BASE_URL}/api/v1/`

Note: This implementation supports outgoing calls only. No webhook endpoints are needed for incoming calls.

## Setup Instructions

### 1. Basic Setup
1. Copy `.env.example` to `.env` (if available)
2. Fill in the required environment variables
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start the development server

### 2. ngrok Setup (Optional - for Development)
Since this implementation only supports outgoing calls, ngrok is optional and not required for basic functionality. However, you can still use it for development purposes:

1. Sign up for a free ngrok account at [ngrok.com](https://ngrok.com)
2. Get your auth token from the ngrok dashboard
3. Add `NGROK_AUTHTOKEN=your_token_here` to your `.env` file
4. Start the backend server - ngrok tunnel will be created automatically
5. The ngrok URL will be displayed for any external integrations you might need

### 3. Twilio Setup (for Outgoing Calls)
1. Configure all required Twilio environment variables
2. Create a TwiML Application in your Twilio Console
3. Test token generation by calling the `/api/v1/twilio/token` endpoint
4. Use the generated token in your frontend to make outgoing calls

## Environment File Example

```env
# Server Configuration
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/project_plus
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=project_plus
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
COOKIE_EXPIRE=7

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@projectplus.com

# Email Proxy (For DigitalOcean/Blocked SMTP)
USE_EMAIL_PROXY=true
EMAIL_PROXY_URL=https://vercel-email-proxy.vercel.app
EMAIL_PROXY_API_KEY=zainab

# Twilio (Required for Voice Bot)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_API_KEY=your_twilio_api_key
TWILIO_API_SECRET=your_twilio_api_secret
TWILIO_TWIML_APP_SID=your_twiml_app_sid
TWILIO_PHONE_NUMBER=+1234567890

# LiveKit (Required for Video Meetings)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_HOST=https://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# ngrok (Optional - for Webhook Development)
NGROK_AUTHTOKEN=your_ngrok_auth_token

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# AI Services (Optional)
OPENAI_API_KEY=your_openai_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
```

## Troubleshooting

### ngrok Issues
- Ensure `NGROK_AUTHTOKEN` is correctly set
- Check that ngrok is not blocked by firewall
- Verify the tunnel URL is accessible from external services

### Twilio Token Issues
- Verify all Twilio environment variables are set correctly
- Check JWT authentication is working
- Ensure rate limits are not exceeded
- Verify TwiML App SID is correct

### Database Connection Issues
- Verify database credentials are correct
- Ensure PostgreSQL is running
- Check database URL format

### Email Issues
- Verify SMTP credentials
- Check email provider's security settings
- Ensure proper email permissions
- For DigitalOcean deployments: Enable `USE_EMAIL_PROXY=true` and configure proxy settings
- Verify email proxy API key and URL are correct

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Regularly rotate API keys and tokens
- Monitor webhook endpoints for unauthorized access
- Use HTTPS in production environments
