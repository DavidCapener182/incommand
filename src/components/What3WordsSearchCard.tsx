'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Modal from 'react-modal';
import { useCameraGPS } from '../hooks/useCameraGPS';
import { geocodeAddress } from '../utils/geocoding';
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  XMarkIcon
} from '@heroicons/react/24/outline';

interface What3WordsSearchCardProps {
  lat: number;
  lon: number;
  venueAddress: string;
  /** @deprecated This prop is not currently used in the component implementation */
  singleCard: boolean;
  largeLogo: boolean;
}

interface SearchSuggestion {
  words: string;
  country: string;
  nearestPlace: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface GeocodeSuggestion {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export default function What3WordsSearchCard({ 
  lat, 
  lon, 
  venueAddress, 
  singleCard, 
  largeLogo 
}: What3WordsSearchCardProps) {
  const [searchInput, setSearchInput] = useState(venueAddress || '');
  const [searchedCoordinates, setSearchedCoordinates] = useState<{lat: number, lon: number} | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [geocodeSuggestions, setGeocodeSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number, width: number} | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [gpsState, gpsActions] = useCameraGPS();

  // Modal map URL
  const modalLat = searchedCoordinates?.lat || lat;
  const modalLon = searchedCoordinates?.lon || lon;
  const modalMapUrl = modalLat && modalLon
    ? `https://map.what3words.com/?maptype=roadmap&zoom=17&center=${modalLat},${modalLon}&marker=${modalLat},${modalLon}`
    : null;

  // Get current location for focus parameter
  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);
      const location = await gpsActions.getCurrentLocation();
      return location;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
      setLocationError(errorMessage);
      return null;
    } finally {
      setIsLoadingLocation(false);
    }
  }, [gpsActions]);

  // Check if input looks like What3Words pattern
  const isWhat3WordsPattern = useCallback((input: string) => {
    return /^[a-z]+\.[a-z]+\.[a-z]+$/i.test(input.trim());
  }, []);

  // Search for What3Words suggestions
  const searchWhat3Words = useCallback(async (input: string, focus?: {lat: number, lon: number}) => {
    if (!input.trim()) {
      setSearchSuggestions([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setIsSearching(true);
      setSearchError(null);
      
      let url = `/api/what3words?input=${encodeURIComponent(input)}`;
      if (focus) {
        url += `&focus=${focus.lat},${focus.lon}`;
      }

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error('What3Words API error:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSearchSuggestions(data.suggestions);
      } else {
        console.warn('Unexpected API response format:', data);
        setSearchSuggestions([]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setSearchError(errorMessage);
      setSearchSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Search for geocoding suggestions
  const searchGeocode = useCallback(async (input: string) => {
    if (!input.trim() || isWhat3WordsPattern(input)) {
      setGeocodeSuggestions([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(input)}`, {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setGeocodeSuggestions(data.slice(0, 5)); // Limit to 5 suggestions
      } else {
        setGeocodeSuggestions([]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }
      console.error('Geocoding error:', error);
      setGeocodeSuggestions([]);
    }
  }, [isWhat3WordsPattern]);

  // Handle search input changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchInput.trim()) {
        const location = gpsState.currentLocation;
        const focus = location ? { lat: location.latitude, lon: location.longitude } : undefined;
        
        // Search both What3Words and geocoding in parallel
        await Promise.all([
          searchWhat3Words(searchInput, focus),
          searchGeocode(searchInput)
        ]);
        
        // Update dropdown position when suggestions change
        updateDropdownPosition();
      } else {
        setSearchSuggestions([]);
        setGeocodeSuggestions([]);
        setDropdownPosition(null);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput, searchWhat3Words, searchGeocode, gpsState.currentLocation]);

  // Update dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 200; // Approximate height of dropdown
      
      // Position dropdown below the input if there's space, otherwise above
      let topPosition = rect.bottom + window.scrollY + 5;
      
      // If dropdown would go off the bottom, position it above
      if (topPosition + dropdownHeight > viewportHeight - 50) {
        topPosition = rect.top + window.scrollY - dropdownHeight - 5;
      }
      
      // Ensure it doesn't go off the top of the screen
      if (topPosition < 50) {
        topPosition = 50;
      }
      
      setDropdownPosition({
        top: topPosition,
        left: rect.left + window.scrollX,
        width: rect.width
      });
      setShowDropdown(true);
    }
  }, []);

  // Handle scroll and resize events
  useEffect(() => {
    const handleScroll = () => {
      if (showDropdown) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (showDropdown) {
        updateDropdownPosition();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [showDropdown, updateDropdownPosition]);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && 
          searchInputRef.current && 
          dropdownRef.current &&
          !searchInputRef.current.contains(event.target as Node) &&
          !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalSuggestions = searchSuggestions.length + geocodeSuggestions.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, totalSuggestions - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0) {
          if (activeIndex < searchSuggestions.length) {
            handleSuggestionSelect(searchSuggestions[activeIndex]);
          } else {
            const geocodeIndex = activeIndex - searchSuggestions.length;
            handleGeocodeSelect(geocodeSuggestions[geocodeIndex]);
          }
        } else if (searchInput.trim()) {
          handleSearchSubmit(e);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setActiveIndex(-1);
        break;
    }
  }, [activeIndex, searchSuggestions, geocodeSuggestions, searchInput]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(async (suggestion: SearchSuggestion) => {
    console.log('What3Words suggestion selected:', suggestion);
    
    try {
      // Always convert What3Words to coordinates
      const response = await fetch(`/api/what3words?words=${encodeURIComponent(suggestion.words)}`);
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        
        if (data.coordinates) {
          setSearchedCoordinates({
            lat: data.coordinates.lat,
            lon: data.coordinates.lng
          });
          setSearchInput(suggestion.words);
          setShowDropdown(false);
          setActiveIndex(-1);
          setModalOpen(true);
          console.log('Modal should open with converted coordinates');
        } else {
          console.error('No coordinates in API response');
          setSearchError('Could not get coordinates for this location');
        }
      } else {
        console.error('API request failed:', response.status);
        setSearchError('Failed to convert What3Words to coordinates');
      }
    } catch (error) {
      console.error('Error in handleSuggestionSelect:', error);
      setSearchError('Error processing location selection');
    }
  }, []);

  // Handle geocode suggestion selection
  const handleGeocodeSelect = useCallback(async (suggestion: GeocodeSuggestion) => {
    console.log('Geocode suggestion selected:', suggestion);
    
    try {
      setSearchedCoordinates({
        lat: suggestion.lat,
        lon: suggestion.lon
      });
      setSearchInput(suggestion.name);
      setShowDropdown(false);
      setActiveIndex(-1);
      setModalOpen(true);
    } catch (error) {
      console.error('Error in handleGeocodeSelect:', error);
      setSearchError('Error processing location selection');
    }
  }, []);

  // Handle regular address search
  const handleAddressSearch = useCallback(async (address: string) => {
    try {
      setIsSearching(true);
      setSearchError(null);
      
      const coordinates = await geocodeAddress(address);
      setSearchedCoordinates(coordinates);
      setSearchInput(address);
      setShowDropdown(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Address search failed';
      setSearchError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle current location button click
  const handleCurrentLocationClick = useCallback(async () => {
    const location = await getCurrentLocation();
    if (location) {
      setSearchedCoordinates({
        lat: location.latitude,
        lon: location.longitude
      });
      setSearchInput('');
      setShowDropdown(false);
      setModalOpen(true);
    }
  }, [getCurrentLocation]);

  // Handle search form submission
  const handleSearchSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      if (isWhat3WordsPattern(searchInput)) {
        // It's a What3Words address, convert to coordinates
        try {
          const response = await fetch(`/api/what3words?words=${encodeURIComponent(searchInput)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.coordinates) {
              setSearchedCoordinates({
                lat: data.coordinates.lat,
                lon: data.coordinates.lng
              });
              setModalOpen(true);
            }
          }
        } catch (error) {
          console.error('Error converting What3Words to coordinates:', error);
        }
      } else {
        // It's a regular address, geocode it
        await handleAddressSearch(searchInput);
        setModalOpen(true);
      }
    }
  }, [searchInput, isWhat3WordsPattern, handleAddressSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchInput('');
    setSearchSuggestions([]);
    setGeocodeSuggestions([]);
    setSearchError(null);
    setShowDropdown(false);
    setActiveIndex(-1);
  }, []);

  // Toggle search interface
  const toggleSearch = useCallback(() => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setSearchedCoordinates(null);
      setSearchInput(venueAddress || '');
      setSearchSuggestions([]);
      setGeocodeSuggestions([]);
      setSearchError(null);
      setLocationError(null);
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  }, [showSearch, venueAddress]);

  // Logo size classes based on largeLogo prop
  const logoSizeClass = largeLogo ? 'h-24 w-auto' : 'h-20 w-auto';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2">
      {/* W3W Logo */}
      <div
        className="cursor-pointer mb-2 flex-shrink-0 flex items-center justify-center"
        onClick={toggleSearch}
      >
        <Image
          src="/w3w.png"
          alt="What3Words"
          width={largeLogo ? 192 : 160}
          height={largeLogo ? 96 : 80}
          className={`${logoSizeClass} object-contain`}
          priority
        />
      </div>

      {/* Search Interface */}
      {showSearch && (
        <div className="w-full space-y-1 flex-1 flex flex-col justify-center">
          <form onSubmit={handleSearchSubmit} className="space-y-1">
            <div className="flex space-x-1">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (searchSuggestions.length > 0 || geocodeSuggestions.length > 0) {
                      updateDropdownPosition();
                    }
                  }}
                  placeholder="Search location..."
                  className="w-full pl-6 pr-5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  disabled={isSearching}
                  aria-label="Search for location"
                  aria-expanded={showDropdown}
                  aria-haspopup="listbox"
                  aria-controls="location-suggestions"
                  role="combobox"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleCurrentLocationClick}
                disabled={isLoadingLocation}
                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-xs"
                title="Use current location"
                aria-label="Use current location"
              >
                {isLoadingLocation ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : (
                  <MapPinIcon className="h-3 w-3" />
                )}
              </button>
            </div>

            {/* Error Messages */}
            {(locationError || searchError) && (
              <div className="text-red-500 text-xs" role="alert">
                {locationError || searchError}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Map Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          contentLabel="What3Words Map"
          className="bg-transparent p-0 w-full h-full flex items-center justify-center"
          overlayClassName="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center"
          ariaHideApp={false}
        >
          <div className="relative w-11/12 h-5/6">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-0 right-0 -mt-9 -mr-10 z-10 bg-gray-800 text-white rounded-full p-2 shadow-lg hover:bg-gray-700 transition-colors"
              aria-label="Close map"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <div className="bg-transparent rounded-lg overflow-hidden w-full h-full">
              {modalMapUrl ? (
                <iframe
                  src={modalMapUrl}
                  className="w-full h-full border-none rounded-lg"
                  title="What3Words Map"
                  allow="geolocation"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <p>Loading map...</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Unified Suggestions Dropdown */}
      {showDropdown && dropdownPosition && (searchSuggestions.length > 0 || geocodeSuggestions.length > 0) && (
        <div 
          ref={dropdownRef}
          id="location-suggestions"
          className="fixed z-[9999] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-lg overflow-y-auto max-h-48"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width
          }}
          role="listbox"
          aria-label="Location suggestions"
        >
          {/* What3Words Suggestions */}
          {searchSuggestions.map((suggestion, index) => (
            <button
              key={`w3w-${index}`}
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
              className={`w-full px-2 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0 text-xs cursor-pointer ${
                activeIndex === index ? 'bg-blue-100 dark:bg-blue-600' : ''
              }`}
              role="option"
              aria-selected={activeIndex === index}
            >
              <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <span className="text-blue-600 dark:text-blue-400 mr-2">{'///'}</span>
                {suggestion.words}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {suggestion.nearestPlace}, {suggestion.country}
              </div>
            </button>
          ))}

          {/* Geocode Suggestions */}
          {geocodeSuggestions.map((suggestion, index) => (
            <button
              key={`geo-${index}`}
              type="button"
              onClick={() => handleGeocodeSelect(suggestion)}
              className={`w-full px-2 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0 text-xs cursor-pointer ${
                activeIndex === searchSuggestions.length + index ? 'bg-blue-100 dark:bg-blue-600' : ''
              }`}
              role="option"
              aria-selected={activeIndex === searchSuggestions.length + index}
            >
              <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <MapPinIcon className="h-3 w-3 text-gray-500 mr-2" />
                {suggestion.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {suggestion.state && `${suggestion.state}, `}{suggestion.country}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
