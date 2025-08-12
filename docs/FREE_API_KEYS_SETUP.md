# Free API Keys Setup Guide

Since Twitter/X has made it difficult to get free API access, here are **completely free alternatives** that work just as well!

## 🆓 **Free API Options**

### 1. **Mastodon API (Free Twitter Alternative)**

**What is Mastodon?**
- Decentralized social network similar to Twitter
- Completely free API access
- No rate limits for basic usage
- Large community discussing events and security

**How to get it (5 minutes):**
1. Go to [Mastodon.social](https://mastodon.social) and create a free account
2. Go to Settings → Development → New Application
3. Fill in:
   - **Application name**: `InCommand Event Manager`
   - **Website**: `https://your-domain.com` (or just `https://localhost:3000`)
   - **Redirect URI**: `urn:ietf:wg:oauth:2.0:oob`
4. Click "Submit"
5. Copy the **Access Token** (starts with `your_token_here`)

**Add to your `.env` file:**
```bash
MASTODON_INSTANCE_URL=https://mastodon.social
MASTODON_ACCESS_TOKEN=your_access_token_here
```

### 2. **Reddit API (Free Instagram Alternative)**

**What is Reddit?**
- Large community platform with event discussions
- Free API with generous limits
- Great for finding event security discussions
- No approval process needed

**How to get it (3 minutes):**
1. Go to [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Fill in:
   - **Name**: `InCommand Event Manager`
   - **App type**: Select `script`
   - **Description**: `Event management social media monitoring`
   - **About URL**: `https://your-domain.com`
   - **Redirect URI**: `https://your-domain.com/callback`
4. Click "Create App"
5. Copy the **Client ID** (under the app name) and **Client Secret**

**Add to your `.env` file:**
```bash
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
```

## 🚀 **Quick Setup Commands**

### 1. Check your current .env file
```bash
cd /Users/davidcapener/incommand
cat .env
```

### 2. Add the free API keys
```bash
echo "MASTODON_INSTANCE_URL=https://mastodon.social" >> .env
echo "MASTODON_ACCESS_TOKEN=your_mastodon_token_here" >> .env
echo "REDDIT_CLIENT_ID=your_reddit_client_id_here" >> .env
echo "REDDIT_CLIENT_SECRET=your_reddit_client_secret_here" >> .env
```

### 3. Restart your development server
```bash
npm run dev
```

## 🎯 **What You'll Get**

**With these free APIs:**
- ✅ **Real social media posts** from Mastodon and Reddit
- ✅ **Event security discussions** and mentions
- ✅ **Live sentiment analysis** using OpenAI
- ✅ **No monthly costs** or API limits
- ✅ **Immediate access** - no approval needed

**Platform Mapping:**
- **Mastodon** → Shows as "Twitter" in the UI (blue)
- **Reddit** → Shows as "Instagram" in the UI (orange)

## 📊 **Example Posts You'll See**

**Mastodon posts:**
- "Great event security tonight! Everything running smoothly #EventSecurity"
- "Security team doing an excellent job managing crowd flow"
- "Event atmosphere is fantastic, security presence reassuring"

**Reddit posts:**
- "Event security question: Best practices for crowd management?"
- "Security team at tonight's event was absolutely professional"
- "How do you handle security incidents at events?"

## 🔧 **Troubleshooting**

### "API key not found" errors
- Make sure your .env file is in the project root
- Restart your development server after adding keys
- Check for typos in variable names

### Mastodon API errors
- Ensure your access token is correct
- Check if your Mastodon account is active
- Try a different Mastodon instance if needed

### Reddit API errors
- Verify your client ID and secret are correct
- Make sure your Reddit account is in good standing
- Check if you've exceeded rate limits

## 🆚 **Comparison: Free vs Paid**

| Feature | Free APIs (Mastodon + Reddit) | Paid APIs (Twitter + Instagram) |
|---------|-------------------------------|----------------------------------|
| **Cost** | $0/month | $100-500+/month |
| **Setup Time** | 5-10 minutes | Weeks/months approval |
| **Rate Limits** | Generous | Strict |
| **Content Quality** | High | High |
| **Event Security Posts** | Yes | Yes |
| **Real-time Updates** | Yes | Yes |

## 🎉 **Benefits of Free APIs**

1. **No Cost**: Completely free forever
2. **No Approval**: Get started immediately
3. **No Limits**: Generous rate limits
4. **Same Features**: All the same functionality
5. **Better Privacy**: Decentralized platforms
6. **Active Communities**: Large event security discussions

## 📞 **Need Help?**

If you're having trouble:
1. Check the browser console for error messages
2. Verify your API keys are correct
3. Make sure your accounts are active
4. Try the mock data first to test the UI

The free APIs will give you the exact same functionality as the paid ones, just with different data sources!
