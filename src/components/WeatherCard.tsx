'use client';

import { useEffect, useState } from 'react';
import { WeatherData, getCurrentWeather, getWeatherAlerts } from '@/services/weatherService';
import { CloudIcon, SunIcon, BoltIcon } from '@heroicons/react/24/outline';

interface Props {
  lat: number;
  lon: number;
  locationName: string;
}

export default function WeatherCard({ lat, lon, locationName }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const weatherData = await getCurrentWeather(lat, lon);
      const alerts = await getWeatherAlerts(lat, lon);
      setWeather({ ...weatherData, alerts });
      setError(null);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    
    // Refresh weather data every 5 minutes
    const refreshInterval = setInterval(fetchWeather, 5 * 60 * 1000);
    
    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [lat, lon]);

  if (loading || !weather) {
    return (
      <div className="h-full">
        <h3 className="text-gray-500 text-sm mb-1.5">Current Weather</h3>
        <div className="flex items-start justify-between animate-pulse">
          <div>
            <div className="h-7 bg-gray-100 rounded w-24 mb-1.5"></div>
            <div className="h-3 bg-gray-100 rounded w-32 mb-1"></div>
            <div className="h-3 bg-gray-100 rounded w-28"></div>
          </div>
          <div className="w-6 h-6 bg-gray-100 rounded mt-1"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full">
        <h3 className="text-gray-500 text-sm mb-1.5">Current Weather</h3>
        <p className="text-red-500 text-xs">{error}</p>
      </div>
    );
  }

  const getWeatherBackground = () => {
    const desc = weather.description.toLowerCase();
    if (desc.includes('rain') || desc.includes('drizzle')) {
      return 'bg-gradient-to-br from-blue-100 via-blue-50 to-gray-50';
    }
    if (desc.includes('thunder') || desc.includes('lightning')) {
      return 'bg-gradient-to-br from-yellow-100 via-yellow-50 to-gray-50';
    }
    if (desc.includes('cloud')) {
      return 'bg-gradient-to-br from-gray-100 via-gray-50 to-white';
    }
    if (desc.includes('clear')) {
      return 'bg-gradient-to-br from-sky-100 via-sky-50 to-blue-50';
    }
    return 'bg-gradient-to-br from-gray-50 to-white';
  };

  const WeatherIcon = () => {
    const desc = weather.description.toLowerCase();
    if (desc.includes('rain') || desc.includes('drizzle')) {
      return <CloudIcon className="h-8 w-8 text-blue-500" />;
    }
    if (desc.includes('thunder') || desc.includes('lightning')) {
      return <BoltIcon className="h-8 w-8 text-yellow-500" />;
    }
    if (desc.includes('cloud')) {
      return <CloudIcon className="h-8 w-8 text-gray-500" />;
    }
    if (desc.includes('clear')) {
      return <SunIcon className="h-8 w-8 text-yellow-500" />;
    }
    return <CloudIcon className="h-8 w-8 text-gray-500" />;
  };

  const getWindDescription = (speed: number) => {
    if (speed < 5) return 'Light breeze';
    if (speed < 10) return 'Moderate wind';
    if (speed < 20) return 'Strong wind';
    return 'High winds';
  };

  return (
    <div className={`h-full ${getWeatherBackground()} p-4 transition-all duration-500`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">{Math.round(weather.temperature)}°C</span>
            <span className="text-sm font-medium text-gray-600 capitalize">{weather.description}</span>
          </div>
          <div className="text-gray-600 text-sm mt-2">
            <span className="block font-medium text-gray-700">{locationName}</span>
            <div className="flex items-center mt-1">
              <svg className="h-3 w-3 mr-1 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span>{getWindDescription(weather.windSpeed)} ({Math.round(weather.windSpeed)} m/s)</span>
            </div>
            {weather.rain !== undefined && weather.rain > 0 && (
              <div className="flex items-center text-blue-700 mt-1">
                <CloudIcon className="h-3 w-3 mr-1" />
                <span>Rainfall: {weather.rain.toFixed(2)} mm/h</span>
              </div>
            )}
          </div>
        </div>
        <div className="w-8 h-8">
          <WeatherIcon />
        </div>
      </div>
      {weather.alerts && weather.alerts.length > 0 && (
        <div className="mt-2 p-2 bg-red-100 bg-opacity-60 rounded-md">
          <p className="text-xs font-medium text-red-700">Weather Alert: {weather.alerts[0]}</p>
        </div>
      )}
    </div>
  );
} 