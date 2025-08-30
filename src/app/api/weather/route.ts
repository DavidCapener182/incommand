import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rateLimit';
import { validateRequest, schemas } from '@/lib/validation';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleWeatherRequest(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

    // Validate input parameters
    const validation = validateRequest(schemas.weather.weatherRequest, {
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined
    }, 'weather-api');

    if (!validation.success) {
      logger.warn('Weather API validation failed', {
        component: 'WeatherAPI',
        action: 'GET',
        errors: validation.errors,
        lat,
        lon
      });
      return NextResponse.json(
        { error: 'Invalid coordinates provided', details: validation.errors },
        { status: 400 }
      );
    }

    const { lat: validatedLat, lon: validatedLon } = validation.data;

    // Try OpenWeatherMap first if API key is available
    if (apiKey) {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${validatedLat}&lon=${validatedLon}&units=metric&appid=${apiKey}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          logger.debug('Weather data fetched from OpenWeatherMap', {
            component: 'WeatherAPI',
            action: 'GET',
            lat: validatedLat,
            lon: validatedLon,
            status: response.status
          });
          return NextResponse.json(data);
        } else {
          logger.warn('OpenWeatherMap API returned error', {
            component: 'WeatherAPI',
            action: 'GET',
            lat: validatedLat,
            lon: validatedLon,
            status: response.status
          });
        }
      } catch (error) {
        logger.error('OpenWeatherMap API error', error, {
          component: 'WeatherAPI',
          action: 'GET',
          lat: validatedLat,
          lon: validatedLon
        });
      }
    }

    // Fallback: Use wttr.in (free weather API, no key required)
    try {
      const wttrUrl = `https://wttr.in/?format=j1&lat=${validatedLat}&lon=${validatedLon}`;
      const response = await fetch(wttrUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform wttr.in data to match OpenWeatherMap format
        const current = data.current_condition[0];
        const weather = data.weather[0];
        
        const transformedData = {
          main: {
            temp: parseFloat(current.temp_C),
            humidity: parseInt(current.humidity),
            feels_like: parseFloat(current.FeelsLikeC)
          },
          weather: [{
            description: current.lang_en[0].value,
            main: current.lang_en[0].value.split(' ')[0]
          }],
          wind: {
            speed: parseFloat(current.windspeedKmph) / 3.6, // Convert km/h to m/s
            deg: parseInt(current.winddirDegree)
          },
          rain: {
            '1h': parseFloat(current.precipMM) || 0
          }
        };
        
        logger.debug('Weather data fetched from wttr.in fallback', {
          component: 'WeatherAPI',
          action: 'GET',
          lat: validatedLat,
          lon: validatedLon,
          status: response.status
        });
        
        return NextResponse.json(transformedData);
      } else {
        logger.warn('wttr.in API returned error', {
          component: 'WeatherAPI',
          action: 'GET',
          lat: validatedLat,
          lon: validatedLon,
          status: response.status
        });
      }
    } catch (error) {
      logger.error('Fallback weather API error', error, {
        component: 'WeatherAPI',
        action: 'GET',
        lat: validatedLat,
        lon: validatedLon
      });
    }

    // If both APIs fail, return a mock response
    logger.warn('All weather APIs failed, returning mock data', {
      component: 'WeatherAPI',
      action: 'GET',
      lat: validatedLat,
      lon: validatedLon
    });

    return NextResponse.json({
      main: {
        temp: 20,
        humidity: 65,
        feels_like: 22
      },
      weather: [{
        description: 'Partly cloudy',
        main: 'Clouds'
      }],
      wind: {
        speed: 5,
        deg: 180
      },
      rain: {
        '1h': 0
      }
    });
  } catch (error) {
    logger.error('Weather API unexpected error', error, {
      component: 'WeatherAPI',
      action: 'GET'
    });
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

// Export rate-limited handler
export const GET = withRateLimit(handleWeatherRequest, 'general');
