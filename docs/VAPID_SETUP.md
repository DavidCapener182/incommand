# VAPID Keys Setup for Push Notifications

This document explains how to generate and configure VAPID keys for push notifications in the InCommand application.

## What are VAPID Keys?

VAPID (Voluntary Application Server Identification) keys are used to identify your application server to push services. They consist of a public key and a private key pair that are used to sign push messages.

## Generating VAPID Keys

### Option 1: Using the web-push library (Recommended)

1. Install the web-push library:
```bash
npm install web-push
```

2. Create a script to generate VAPID keys:
```javascript
// generate-vapid-keys.js
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Public Key:', vapidKeys.publicKey);
console.log('VAPID Private Key:', vapidKeys.privateKey);
```

3. Run the script:
```bash
node generate-vapid-keys.js
```

### Option 2: Using an online generator

You can use online tools like:
- https://web-push-codelab.glitch.me/
- https://tools.reactpwa.com/vapid

### Option 3: Using OpenSSL

```bash
# Generate private key
openssl ecparam -name prime256v1 -genkey -noout -out vapid_private.pem

# Generate public key from private key
openssl ec -in vapid_private.pem -pubout -out vapid_public.pem

# Convert to base64 (remove headers and newlines)
cat vapid_public.pem | grep -v "PUBLIC KEY" | tr -d '\n' | base64 -w 0
cat vapid_private.pem | grep -v "PRIVATE KEY" | tr -d '\n' | base64 -w 0
```

## Configuring Environment Variables

Once you have generated your VAPID keys, add them to your environment variables:

### For Development (.env.local)
```env
# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

### For Production
Add these environment variables to your deployment platform:

- **Vercel**: Add in Project Settings > Environment Variables
- **Netlify**: Add in Site Settings > Environment Variables
- **Railway**: Add in Project Variables
- **Heroku**: Use `heroku config:set`

## Environment Variable Details

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: This is exposed to the client and used to subscribe to push notifications
- `VAPID_PRIVATE_KEY`: This is kept server-side and used to sign push messages

## Security Considerations

1. **Never expose the private key**: The `VAPID_PRIVATE_KEY` should never be exposed to the client
2. **Use different keys for environments**: Generate separate VAPID keys for development, staging, and production
3. **Rotate keys periodically**: Consider rotating VAPID keys periodically for security
4. **Store securely**: Store private keys in secure environment variable management systems

## Testing VAPID Keys

After setting up your VAPID keys, you can test them:

1. Start your development server
2. Open the application in a supported browser
3. Navigate to the notification settings
4. Request permission and subscribe to push notifications
5. Send a test notification

## Troubleshooting

### Common Issues

1. **"VAPID_PUBLIC_KEY not set" error**
   - Ensure `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is set in your environment variables
   - Restart your development server after adding environment variables

2. **"Invalid VAPID key" error**
   - Verify the key format is correct (base64 encoded)
   - Ensure no extra characters or whitespace

3. **Push notifications not working**
   - Check browser console for errors
   - Verify service worker is registered
   - Ensure HTTPS is used (required for push notifications)

### Browser Support

Push notifications are supported in:
- Chrome 42+
- Firefox 44+
- Safari 16+
- Edge 17+

## Example VAPID Key Format

Your VAPID keys should look something like this:

**Public Key:**
```
BNcRdRKLzM2Wq06Xg3tTMoJp6aIhkXgif03UTMeRZ7gxj8CwpKdwYsqPJuFu52RfETu3enb63nYBTDv9H3aKxsE
```

**Private Key:**
```
p256dh=BNcRdRKLzM2Wq06Xg3tTMoJp6aIhkXgif03UTMeRZ7gxj8CwpKdwYsqPJuFu52RfETu3enb63nYBTDv9H3aKxsE
auth=QvIhVgXwJkVNIzGXH3VXAA
```

## Next Steps

After setting up VAPID keys:

1. Run the database migration to create the `push_subscriptions` table
2. Test push notification functionality
3. Configure notification preferences in the UI
4. Set up server-side notification sending logic

## Additional Resources

- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)
- [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
