# Social Media Monitoring Setup

This document outlines the setup required for the social media monitoring feature in the InCommand application.

## Environment Variables

Add the following environment variables to your `.env` file:

### Twitter API Configuration
```bash
# Twitter API v2 Bearer Token for accessing Twitter search and recent tweets
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
```

### Instagram API Configuration
```bash
# Instagram Basic Display API or Graph API credentials
# Access token for Instagram API access
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
# Instagram App ID for API authentication
INSTAGRAM_APP_ID=your_instagram_app_id_here
```

## API Setup Instructions

### Twitter API Setup
1. Go to the [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app or use an existing one
3. Navigate to "Keys and Tokens"
4. Generate a Bearer Token
5. Add the Bearer Token to your `.env` file

### Instagram API Setup
1. Go to the [Facebook Developers Portal](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add Instagram Basic Display or Instagram Graph API product
4. Generate an access token
5. Add the access token and app ID to your `.env` file

## Fallback Behavior

The social media monitoring system includes comprehensive fallback mechanisms:

- If API credentials are not provided, the system will use mock data
- If API calls fail, the system will gracefully fall back to mock data
- Mock data includes realistic event security-related posts
- All error states are handled gracefully with user-friendly messages

## Features

The social media monitoring system provides:

- Real-time monitoring of Twitter and Instagram posts
- Sentiment analysis using OpenAI
- Platform-specific statistics
- Combined metrics and insights
- Auto-refresh every 60 seconds
- Responsive design for mobile and desktop

## API Endpoints

- `/api/social-media/twitter` - Fetches recent tweets
- `/api/social-media/instagram` - Fetches recent Instagram posts
- `/api/social-media/summary` - Orchestrates data collection and sentiment analysis

## Notes

- API credentials are optional - the system will work with mock data if not provided
- Rate limiting is implemented with 60-second caching
- Sentiment analysis is batched for efficiency
- All API calls include comprehensive error handling
