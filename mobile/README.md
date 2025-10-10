# inCommand Mobile - React Native

## Overview
Native iOS and Android apps for inCommand, leveraging the existing web codebase through a shared code bridge.

## Setup

### Prerequisites
- Node.js 18+
- React Native CLI
- Xcode (for iOS)
- Android Studio (for Android)

### Installation
```bash
cd mobile
npm install
npx pod-install ios
```

### Running
```bash
# iOS
npm run ios

# Android
npm run android
```

## Shared Code Bridge

The mobile apps share business logic with the web platform:
- `src/lib/*` - All library code is shared
- `src/hooks/*` - Custom hooks work on both platforms
- `src/types/*` - TypeScript types are universal

## Native Modules

### Camera
- Live photo capture
- Video recording
- QR code scanning

### GPS
- Real-time location tracking
- Geofencing
- Indoor positioning (beacon support)

### Push Notifications
- FCM (Firebase Cloud Messaging)
- APNs (Apple Push Notification service)
- Background notifications

### Offline Storage
- AsyncStorage for settings
- SQLite for offline data
- Background sync

## Platform-Specific Code

```typescript
import { Platform } from 'react-native'

if (Platform.OS === 'ios') {
  // iOS-specific code
} else if (Platform.OS === 'android') {
  // Android-specific code
}
```

## Building for Production

### iOS
```bash
cd ios
fastlane release
```

### Android
```bash
cd android
./gradlew assembleRelease
```

## App Store Configuration

### iOS (App Store Connect)
- Bundle ID: `com.incommand.app`
- Version: 1.0.0
- Privacy policy required
- Location permission justification

### Android (Google Play Console)
- Package name: `com.incommand.app`
- Target SDK: 34
- Location permissions: Required for GPS features

## Features

### Core Features (Parity with Web)
- ✅ Incident logging
- ✅ Real-time updates
- ✅ Analytics dashboards
- ✅ Staff management
- ✅ Voice input
- ✅ Photo attachments

### Mobile-Specific Features
- 📱 Native camera integration
- 📱 GPS tracking
- 📱 Push notifications
- 📱 Offline-first architecture
- 📱 Biometric authentication
- 📱 Background location updates

## Architecture

```
mobile/
├── android/           # Android native code
├── ios/              # iOS native code
├── src/
│   ├── screens/      # React Native screens
│   ├── components/   # Mobile-specific components
│   ├── navigation/   # React Navigation setup
│   └── bridge/       # Shared code imports
├── package.json
└── README.md
```

## Testing

```bash
# Unit tests
npm test

# E2E tests (Detox)
npm run e2e:ios
npm run e2e:android
```

## Performance

- Code splitting for faster startup
- Image optimization
- Lazy loading
- Background task optimization

## Next Steps

1. Initialize React Native project: `npx react-native init inCommandMobile`
2. Configure shared code bridge
3. Set up native modules
4. Implement core screens
5. Test on physical devices
6. Submit to app stores
