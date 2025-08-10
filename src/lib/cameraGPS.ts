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
  metadata: {
    width: number;
    height: number;
    size: number;
    type: string;
    timestamp: number;
  };
}

export interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  quality?: number;
  enableLocation?: boolean;
  locationAccuracy?: PositionOptions;
}

export interface GPSOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export class CameraGPSManager {
  private static instance: CameraGPSManager;
  private stream: MediaStream | null = null;
  private currentLocation: LocationData | null = null;
  private locationWatchId: number | null = null;

  private constructor() {}

  static getInstance(): CameraGPSManager {
    if (!CameraGPSManager.instance) {
      CameraGPSManager.instance = new CameraGPSManager();
    }
    return CameraGPSManager.instance;
  }

  // Check if camera is supported
  isCameraSupported(): boolean {
    return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
  }

  // Check if GPS is supported
  isGPSSupported(): boolean {
    return 'geolocation' in navigator;
  }

  // Request camera permission and get stream
  async requestCameraAccess(options: CameraOptions = {}): Promise<MediaStream> {
    if (!this.isCameraSupported()) {
      throw new Error('Camera is not supported in this browser');
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: options.facingMode || 'environment',
          width: { ideal: options.width || 1920 },
          height: { ideal: options.height || 1080 }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted');
      return this.stream;
    } catch (error) {
      console.error('Camera access denied:', error);
      throw new Error('Camera access denied by user');
    }
  }

  // Request GPS permission and get current location
  async requestGPSAccess(options: GPSOptions = {}): Promise<LocationData> {
    if (!this.isGPSSupported()) {
      throw new Error('GPS is not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      const positionOptions: PositionOptions = {
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

          this.currentLocation = locationData;
          console.log('GPS location obtained:', locationData);
          resolve(locationData);
        },
        (error) => {
          console.error('GPS access denied:', error);
          reject(new Error(`GPS access denied: ${error.message}`));
        },
        positionOptions
      );
    });
  }

  // Start watching GPS location
  async startLocationWatching(options: GPSOptions = {}, callback?: (location: LocationData) => void): Promise<void> {
    if (!this.isGPSSupported()) {
      throw new Error('GPS is not supported in this browser');
    }

    const positionOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 60000
    };

    this.locationWatchId = navigator.geolocation.watchPosition(
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

        this.currentLocation = locationData;
        if (callback) {
          callback(locationData);
        }
      },
      (error) => {
        console.error('GPS watching error:', error);
      },
      positionOptions
    );
  }

  // Stop watching GPS location
  stopLocationWatching(): void {
    if (this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
      console.log('GPS location watching stopped');
    }
  }

  // Capture photo from camera stream
  async capturePhoto(options: CameraOptions = {}): Promise<PhotoData> {
    if (!this.stream) {
      throw new Error('Camera stream not available. Call requestCameraAccess first.');
    }

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.srcObject = this.stream;
      video.onloadedmetadata = () => {
        // Set canvas dimensions
        canvas.width = options.width || video.videoWidth;
        canvas.height = options.height || video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to capture photo'));
              return;
            }

            const file = new File([blob], `photo_${Date.now()}.jpg`, {
              type: 'image/jpeg'
            });

            const photoData: PhotoData = {
              file,
              location: this.currentLocation || undefined,
              metadata: {
                width: canvas.width,
                height: canvas.height,
                size: file.size,
                type: file.type,
                timestamp: Date.now()
              }
            };

            resolve(photoData);
          },
          'image/jpeg',
          options.quality || 0.8
        );
      };

      video.onerror = () => {
        reject(new Error('Failed to load video stream'));
      };
    });
  }

  // Capture photo from file input (fallback)
  async capturePhotoFromFile(file: File, enableLocation: boolean = true): Promise<PhotoData> {
    let location: LocationData | undefined;

    if (enableLocation && this.isGPSSupported()) {
      try {
        location = await this.requestGPSAccess();
      } catch (error) {
        console.warn('Failed to get GPS location for file photo:', error);
      }
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const photoData: PhotoData = {
          file,
          location,
          metadata: {
            width: img.width,
            height: img.height,
            size: file.size,
            type: file.type,
            timestamp: Date.now()
          }
        };
        resolve(photoData);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image file'));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // Get current location (cached or fresh)
  async getCurrentLocation(options: GPSOptions = {}): Promise<LocationData | null> {
    if (this.currentLocation) {
      const age = Date.now() - this.currentLocation.timestamp;
      if (age < (options.maximumAge || 60000)) {
        return this.currentLocation;
      }
    }

    try {
      return await this.requestGPSAccess(options);
    } catch (error) {
      console.error('Failed to get current location:', error);
      return null;
    }
  }

  // Switch camera (front/back)
  async switchCamera(): Promise<MediaStream> {
    if (!this.stream) {
      throw new Error('No active camera stream');
    }

    // Stop current stream
    this.stopCamera();

    // Get current facing mode
    const videoTrack = this.stream.getVideoTracks()[0];
    const currentFacingMode = videoTrack.getSettings().facingMode;
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

    // Request new stream with different facing mode
    return this.requestCameraAccess({ facingMode: newFacingMode });
  }

  // Stop camera stream
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      console.log('Camera stream stopped');
    }
  }

  // Compress photo for mobile optimization
  async compressPhoto(photoData: PhotoData, maxWidth: number = 1920, quality: number = 0.8): Promise<PhotoData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        context.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress photo'));
              return;
            }

            const compressedFile = new File([blob], photoData.file.name, {
              type: photoData.file.type
            });

            const compressedPhotoData: PhotoData = {
              file: compressedFile,
              location: photoData.location,
              metadata: {
                width,
                height,
                size: compressedFile.size,
                type: compressedFile.type,
                timestamp: photoData.metadata.timestamp
              }
            };

            resolve(compressedPhotoData);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };

      img.src = URL.createObjectURL(photoData.file);
    });
  }

  // Add location to photo metadata (EXIF-like)
  async addLocationToPhoto(photoData: PhotoData, location: LocationData): Promise<PhotoData> {
    // For now, we'll just update the location in our PhotoData structure
    // In a real implementation, you might want to use a library like exif-js
    // to actually embed GPS coordinates in the image metadata
    
    return {
      ...photoData,
      location
    };
  }

  // Validate location accuracy
  isLocationAccurate(location: LocationData, minAccuracy: number = 50): boolean {
    return location.accuracy <= minAccuracy;
  }

  // Get location accuracy description
  getLocationAccuracyDescription(accuracy: number): string {
    if (accuracy <= 10) return 'Excellent';
    if (accuracy <= 30) return 'Good';
    if (accuracy <= 100) return 'Fair';
    return 'Poor';
  }

  // Cleanup resources
  cleanup(): void {
    this.stopCamera();
    this.stopLocationWatching();
    this.currentLocation = null;
  }
}

// Export singleton instance
export const cameraGPSManager = CameraGPSManager.getInstance();
