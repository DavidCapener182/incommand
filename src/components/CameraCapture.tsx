'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCameraGPS, PhotoData } from '../hooks/useCameraGPS';

interface CameraCaptureProps {
  onPhotoCaptured: (photoData: PhotoData) => void;
  onClose: () => void;
  enableLocation?: boolean;
  quality?: number;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onPhotoCaptured,
  onClose,
  enableLocation = true,
  quality = 0.8
}) => {
  const {
    cameraSupported,
    gpsSupported,
    cameraPermission,
    gpsPermission,
    currentLocation,
    cameraStream,
    loading,
    error,
    requestCameraAccess,
    capturePhoto,
    switchCamera,
    stopCamera,
    formatLocation,
    isLocationAccurate
  } = useCameraGPS();

  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<PhotoData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const switchButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management
  useEffect(() => {
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'Enter':
        case ' ':
          if (document.activeElement === captureButtonRef.current && !isCapturing) {
            event.preventDefault();
            handleCapture();
          }
          break;
        case 'Tab':
          // Ensure focus stays within the modal
          const focusableElements = document.querySelectorAll(
            'button, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCapturing, onClose]);

  // Initialize camera on mount
  useEffect(() => {
    const initCamera = async () => {
      try {
        await requestCameraAccess({
          facingMode,
          enableLocation,
          quality
        });
      } catch (error) {
        console.error('Failed to initialize camera:', error);
      }
    };

    if (cameraSupported) {
      initCamera();
    }

    return () => {
      stopCamera();
    };
  }, [cameraSupported, facingMode, enableLocation, quality, requestCameraAccess, stopCamera]);

  // Set video stream when available
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const handleCapture = async () => {
    try {
      setIsCapturing(true);
      const photoData = await capturePhoto({
        facingMode,
        enableLocation,
        quality
      });
      
      setCapturedPhoto(photoData);
      setShowPreview(true);
      
      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = 'Photo captured successfully';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    } catch (error) {
      console.error('Failed to capture photo:', error);
      
      // Announce error to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = 'Failed to capture photo. Please try again.';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setShowPreview(false);
    
    // Announce to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = 'Ready to take a new photo';
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  const handleUsePhoto = () => {
    if (capturedPhoto) {
      onPhotoCaptured(capturedPhoto);
      onClose();
    }
  };

  const handleSwitchCamera = async () => {
    try {
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(newFacingMode);
      await switchCamera();
      
      // Announce camera switch to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Switched to ${newFacingMode} camera`;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  };

  if (!cameraSupported) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-not-supported-title"
        aria-describedby="camera-not-supported-description"
      >
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <h3 id="camera-not-supported-title" className="text-lg font-semibold mb-4">
            Camera Not Supported
          </h3>
          <p id="camera-not-supported-description" className="text-gray-600 mb-4">
            Your device doesn't support camera access. Please use a device with a camera.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Close camera dialog"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (cameraPermission === 'denied') {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-permission-denied-title"
        aria-describedby="camera-permission-denied-description"
      >
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <h3 id="camera-permission-denied-title" className="text-lg font-semibold mb-4">
            Camera Permission Denied
          </h3>
          <p id="camera-permission-denied-description" className="text-gray-600 mb-4">
            Please enable camera access in your browser settings to take photos.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Close camera dialog"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-capture-title"
      aria-describedby="camera-capture-description"
    >
      <div className="bg-white rounded-lg overflow-hidden max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 id="camera-capture-title" className="text-lg font-semibold">
            Take Photo
          </h3>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md p-1"
            aria-label="Close camera capture"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Camera View */}
        {!showPreview && (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
              aria-label="Camera preview"
              role="img"
              aria-describedby="camera-preview-description"
            />
            <div id="camera-preview-description" className="sr-only">
              Live camera preview. Use the capture button to take a photo.
            </div>
            
            {/* Location Indicator */}
            {enableLocation && currentLocation && (
              <div 
                className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center space-x-1">
                  <div 
                    className={`w-2 h-2 rounded-full ${isLocationAccurate(currentLocation) ? 'bg-green-400' : 'bg-yellow-400'}`}
                    aria-label={isLocationAccurate(currentLocation) ? 'Location accurate' : 'Location may be inaccurate'}
                  ></div>
                  <span>{formatLocation(currentLocation)}</span>
                </div>
              </div>
            )}

            {/* Camera Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
              {/* Switch Camera Button */}
              <button
                ref={switchButtonRef}
                onClick={handleSwitchCamera}
                className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={`Switch to ${facingMode === 'user' ? 'back' : 'front'} camera`}
                disabled={loading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Capture Button */}
              <button
                ref={captureButtonRef}
                onClick={handleCapture}
                disabled={loading || isCapturing}
                className="p-4 bg-white rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label={isCapturing ? 'Capturing photo...' : 'Take photo'}
                aria-describedby="capture-button-description"
              >
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  {isCapturing ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                  ) : (
                    <div className="w-8 h-8 bg-white rounded-full" aria-hidden="true"></div>
                  )}
                </div>
              </button>
              <div id="capture-button-description" className="sr-only">
                Press this button to capture a photo. Use Enter or Space key when focused.
              </div>
            </div>
          </div>
        )}

        {/* Photo Preview */}
        {showPreview && capturedPhoto && (
          <div className="relative">
            <img
              src={URL.createObjectURL(capturedPhoto.file)}
              alt="Captured photo preview"
              className="w-full h-64 object-cover"
              role="img"
              aria-describedby="photo-preview-description"
            />
            <div id="photo-preview-description" className="sr-only">
              Preview of the captured photo. Use the buttons below to retake or use this photo.
            </div>
            
            {/* Location Info */}
            {capturedPhoto.location && (
              <div 
                className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center space-x-1">
                  <div 
                    className={`w-2 h-2 rounded-full ${isLocationAccurate(capturedPhoto.location) ? 'bg-green-400' : 'bg-yellow-400'}`}
                    aria-label={isLocationAccurate(capturedPhoto.location) ? 'Location accurate' : 'Location may be inaccurate'}
                  ></div>
                  <span>{formatLocation(capturedPhoto.location)}</span>
                </div>
              </div>
            )}

            {/* Preview Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
              <button
                onClick={handleRetake}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Retake photo"
              >
                Retake
              </button>
              <button
                onClick={handleUsePhoto}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Use this photo"
              >
                Use Photo
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div 
            className="p-4 bg-red-50 border border-red-200 rounded-md m-4"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-4 text-center">
            <div 
              className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"
              aria-label="Loading camera"
              role="status"
            ></div>
            <p className="text-gray-600 mt-2">Initializing camera...</p>
          </div>
        )}
      </div>
    </div>
  );
};
