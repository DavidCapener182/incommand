import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const eventDate = searchParams.get('event_date');
  const startTime = searchParams.get('start_time');
  const curfewTime = searchParams.get('curfew_time');
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!lat || !lon || !apiKey) {
    return NextResponse.json(
      { error: 'Missing lat, lon, or API key' },
      { status: 400 }
    );
  }

  try {
    // Get 5-day forecast
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch forecast data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Process hourly data for the event day
    const hourlyForecast = data.list
      .filter((item: any) => {
        const itemDate = new Date(item.dt * 1000);
        const itemHour = itemDate.getHours();
        
        // If event date is provided, filter for that specific day
        if (eventDate) {
          const eventDateObj = new Date(eventDate);
          return itemDate.toDateString() === eventDateObj.toDateString();
        }
        
        // Otherwise, return next 24 hours
        return true;
      })
      .slice(0, 8) // Get next 8 3-hour intervals (24 hours)
      .map((item: any) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        temp: Math.round(item.main.temp),
        description: item.weather[0].description,
        icon: item.weather[0].icon
      }));

    return NextResponse.json(hourlyForecast);
  } catch (error) {
    console.error('Hourly forecast API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
