'use client';

import { useEffect, useState } from 'react';
import { WeatherData, getCurrentWeather } from '@/services/weatherService';
import { CloudIcon, SunIcon, BoltIcon, CloudArrowDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface HourlyForecast {
  time: string;
  temp: number;
  description: string;
}

interface Props {
  lat: number;
  lon: number;
  locationName: string;
  eventDate: string;
  startTime: string;
  curfewTime: string;
}

export default function WeatherCard({ lat, lon, locationName, eventDate, startTime, curfewTime }: Props) {
  console.log('WeatherCard coordinates:', lat, lon);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hourly, setHourly] = useState<HourlyForecast[]>([]);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const weatherData = await getCurrentWeather(lat, lon);
      setWeather(weatherData);
      setError(null);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch hourly forecast for the event day
  const fetchHourly = async () => {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
        event_date: eventDate,
        start_time: startTime,
        curfew_time: curfewTime
      });
      const response = await fetch(`/api/hourly-forecast?${params.toString()}`);
      if (!response.ok) return;
      const data = await response.json();
      setHourly(data);
    } catch (err) {
      console.error('Error fetching hourly forecast:', err);
    }
  };

  useEffect(() => {
    fetchWeather();
    fetchHourly();
    // Refresh weather data every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchWeather();
      fetchHourly();
    }, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [lat, lon]);

  if (loading || !weather) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <h3 className="text-gray-500 text-sm mb-1.5">Current Weather</h3>
        <div className="flex items-start justify-between animate-pulse w-full">
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
      <div className="w-full h-full flex flex-col items-center justify-center">
        <h3 className="text-gray-500 text-sm mb-1.5">Current Weather</h3>
        <p className="text-red-500 text-xs">{error}</p>
      </div>
    );
  }

  if (weather) {
    console.log('WeatherCard display value:', weather);
  }

  const WeatherIcon = () => {
    const desc = weather.description.toLowerCase();
    
    if (desc.includes('rain') || desc.includes('drizzle')) {
      return <CloudArrowDownIcon className="h-10 w-10 text-blue-500" />;
    }
    if (desc.includes('thunder') || desc.includes('lightning')) {
      return <BoltIcon className="h-10 w-10 text-yellow-500" />;
    }
    if (desc.includes('snow') || desc.includes('sleet')) {
      return <CloudIcon className="h-10 w-10 text-blue-300" />;
    }
    if (desc.includes('clear')) {
      return <SunIcon className="h-10 w-10 text-yellow-400" />;
    }
    if (desc.includes('few clouds')) {
      return <SunIcon className="h-10 w-10 text-yellow-400" />;
    }
    if (desc.includes('scattered clouds') || desc.includes('broken clouds') || desc.includes('overcast clouds')) {
      return <CloudIcon className="h-10 w-10 text-gray-500" />;
    }
    if (desc.includes('mist') || desc.includes('smoke') || desc.includes('haze') || desc.includes('sand') || desc.includes('dust') || desc.includes('fog') || desc.includes('ash') || desc.includes('squall') || desc.includes('tornado')) {
        return <ExclamationTriangleIcon className="h-10 w-10 text-gray-600" />;
    }
    
    // Default icon
    return <CloudIcon className="h-10 w-10 text-gray-400" />;
  };

  const getWindDescription = (speed: number) => {
    const score = Math.min(Math.round(speed / 2.5), 10);
    if (speed < 5) return `Light breeze (${score}/10)`;
    if (speed < 10) return `Moderate wind (${score}/10)`;
    if (speed < 20) return `Strong wind (${score}/10)`;
    return `High winds (${score}/10)`;
  };

  return (
    <div className="bg-white dark:bg-[#23408e] text-gray-900 dark:text-gray-100 rounded-lg shadow p-6">
      <div className="flex items-center justify-center mb-1">
        <div className="mr-2">
          <WeatherIcon />
        </div>
        <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{Math.round(weather.temperature)}°C</span>
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-100 capitalize">{weather.description}</span>
    </div>
  );
} 