'use client';

import { useEffect, useState } from 'react';
import { WeatherData, getCurrentWeather } from '@/services/weatherService';
import { 
  CloudIcon, 
  SunIcon, 
  BoltIcon, 
  CloudArrowDownIcon, 
  ExclamationTriangleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';

interface HourlyForecast {
  time: string;
  temp: number;
  description: string;
  icon: string;
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
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hourly, setHourly] = useState<HourlyForecast[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if coordinates are valid
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        throw new Error('Invalid coordinates');
      }

      const weatherData = await getCurrentWeather(lat, lon);
      setWeather(weatherData);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError(err instanceof Error ? err.message : 'Failed to load weather data');
      setRetryCount(prev => prev + 1);
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
      if (!response.ok) {
        console.warn('Hourly forecast not available');
        return;
      }
      const data = await response.json();
      setHourly(data);
    } catch (err) {
      console.error('Error fetching hourly forecast:', err);
    }
  };

  useEffect(() => {
    if (lat && lon) {
      fetchWeather();
      fetchHourly();
    }
    
    // Refresh weather data every 30 minutes to prevent rate limiting
    const refreshInterval = setInterval(() => {
      if (lat && lon) {
        fetchWeather();
        fetchHourly();
      }
    }, 30 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [lat, lon, eventDate, startTime, curfewTime]);

  const WeatherIcon = () => {
    if (!weather) return <CloudIcon className="h-8 w-8 text-gray-400" />;
    
    const desc = weather.description.toLowerCase();
    
    if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) {
      return <CloudArrowDownIcon className="h-8 w-8 text-blue-500" />;
    }
    if (desc.includes('thunder') || desc.includes('lightning')) {
      return <BoltIcon className="h-8 w-8 text-yellow-500" />;
    }
    if (desc.includes('snow') || desc.includes('sleet')) {
      return <CloudArrowDownIcon className="h-8 w-8 text-blue-300" />;
    }
    if (desc.includes('clear')) {
      return <SunIcon className="h-8 w-8 text-yellow-400" />;
    }
    if (desc.includes('few clouds') || desc.includes('scattered clouds')) {
      return <SunIcon className="h-8 w-8 text-yellow-400" />;
    }
    if (desc.includes('broken clouds') || desc.includes('overcast clouds')) {
      return <CloudIcon className="h-8 w-8 text-gray-500" />;
    }
    if (desc.includes('mist') || desc.includes('smoke') || desc.includes('haze') || desc.includes('fog')) {
      return <EyeIcon className="h-8 w-8 text-gray-600" />;
    }
    
    // Default icon
    return <CloudIcon className="h-8 w-8 text-gray-400" />;
  };

  const getWindDescription = (speed: number) => {
    if (speed < 5) return 'Light breeze';
    if (speed < 10) return 'Moderate wind';
    if (speed < 20) return 'Strong wind';
    return 'High winds';
  };

  const getWindIcon = (speed: number) => {
    const size = speed < 10 ? 'h-4 w-4' : speed < 20 ? 'h-5 w-5' : 'h-6 w-6';
    const color = speed < 10 ? 'text-gray-400' : speed < 20 ? 'text-gray-500' : 'text-gray-600';
    return <CloudArrowDownIcon className={`${size} ${color}`} />;
  };

  // Loading state
  if (loading) {
    return (
      <Card className="h-[130px] card-skeleton">
        <CardContent className="p-4 h-full flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full mb-2"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-1"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <Card className="h-[130px] card-depth shadow-sm dark:shadow-md hover:shadow-md transition-all duration-150">
        <CardContent className="p-4 h-full flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center text-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-400 mb-2" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Weather</h3>
            <p className="text-xs text-red-500 mb-2">{error}</p>
            {retryCount < 3 && (
              <button
                onClick={fetchWeather}
                className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // No weather data
  if (!weather) {
    return (
      <Card className="h-[130px] card-depth shadow-sm dark:shadow-md hover:shadow-md transition-all duration-150">
        <CardContent className="p-4 h-full flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center text-center">
            <CloudIcon className="h-8 w-8 text-gray-400 mb-2" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Weather</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[130px] card-depth shadow-sm dark:shadow-md hover:shadow-md transition-all duration-150">
      <CardContent className="p-4 h-full flex flex-col items-center justify-center">
        <div className="w-full h-full flex flex-col items-center justify-center">
        {/* Location name */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 text-center font-medium truncate w-full">
          {locationName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`}
        </div>
        
        {/* Main weather display */}
        <div className="flex items-center justify-center mb-2">
          <div className="mr-3">
            <WeatherIcon />
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(weather.temperature)}°C
            </span>
          </div>
        </div>
        
        {/* Weather description */}
        <span className="text-xs text-gray-600 dark:text-gray-300 capitalize mb-2 text-center">
          {weather.description}
        </span>
        
        {/* Additional weather info */}
        <div className="flex items-center justify-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            {getWindIcon(weather.windSpeed)}
            <span className="ml-1">{Math.round(weather.windSpeed)}m/s</span>
          </div>
          <div className="flex items-center">
            <EyeIcon className="h-4 w-4 mr-1" />
            <span>{weather.humidity}%</span>
          </div>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Export supported event types for conditional rendering
export const supportedEventTypes = ['concert', 'football', 'festival', 'parade']; 