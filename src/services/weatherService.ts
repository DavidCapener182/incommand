// Using OpenWeatherMap API for weather data
const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  temperature: number;
  description: string;
  windSpeed: number;
  humidity: number;
  rain?: number;
}

export const getCurrentWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch weather data');
    }
    const data = await response.json();
    console.log('Current weather API response:', data); // Debug log
    return {
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      windSpeed: Math.round(data.wind.speed),
      humidity: data.main.humidity,
      rain: data.rain?.['1h'] || 0
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
};

// Alias for backward compatibility
export const getWeatherData = getCurrentWeather; 