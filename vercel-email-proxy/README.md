# Email Proxy Configuration

This document explains how to configure the email proxy system for your application.

## Overview

The email proxy system allows you to send emails through a Vercel API when SMTP is blocked (e.g., on DigitalOcean). The system automatically falls back to direct SMTP if the proxy is unavailable.

## Environment Variables

### For Vercel Email Proxy API

Add these environment variables to your Vercel project:

```bash
# SMTP Configuration (same as your main app)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# API Security
EMAIL_PROXY_API_KEY=your-secure-api-key-here
```

### For Your Main Backend Application

Add these environment variables to your main application:

```bash
# Email Proxy Configuration
USE_EMAIL_PROXY=true
EMAIL_PROXY_URL=https://your-vercel-app.vercel.app
EMAIL_PROXY_API_KEY=your-secure-api-key-here

# Existing SMTP Configuration (kept as fallback)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

## Deployment Steps

### 1. Deploy Email Proxy to Vercel

1. Create a new Vercel project
2. Upload the `vercel-email-proxy` folder
3. Set the environment variables in Vercel dashboard
4. Deploy the project
5. Note the deployment URL (e.g., `https://your-app.vercel.app`)

### 2. Update Main Application

1. Set `EMAIL_PROXY_URL` to your Vercel deployment URL
2. Set `USE_EMAIL_PROXY=true` for production
3. Keep `USE_EMAIL_PROXY=false` for local development

## How It Works

1. **Primary Method**: When `USE_EMAIL_PROXY=true`, emails are sent via the Vercel API
2. **Fallback Method**: If proxy fails or is disabled, emails fall back to direct SMTP
3. **Automatic Retry**: If direct SMTP fails and proxy is available, it automatically tries the proxy

## Testing

### Test Email Proxy

```bash
curl -X POST https://your-vercel-app.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test Email</h1>",
    "apiKey": "your-secure-api-key-here"
  }'
```

### Test from Your Application

The email functions will automatically use the proxy when configured. Check your application logs to see which method is being used.

## Security Considerations

1. **API Key**: Use a strong, random API key for `EMAIL_PROXY_API_KEY`
2. **HTTPS**: Always use HTTPS for the proxy URL
3. **Rate Limiting**: Consider implementing rate limiting on the Vercel API
4. **CORS**: The proxy allows all origins - restrict if needed

## Troubleshooting

### Common Issues

1. **"Invalid API key"**: Check that `EMAIL_PROXY_API_KEY` matches in both applications
2. **"SMTP configuration missing"**: Ensure SMTP credentials are set in Vercel
3. **"Email proxy API error"**: Check Vercel deployment logs
4. **Emails not sending**: Check both proxy and fallback SMTP configurations

### Debug Mode

Enable debug logging by checking the console output in your application. The system logs which method (proxy or direct SMTP) is being used.

## Cost Considerations

- Vercel has generous free tier limits
- Each email sent via proxy counts as one API call
- Monitor usage in Vercel dashboard
- Consider upgrading Vercel plan if needed

## Migration Guide

### From Direct SMTP Only

1. Deploy the email proxy to Vercel
2. Add environment variables to your main app
3. Set `USE_EMAIL_PROXY=true`
4. Test email functionality
5. Monitor logs to ensure proxy is working

### Rollback Plan

If you need to disable the proxy:
1. Set `USE_EMAIL_PROXY=false`
2. Ensure direct SMTP credentials are working
3. Restart your application
