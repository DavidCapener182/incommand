import { useState, useEffect, useCallback, useRef } from 'react';
import { cameraGPSManager, LocationData, PhotoData, CameraOptions, GPSOptions } from '../lib/cameraGPS';

export interface CameraGPSState {
  isCameraSupported: boolean;
  isGPSSupported: boolean;
  isCameraActive: boolean;
  isLocationWatching: boolean;
  currentLocation: LocationData | null;
  locationAccuracy: string;
  error: string | null;
  isCapturing: boolean;
}

export interface CameraGPSActions {
  requestCameraAccess: (options?: CameraOptions) => Promise<MediaStream>;
  requestGPSAccess: (options?: GPSOptions) => Promise<LocationData>;
  startLocationWatching: (options?: GPSOptions, callback?: (location: LocationData) => void) => Promise<void>;
  stopLocationWatching: () => void;
  capturePhoto: (options?: CameraOptions) => Promise<PhotoData>;
  capturePhotoFromFile: (file: File, enableLocation?: boolean) => Promise<PhotoData>;
  switchCamera: () => Promise<MediaStream>;
  stopCamera: () => void;
  compressPhoto: (photoData: PhotoData, maxWidth?: number, quality?: number) => Promise<PhotoData>;
  getCurrentLocation: (options?: GPSOptions) => Promise<LocationData | null>;
  clearError: () => void;
  cleanup: () => void;
}

export function useCameraGPS(): [CameraGPSState, CameraGPSActions] {
  const [state, setState] = useState<CameraGPSState>({
    isCameraSupported: cameraGPSManager.isCameraSupported(),
    isGPSSupported: cameraGPSManager.isGPSSupported(),
    isCameraActive: false,
    isLocationWatching: false,
    currentLocation: null,
    locationAccuracy: '',
    error: null,
    isCapturing: false
  });

  const locationCallbackRef = useRef<((location: LocationData) => void) | null>(null);

  // Update location accuracy description
  const updateLocationAccuracy = useCallback((location: LocationData) => {
    const accuracy = cameraGPSManager.getLocationAccuracyDescription(location.accuracy);
    setState(prev => ({
      ...prev,
      locationAccuracy: accuracy
    }));
  }, []);

  // Handle location updates
  const handleLocationUpdate = useCallback((location: LocationData) => {
    setState(prev => ({
      ...prev,
      currentLocation: location
    }));
    updateLocationAccuracy(location);
    
    if (locationCallbackRef.current) {
      locationCallbackRef.current(location);
    }
  }, [updateLocationAccuracy]);

  // Actions
  const requestCameraAccess = useCallback(async (options?: CameraOptions): Promise<MediaStream> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const stream = await cameraGPSManager.requestCameraAccess(options);
      setState(prev => ({ ...prev, isCameraActive: true }));
      return stream;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access camera';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const requestGPSAccess = useCallback(async (options?: GPSOptions): Promise<LocationData> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const location = await cameraGPSManager.requestGPSAccess(options);
      setState(prev => ({
        ...prev,
        currentLocation: location
      }));
      updateLocationAccuracy(location);
      return location;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access GPS';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [updateLocationAccuracy]);

  const startLocationWatching = useCallback(async (options?: GPSOptions, callback?: (location: LocationData) => void): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      locationCallbackRef.current = callback || null;
      await cameraGPSManager.startLocationWatching(options, handleLocationUpdate);
      setState(prev => ({ ...prev, isLocationWatching: true }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start location watching';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [handleLocationUpdate]);

  const stopLocationWatching = useCallback(() => {
    cameraGPSManager.stopLocationWatching();
    setState(prev => ({ ...prev, isLocationWatching: false }));
    locationCallbackRef.current = null;
  }, []);

  const capturePhoto = useCallback(async (options?: CameraOptions): Promise<PhotoData> => {
    try {
      setState(prev => ({ 
        ...prev, 
        error: null, 
        isCapturing: true 
      }));
      
      const photoData = await cameraGPSManager.capturePhoto(options);
      
      setState(prev => ({ ...prev, isCapturing: false }));
      return photoData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture photo';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isCapturing: false 
      }));
      throw error;
    }
  }, []);

  const capturePhotoFromFile = useCallback(async (file: File, enableLocation: boolean = true): Promise<PhotoData> => {
    try {
      setState(prev => ({ 
        ...prev, 
        error: null, 
        isCapturing: true 
      }));
      
      const photoData = await cameraGPSManager.capturePhotoFromFile(file, enableLocation);
      
      if (photoData.location) {
        setState(prev => ({
          ...prev,
          currentLocation: photoData.location
        }));
        updateLocationAccuracy(photoData.location);
      }
      
      setState(prev => ({ ...prev, isCapturing: false }));
      return photoData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process photo file';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isCapturing: false 
      }));
      throw error;
    }
  }, [updateLocationAccuracy]);

  const switchCamera = useCallback(async (): Promise<MediaStream> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const stream = await cameraGPSManager.switchCamera();
      setState(prev => ({ ...prev, isCameraActive: true }));
      return stream;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch camera';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const stopCamera = useCallback(() => {
    cameraGPSManager.stopCamera();
    setState(prev => ({ ...prev, isCameraActive: false }));
  }, []);

  const compressPhoto = useCallback(async (photoData: PhotoData, maxWidth: number = 1920, quality: number = 0.8): Promise<PhotoData> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const compressedPhoto = await cameraGPSManager.compressPhoto(photoData, maxWidth, quality);
      return compressedPhoto;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to compress photo';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const getCurrentLocation = useCallback(async (options?: GPSOptions): Promise<LocationData | null> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const location = await cameraGPSManager.getCurrentLocation(options);
      
      if (location) {
        setState(prev => ({
          ...prev,
          currentLocation: location
        }));
        updateLocationAccuracy(location);
      }
      
      return location;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get current location';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [updateLocationAccuracy]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const cleanup = useCallback(() => {
    cameraGPSManager.cleanup();
    setState(prev => ({
      ...prev,
      isCameraActive: false,
      isLocationWatching: false,
      currentLocation: null,
      locationAccuracy: ''
    }));
    locationCallbackRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const actions: CameraGPSActions = {
    requestCameraAccess,
    requestGPSAccess,
    startLocationWatching,
    stopLocationWatching,
    capturePhoto,
    capturePhotoFromFile,
    switchCamera,
    stopCamera,
    compressPhoto,
    getCurrentLocation,
    clearError,
    cleanup
  };

  return [state, actions];
}
