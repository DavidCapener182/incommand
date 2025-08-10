export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface PhotoData {
  file: File;
  location?: LocationData;
  metadata?: {
    width: number;
    height: number;
    size: number;
    type: string;
    lastModified: number;
  };
}

export interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  quality?: number;
  enableLocation?: boolean;
  locationTimeout?: number;
  locationHighAccuracy?: boolean;
}

export interface GPSOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export class CameraGPSManager {
  private static instance: CameraGPSManager;
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;

  private constructor() {}

  static getInstance(): CameraGPSManager {
    if (!CameraGPSManager.instance) {
      CameraGPSManager.instance = new CameraGPSManager();
    }
    return CameraGPSManager.instance;
  }

  // Check if camera is supported
  isCameraSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // Check if GPS is supported
  isGPSSupported(): boolean {
    return !!('geolocation' in navigator);
  }

  // Request camera permission and get stream
  async requestCameraAccess(options: CameraOptions = {}): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: options.facingMode || 'environment',
          width: { ideal: options.width || 1920 },
          height: { ideal: options.height || 1080 }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[CameraGPS] Camera access granted');
      return this.stream;
    } catch (error) {
      console.error('[CameraGPS] Camera access denied:', error);
      throw new Error('Camera access denied');
    }
  }

  // Request GPS permission and get location
  async requestGPSAccess(options: GPSOptions = {}): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!this.isGPSSupported()) {
        reject(new Error('GPS not supported'));
        return;
      }

      const gpsOptions: PositionOptions = {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 60000
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined
          };

          console.log('[CameraGPS] GPS location obtained:', locationData);
          resolve(locationData);
        },
        (error) => {
          console.error('[CameraGPS] GPS access denied:', error);
          reject(new Error(`GPS access denied: ${error.message}`));
        },
        gpsOptions
      );
    });
  }

  // Watch GPS location
  watchGPSLocation(
    callback: (location: LocationData) => void,
    options: GPSOptions = {}
  ): number {
    if (!this.isGPSSupported()) {
      throw new Error('GPS not supported');
    }

    const gpsOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 60000
    };

    return navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          altitude: position.coords.altitude || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined
        };

        callback(locationData);
      },
      (error) => {
        console.error('[CameraGPS] GPS watch error:', error);
      },
      gpsOptions
    );
  }

  // Stop watching GPS location
  clearGPSWatch(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
  }

  // Capture photo from camera stream
  async capturePhoto(options: CameraOptions = {}): Promise<PhotoData> {
    try {
      if (!this.stream) {
        throw new Error('Camera stream not initialized');
      }

      // Create video element if not exists
      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.srcObject = this.stream;
        this.videoElement.autoplay = true;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;
      }

      // Create canvas element if not exists
      if (!this.canvasElement) {
        this.canvasElement = document.createElement('canvas');
      }

      // Wait for video to be ready
      await new Promise((resolve) => {
        if (this.videoElement!.readyState >= 2) {
          resolve(true);
        } else {
          this.videoElement!.onloadeddata = () => resolve(true);
        }
      });

      // Set canvas dimensions
      const video = this.videoElement;
      const canvas = this.canvasElement;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      const quality = options.quality || 0.8;
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', quality);
      });

      // Create file from blob
      const file = new File([blob], `photo_${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      // Get location if enabled
      let location: LocationData | undefined;
      if (options.enableLocation) {
        try {
          location = await this.requestGPSAccess({
            timeout: options.locationTimeout,
            enableHighAccuracy: options.locationHighAccuracy
          });
        } catch (error) {
          console.warn('[CameraGPS] Failed to get location for photo:', error);
        }
      }

      // Create photo data
      const photoData: PhotoData = {
        file,
        location,
        metadata: {
          width: canvas.width,
          height: canvas.height,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        }
      };

      console.log('[CameraGPS] Photo captured:', photoData);
      return photoData;
    } catch (error) {
      console.error('[CameraGPS] Failed to capture photo:', error);
      throw error;
    }
  }

  // Capture photo from file input (fallback)
  async capturePhotoFromFile(file: File, options: CameraOptions = {}): Promise<PhotoData> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File is not an image');
      }

      // Get location if enabled
      let location: LocationData | undefined;
      if (options.enableLocation) {
        try {
          location = await this.requestGPSAccess({
            timeout: options.locationTimeout,
            enableHighAccuracy: options.locationHighAccuracy
          });
        } catch (error) {
          console.warn('[CameraGPS] Failed to get location for photo:', error);
        }
      }

      // Get image metadata
      const metadata = await this.getImageMetadata(file);

      const photoData: PhotoData = {
        file,
        location,
        metadata
      };

      console.log('[CameraGPS] Photo loaded from file:', photoData);
      return photoData;
    } catch (error) {
      console.error('[CameraGPS] Failed to load photo from file:', error);
      throw error;
    }
  }

  // Get image metadata
  private async getImageMetadata(file: File): Promise<PhotoData['metadata']> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // Switch camera (front/back)
  async switchCamera(): Promise<MediaStream> {
    if (!this.stream) {
      throw new Error('Camera stream not initialized');
    }

    // Stop current stream
    this.stopCamera();

    // Get current facing mode
    const videoTrack = this.stream.getVideoTracks()[0];
    const currentFacingMode = videoTrack.getSettings().facingMode;
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

    // Request new stream with different facing mode
    return await this.requestCameraAccess({ facingMode: newFacingMode });
  }

  // Stop camera stream
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    if (this.canvasElement) {
      this.canvasElement = null;
    }

    console.log('[CameraGPS] Camera stopped');
  }

  // Get current camera facing mode
  getCurrentFacingMode(): 'user' | 'environment' | null {
    if (!this.stream) {
      return null;
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    return videoTrack.getSettings().facingMode as 'user' | 'environment';
  }

  // Get available cameras
  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('[CameraGPS] Failed to get available cameras:', error);
      return [];
    }
  }

  // Get current location without permission request (if already granted)
  async getCurrentLocation(options: GPSOptions = {}): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!this.isGPSSupported()) {
        reject(new Error('GPS not supported'));
        return;
      }

      const gpsOptions: PositionOptions = {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 5000,
        maximumAge: options.maximumAge ?? 30000
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined
          };

          resolve(locationData);
        },
        (error) => {
          reject(new Error(`Failed to get location: ${error.message}`));
        },
        gpsOptions
      );
    });
  }

  // Format location for display
  formatLocation(location: LocationData): string {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (±${location.accuracy.toFixed(1)}m)`;
  }

  // Calculate distance between two locations
  calculateDistance(location1: LocationData, location2: LocationData): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (location1.latitude * Math.PI) / 180;
    const φ2 = (location2.latitude * Math.PI) / 180;
    const Δφ = ((location2.latitude - location1.latitude) * Math.PI) / 180;
    const Δλ = ((location2.longitude - location1.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Check if location is recent
  isLocationRecent(location: LocationData, maxAgeMs: number = 300000): boolean {
    return Date.now() - location.timestamp < maxAgeMs;
  }

  // Check if location is accurate enough
  isLocationAccurate(location: LocationData, maxAccuracyMeters: number = 50): boolean {
    return location.accuracy <= maxAccuracyMeters;
  }
}

// Export singleton instance
export const cameraGPSManager = CameraGPSManager.getInstance();

// Export utility functions
export const isCameraSupported = () => cameraGPSManager.isCameraSupported();
export const isGPSSupported = () => cameraGPSManager.isGPSSupported();
export const requestCameraAccess = (options?: CameraOptions) => cameraGPSManager.requestCameraAccess(options);
export const requestGPSAccess = (options?: GPSOptions) => cameraGPSManager.requestGPSAccess(options);
export const capturePhoto = (options?: CameraOptions) => cameraGPSManager.capturePhoto(options);
export const capturePhotoFromFile = (file: File, options?: CameraOptions) => cameraGPSManager.capturePhotoFromFile(file, options);
export const switchCamera = () => cameraGPSManager.switchCamera();
export const stopCamera = () => cameraGPSManager.stopCamera();
export const getCurrentLocation = (options?: GPSOptions) => cameraGPSManager.getCurrentLocation(options);
