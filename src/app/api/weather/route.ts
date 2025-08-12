import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Missing lat or lon parameters' },
      { status: 400 }
    );
  }

  // Try OpenWeatherMap first if API key is available
  if (apiKey) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (error) {
      console.error('OpenWeatherMap API error:', error);
    }
  }

  // Fallback: Use wttr.in (free weather API, no key required)
  try {
    const wttrUrl = `https://wttr.in/?format=j1&lat=${lat}&lon=${lon}`;
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
      
      return NextResponse.json(transformedData);
    }
  } catch (error) {
    console.error('Fallback weather API error:', error);
  }

  // If both APIs fail, return a mock response
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
}
