import { useState, useEffect, useCallback } from 'react';
import { cameraGPSManager, LocationData, PhotoData, CameraOptions, GPSOptions } from '../lib/cameraGPS';

// Re-export types for use in other components
export type { PhotoData, LocationData, CameraOptions, GPSOptions };

export interface UseCameraGPSReturn {
  // State
  cameraSupported: boolean;
  gpsSupported: boolean;
  cameraPermission: PermissionState | null;
  gpsPermission: PermissionState | null;
  currentLocation: LocationData | null;
  cameraStream: MediaStream | null;
  loading: boolean;
  error: string | null;
  
  // Camera actions
  requestCameraAccess: (options?: CameraOptions) => Promise<MediaStream>;
  capturePhoto: (options?: CameraOptions) => Promise<PhotoData>;
  capturePhotoFromFile: (file: File, options?: CameraOptions) => Promise<PhotoData>;
  switchCamera: () => Promise<MediaStream>;
  stopCamera: () => void;
  
  // GPS actions
  requestGPSAccess: (options?: GPSOptions) => Promise<LocationData>;
  getCurrentLocation: (options?: GPSOptions) => Promise<LocationData>;
  watchLocation: (callback: (location: LocationData) => void, options?: GPSOptions) => number;
  stopWatchingLocation: (watchId: number) => void;
  
  // Utilities
  formatLocation: (location: LocationData) => string;
  calculateDistance: (location1: LocationData, location2: LocationData) => number;
  isLocationRecent: (location: LocationData, maxAgeMs?: number) => boolean;
  isLocationAccurate: (location: LocationData, maxAccuracyMeters?: number) => boolean;
  clearError: () => void;
}

export const useCameraGPS = (): UseCameraGPSReturn => {
  const [cameraSupported, setCameraSupported] = useState(false);
  const [gpsSupported, setGpsSupported] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<PermissionState | null>(null);
  const [gpsPermission, setGpsPermission] = useState<PermissionState | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check support on mount
  useEffect(() => {
    setCameraSupported(cameraGPSManager.isCameraSupported());
    setGpsSupported(cameraGPSManager.isGPSSupported());
  }, []);

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if (cameraSupported && 'permissions' in navigator) {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setCameraPermission(cameraPermission.state);
          
          cameraPermission.addEventListener('change', () => {
            setCameraPermission(cameraPermission.state);
          });
        }

        if (gpsSupported && 'permissions' in navigator) {
          const gpsPermission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          setGpsPermission(gpsPermission.state);
          
          gpsPermission.addEventListener('change', () => {
            setGpsPermission(gpsPermission.state);
          });
        }
      } catch (err) {
        console.warn('Could not check permissions:', err);
      }
    };

    checkPermissions();
  }, [cameraSupported, gpsSupported]);

  // Request camera access
  const requestCameraAccess = useCallback(async (options?: CameraOptions): Promise<MediaStream> => {
    try {
      setLoading(true);
      setError(null);

      const stream = await cameraGPSManager.requestCameraAccess(options);
      setCameraStream(stream);
      
      return stream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Capture photo
  const capturePhoto = useCallback(async (options?: CameraOptions): Promise<PhotoData> => {
    try {
      setLoading(true);
      setError(null);

      const photoData = await cameraGPSManager.capturePhoto(options);
      
      // Update current location if photo has location data
      if (photoData.location) {
        setCurrentLocation(photoData.location);
      }
      
      return photoData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture photo';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Capture photo from file
  const capturePhotoFromFile = useCallback(async (file: File, options?: CameraOptions): Promise<PhotoData> => {
    try {
      setLoading(true);
      setError(null);

      const photoData = await cameraGPSManager.capturePhotoFromFile(file, options);
      
      // Update current location if photo has location data
      if (photoData.location) {
        setCurrentLocation(photoData.location);
      }
      
      return photoData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load photo from file';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Switch camera
  const switchCamera = useCallback(async (): Promise<MediaStream> => {
    try {
      setLoading(true);
      setError(null);

      const stream = await cameraGPSManager.switchCamera();
      setCameraStream(stream);
      
      return stream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch camera';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    try {
      cameraGPSManager.stopCamera();
      setCameraStream(null);
    } catch (err) {
      console.error('Failed to stop camera:', err);
    }
  }, []);

  // Request GPS access
  const requestGPSAccess = useCallback(async (options?: GPSOptions): Promise<LocationData> => {
    try {
      setLoading(true);
      setError(null);

      const location = await cameraGPSManager.requestGPSAccess(options);
      setCurrentLocation(location);
      
      return location;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access GPS';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async (options?: GPSOptions): Promise<LocationData> => {
    try {
      setLoading(true);
      setError(null);

      const location = await cameraGPSManager.getCurrentLocation(options);
      setCurrentLocation(location);
      
      return location;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get current location';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Watch location
  const watchLocation = useCallback((callback: (location: LocationData) => void, options?: GPSOptions): number => {
    try {
      const watchId = cameraGPSManager.watchGPSLocation((location) => {
        setCurrentLocation(location);
        callback(location);
      }, options);
      
      return watchId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to watch location';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Stop watching location
  const stopWatchingLocation = useCallback((watchId: number) => {
    try {
      cameraGPSManager.clearGPSWatch(watchId);
    } catch (err) {
      console.error('Failed to stop watching location:', err);
    }
  }, []);

  // Format location
  const formatLocation = useCallback((location: LocationData): string => {
    return cameraGPSManager.formatLocation(location);
  }, []);

  // Calculate distance
  const calculateDistance = useCallback((location1: LocationData, location2: LocationData): number => {
    return cameraGPSManager.calculateDistance(location1, location2);
  }, []);

  // Check if location is recent
  const isLocationRecent = useCallback((location: LocationData, maxAgeMs: number = 300000): boolean => {
    return cameraGPSManager.isLocationRecent(location, maxAgeMs);
  }, []);

  // Check if location is accurate
  const isLocationAccurate = useCallback((location: LocationData, maxAccuracyMeters: number = 50): boolean => {
    return cameraGPSManager.isLocationAccurate(location, maxAccuracyMeters);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    cameraSupported,
    gpsSupported,
    cameraPermission,
    gpsPermission,
    currentLocation,
    cameraStream,
    loading,
    error,
    
    // Camera actions
    requestCameraAccess,
    capturePhoto,
    capturePhotoFromFile,
    switchCamera,
    stopCamera,
    
    // GPS actions
    requestGPSAccess,
    getCurrentLocation,
    watchLocation,
    stopWatchingLocation,
    
    // Utilities
    formatLocation,
    calculateDistance,
    isLocationRecent,
    isLocationAccurate,
    clearError
  };
};
