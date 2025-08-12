# API Keys Setup Guide

This guide will help you find and configure the API keys needed for the social media monitoring feature.

## 🔑 Required API Keys

### 1. Twitter API v2 Bearer Token

**Where to get it:**
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Sign in with your Twitter account
3. Create a new app or use an existing one
4. Navigate to "Keys and Tokens" in the left sidebar
5. Under "Authentication Tokens", click "Generate" next to "Bearer Token"
6. Copy the generated token

**Add to your `.env` file:**
```bash
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

### 2. Instagram API Credentials

**Where to get them:**
1. Go to [Facebook Developers Portal](https://developers.facebook.com/)
2. Sign in with your Facebook account
3. Create a new app or use an existing one
4. Add the "Instagram Basic Display" or "Instagram Graph API" product
5. Go to "Instagram Basic Display" → "Basic Display"
6. Generate a User Token
7. Copy both the Access Token and App ID

**Add to your `.env` file:**
```bash
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
INSTAGRAM_APP_ID=your_instagram_app_id_here
```

## 📍 Finding Your .env File

### Option 1: Check if .env exists
```bash
# In your project root directory
ls -la | grep .env
```

### Option 2: Create .env file
If no .env file exists, create one:
```bash
# In your project root directory
touch .env
```

### Option 3: Check common locations
Look for .env files in:
- Project root: `/Users/davidcapener/incommand/.env`
- Hidden files: Press `Cmd + Shift + .` in Finder to show hidden files

## 🔍 Current Environment Variables

Check what's already in your .env file:
```bash
cat .env
```

## 📝 Complete .env Template

Here's what your .env file should look like:

```bash
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Weather API Configuration
OPENWEATHER_API_KEY=your_openweather_api_key_here

# What3Words Configuration
WHAT3WORDS_API_KEY=your_what3words_api_key_here

# Social Media API Configuration
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
INSTAGRAM_APP_ID=your_instagram_app_id_here
```

## 🚀 Quick Setup Commands

### 1. Check current environment
```bash
cd /Users/davidcapener/incommand
ls -la .env*
```

### 2. Create .env if it doesn't exist
```bash
touch .env
```

### 3. Add your API keys
```bash
echo "TWITTER_BEARER_TOKEN=your_token_here" >> .env
echo "INSTAGRAM_ACCESS_TOKEN=your_token_here" >> .env
echo "INSTAGRAM_APP_ID=your_app_id_here" >> .env
```

### 4. Restart your development server
```bash
npm run dev
```

## 🔧 Troubleshooting

### "API key not found" errors
- Make sure your .env file is in the project root
- Restart your development server after adding keys
- Check for typos in variable names

### Twitter API errors
- Ensure your Twitter app has the correct permissions
- Check if your Bearer Token is valid
- Verify your app is approved for the endpoints you're using

### Instagram API errors
- Make sure your Facebook app is properly configured
- Check if your access token hasn't expired
- Verify you have the correct permissions

## 📊 Testing Your Setup

Once you've added the API keys:

1. **Restart your development server**
2. **Click on the Social Pulse card** in your dashboard
3. **Check the browser console** for any API errors
4. **Look for real posts** instead of mock data

## 🎯 What You'll See

**With API keys:**
- Real Twitter and Instagram posts
- Actual timestamps and engagement metrics
- Live sentiment analysis

**Without API keys (current state):**
- Realistic mock data
- Event security-related posts
- Simulated engagement metrics

## 🔒 Security Notes

- Never commit your .env file to git
- Keep your API keys secure
- Rotate keys regularly
- Use environment-specific keys for production

## 📞 Need Help?

If you're having trouble:
1. Check the browser console for error messages
2. Verify your API keys are correct
3. Ensure your apps have the right permissions
4. Check the API documentation for rate limits
