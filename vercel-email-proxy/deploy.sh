#!/bin/bash

# Email Proxy Deployment Script
# This script helps deploy the email proxy to Vercel

echo "🚀 Email Proxy Deployment Script"
echo "================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the vercel-email-proxy directory"
    exit 1
fi

echo "✅ In correct directory"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Vercel dashboard:"
echo "   - SMTP_USER"
echo "   - SMTP_PASS" 
echo "   - EMAIL_PROXY_API_KEY"
echo ""
echo "2. Update your main application with:"
echo "   - EMAIL_PROXY_URL=https://your-app.vercel.app"
echo "   - USE_EMAIL_PROXY=true"
echo "   - EMAIL_PROXY_API_KEY=your-secure-api-key"
echo ""
echo "3. Test the email functionality"
echo ""
echo "📖 For detailed instructions, see README.md"
