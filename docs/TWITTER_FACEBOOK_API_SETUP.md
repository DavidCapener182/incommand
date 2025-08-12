# Twitter & Facebook API Setup Guide

This guide will help you get real tweets and Facebook posts in your social media monitoring dashboard.

## 🐦 **Twitter/X API Setup**

### **Step 1: Apply for Twitter Developer Access**

1. **Go to [Twitter Developer Portal](https://developer.twitter.com/)**
2. **Sign in with your Twitter account**
3. **Click "Apply for a developer account"**
4. **Fill out the application form**:
   - **What are you building?** → "Event management dashboard for monitoring social media mentions"
   - **Will you analyze Twitter data?** → "Yes, for sentiment analysis of event-related posts"
   - **Will you share Twitter data?** → "No"
   - **How will you analyze Twitter data?** → "For sentiment analysis of event security mentions"
5. **Submit and wait for approval** (usually 1-3 days)

### **Step 2: Create a Twitter App**

Once approved:
1. **Go to [Twitter Developer Portal](https://developer.twitter.com/)**
2. **Click "Create App"**
3. **Fill in app details**:
   - **App name**: `InCommand Event Manager`
   - **Description**: `Event management social media monitoring`
   - **Website**: `https://your-domain.com` (or `https://localhost:3000`)
4. **Click "Create"**

### **Step 3: Get API Keys**

1. **Go to "Keys and Tokens" tab**
2. **Copy these values**:
   - **API Key** (Consumer Key)
   - **API Key Secret** (Consumer Secret)
3. **Generate Access Token**:
   - Click "Generate" next to "Access Token & Secret"
   - Copy **Access Token** and **Access Token Secret**

### **Step 4: Add to .env file**

```bash
TWITTER_CONSUMER_KEY=your_api_key_here
TWITTER_CONSUMER_SECRET=your_api_key_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here
```

## 📘 **Facebook API Setup**

### **Step 1: Create Facebook App**

1. **Go to [Facebook Developers](https://developers.facebook.com/)**
2. **Click "Create App"**
3. **Choose "Business" as app type**
4. **Fill in app details**:
   - **App name**: `InCommand Event Manager`
   - **Contact email**: Your email
5. **Click "Create App"**

### **Step 2: Add Facebook Login Product**

1. **In your app dashboard, click "Add Product"**
2. **Find "Facebook Login" and click "Set Up"**
3. **Choose "Web" platform**
4. **Enter your site URL**: `https://your-domain.com` (or `https://localhost:3000`)
5. **Click "Save"**

### **Step 3: Get Access Token**

1. **Go to "Tools" → "Graph API Explorer"**
2. **Select your app from dropdown**
3. **Click "Generate Access Token"**
4. **Grant permissions** (public_profile, pages_read_engagement)
5. **Copy the access token**

### **Step 4: Add to .env file**

```bash
FACEBOOK_ACCESS_TOKEN=your_access_token_here
FACEBOOK_APP_ID=your_app_id_here
```

## 🚀 **Quick Setup Commands**

### 1. Check your current .env file
```bash
cd /Users/davidcapener/incommand
cat .env
```

### 2. Add Twitter API keys
```bash
echo "TWITTER_CONSUMER_KEY=your_api_key_here" >> .env
echo "TWITTER_CONSUMER_SECRET=your_api_key_secret_here" >> .env
echo "TWITTER_ACCESS_TOKEN=your_access_token_here" >> .env
echo "TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here" >> .env
```

### 3. Add Facebook API keys
```bash
echo "FACEBOOK_ACCESS_TOKEN=your_access_token_here" >> .env
echo "FACEBOOK_APP_ID=your_app_id_here" >> .env
```

### 4. Restart your development server
```bash
npm run dev
```

## 🎯 **What You'll Get**

**With real APIs:**
- ✅ **Actual tweets** from Twitter/X
- ✅ **Real Facebook posts** about events
- ✅ **Live sentiment analysis** using OpenAI
- ✅ **Real engagement metrics** (likes, shares, comments)
- ✅ **Authentic timestamps** and user data

**Example real posts you'll see:**
- "Security team doing great work at tonight's event! #EventSecurity"
- "Quick response from security to minor incident - professional as always"
- "Event atmosphere is fantastic, security presence reassuring"

## 🔧 **Troubleshooting**

### Twitter API Issues
- **"Rate limit exceeded"**: Wait 15 minutes, Twitter has strict limits
- **"Authentication failed"**: Check your API keys are correct
- **"App not approved"**: Wait for developer account approval

### Facebook API Issues
- **"Invalid access token"**: Generate a new token in Graph API Explorer
- **"Permissions error"**: Make sure you have the right permissions
- **"App not live"**: Your app needs to be in "Live" mode

### General Issues
- **"API key not found"**: Make sure your .env file is in the project root
- **Restart server**: Always restart after adding new environment variables
- **Check console**: Look for error messages in browser console

## 📊 **API Limits**

### Twitter API v1.1
- **Search**: 180 requests per 15 minutes
- **Rate limit**: ~1 request per 5 seconds
- **Data**: Recent tweets only (7 days)

### Facebook Graph API
- **Search**: 200 requests per hour
- **Rate limit**: ~1 request per 18 seconds
- **Data**: Public posts only

## 🆚 **Free vs Paid Comparison**

| Feature | Free APIs | Paid APIs |
|---------|-----------|-----------|
| **Cost** | $0/month | $100-500+/month |
| **Setup Time** | 1-3 days approval | Immediate |
| **Rate Limits** | Strict | Higher |
| **Data Access** | Limited | Full access |
| **Real-time** | Yes | Yes |

## 📞 **Need Help?**

If you're having trouble:
1. **Check Twitter Developer Status**: [status.twitter.com](https://status.twitter.com)
2. **Facebook Developer Support**: [developers.facebook.com/support](https://developers.facebook.com/support)
3. **Browser Console**: Look for API error messages
4. **Test with mock data**: The system falls back to realistic mock data

## 🎉 **Success Indicators**

You'll know it's working when:
- You see real usernames and handles
- Timestamps are recent and accurate
- Post content is varied and authentic
- Engagement metrics are realistic
- No "mock" indicators in the data

The system will automatically switch from mock data to real data once your API keys are properly configured!
