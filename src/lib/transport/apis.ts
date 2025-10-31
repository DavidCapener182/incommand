/**
 * Free transport API integrations
 * These APIs provide real-time transport data without requiring API keys
 * Uses venue location to provide arrival planning assistance
 * 
 * CURRENT STATUS:
 * - ✅ REAL: TfL API (Transport for London) - Live Tube & Bus status
 * - ⚠️ SIMULATED: National Rail - Location-based estimates (no free real-time API available)
 * - ⚠️ SIMULATED: Road Closures - Matchday-based estimates (requires API keys for real data)
 * - ⚠️ SIMULATED: Bus Stops - Hardcoded for known venues (requires GTFS feeds for real data)
 * - ⚠️ ESTIMATED: Taxi wait times - Time-based estimates (no free real-time API available)
 * 
 * TODO: Integrate real APIs where available:
 * - National Rail: OpenLDBWS API (requires API key from https://www.nationalrail.co.uk/46391.aspx)
 * - Road Closures: Highways England API or local authority APIs (requires API keys)
 * - Bus Stops: GTFS feeds from local transport authorities (Merseytravel, TfGM, etc.)
 */

interface TransportStatus {
  type: 'rail' | 'bus' | 'tube' | 'road' | 'taxi'
  status: 'normal' | 'delayed' | 'disrupted' | 'severe'
  message: string
  lastUpdated: string
  details?: {
    route?: string
    station?: string
    closure?: string
    delay?: number
    nextUpdate?: string
    distance?: number
  }
}

interface RoadClosure {
  road: string
  reason: string
  severity: 'minor' | 'moderate' | 'major'
  coordinates?: { lat: number; lng: number }
  distance?: number // distance from venue in km
}

interface BusStop {
  stop: string
  routes: string[]
  distance: number
}

/**
 * Fetch TfL (Transport for London) status
 * ✅ REAL DATA - Free API, no authentication required
 * Source: https://api.tfl.gov.uk/
 */
export async function fetchTfLStatus(coordinates?: { lat: number; lng: number }): Promise<TransportStatus[]> {
  try {
    const [tubeResponse, busResponse] = await Promise.allSettled([
      fetch('https://api.tfl.gov.uk/Line/Mode/tube/Status'),
      fetch('https://api.tfl.gov.uk/Line/Mode/bus/Status')
    ])

    const results: TransportStatus[] = []

    // Process Tube status
    if (tubeResponse.status === 'fulfilled' && tubeResponse.value.ok) {
      const tubeData = await tubeResponse.value.json()
      const disruptedLines: string[] = []
      
      tubeData.forEach((line: any) => {
        const hasDisruption = line.lineStatuses?.some((status: any) => 
          status.statusSeverity !== 10 && status.statusSeverity !== 9
        )
        if (hasDisruption) {
          disruptedLines.push(line.name)
        }
      })
      
      results.push({
        type: 'tube',
        status: disruptedLines.length > 0 ? 'disrupted' : 'normal',
        message: disruptedLines.length > 0 
          ? `${disruptedLines.slice(0, 3).join(', ')}${disruptedLines.length > 3 ? '...' : ''} experiencing delays` 
          : 'Tube operating normally',
        lastUpdated: new Date().toISOString(),
        details: {
          route: disruptedLines.length > 0 ? disruptedLines.join(', ') : undefined
        }
      })
    }

    // Process Bus status
    if (busResponse.status === 'fulfilled' && busResponse.value.ok) {
      const busData = await busResponse.value.json()
      const disruptedRoutes: string[] = []
      
      busData.forEach((line: any) => {
        const hasDisruption = line.lineStatuses?.some((status: any) => 
          status.statusSeverity !== 10 && status.statusSeverity !== 9
        )
        if (hasDisruption) {
          disruptedRoutes.push(line.name)
        }
      })
      
      results.push({
        type: 'bus',
        status: disruptedRoutes.length > 0 ? 'disrupted' : 'normal',
        message: disruptedRoutes.length > 0 
          ? `${disruptedRoutes.length} bus route${disruptedRoutes.length > 1 ? 's' : ''} experiencing delays` 
          : 'Buses operating normally',
        lastUpdated: new Date().toISOString(),
        details: {
          route: disruptedRoutes.length > 0 ? `${disruptedRoutes.length} routes affected` : undefined
        }
      })
    }

    return results
  } catch (error) {
    console.error('Failed to fetch TfL status:', error)
    return []
  }
}

/**
 * Fetch National Rail status
 * ⚠️ CURRENTLY SIMULATED - Location and time-based estimates
 * 
 * Options for real data (uncomment one):
 * 1. Realtime Trains API (free, unofficial): https://www.realtimetrains.co.uk/about/developer/
 * 2. OpenLDBWS API (requires API key): https://www.nationalrail.co.uk/46391.aspx
 * 3. TransportAPI (requires API key): https://www.transportapi.com/
 */
export async function fetchNationalRailStatus(
  postcode?: string,
  coordinates?: { lat: number; lng: number }
): Promise<TransportStatus[]> {
  try {
    // TODO: Uncomment to use Realtime Trains API (free, no key required)
    // if (coordinates) {
    //   try {
    //     // Find nearest station using coordinates
    //     const stationResponse = await fetch(`https://api.rtt.io/api/v1/json/search/${postcode || coordinates.lat + ',' + coordinates.lng}`)
    //     if (stationResponse.ok) {
    //       const stationData = await stationResponse.json()
    //       // Process real station and service data
    //       // return real status based on stationData
    //     }
    //   } catch (error) {
    //     console.error('Realtime Trains API failed, falling back to estimate:', error)
    //   }
    // }
    
    // Current: Enhanced National Rail status based on location (simulated)
    const hour = new Date().getHours()
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)
    
    let status: 'normal' | 'delayed' | 'disrupted' = 'normal'
    let message = 'National Rail services operating normally'
    let stationInfo = ''
    
    // Detect major stations near coordinates
    if (coordinates) {
      // Liverpool area
      if (coordinates.lat > 53.3 && coordinates.lat < 53.5 && coordinates.lng > -3.0 && coordinates.lng < -2.8) {
        stationInfo = 'Liverpool Lime Street, Sandhills'
        if (isPeakHour) {
          status = 'delayed'
          message = 'Peak hour delays possible on Merseyrail services'
        }
      }
      // Manchester area
      else if (coordinates.lat > 53.4 && coordinates.lat < 53.5 && coordinates.lng > -2.3 && coordinates.lng < -2.2) {
        stationInfo = 'Manchester Piccadilly, Victoria'
        if (isPeakHour) {
          status = 'delayed'
          message = 'Peak hour delays possible on local services'
        }
      }
      // London area
      else if (coordinates.lat > 51.3 && coordinates.lat < 51.6 && coordinates.lng > -0.5 && coordinates.lng < 0.3) {
        stationInfo = 'Multiple London stations'
        if (isPeakHour) {
          status = 'delayed'
          message = 'Peak hour delays possible on some routes'
        }
      }
      // Birmingham area
      else if (coordinates.lat > 52.4 && coordinates.lat < 52.5 && coordinates.lng > -2.0 && coordinates.lng < -1.8) {
        stationInfo = 'Birmingham New Street'
        if (isPeakHour) {
          status = 'delayed'
          message = 'Peak hour delays possible'
        }
      }
    }
    
    return [{
      type: 'rail',
      status,
      message: stationInfo ? `${message} (${stationInfo})` : message,
      lastUpdated: new Date().toISOString(),
      details: {
        station: stationInfo || undefined
      }
    }]
  } catch (error) {
    console.error('Failed to fetch National Rail status:', error)
    return []
  }
}

/**
 * Fetch road closures using location-based detection
 * ⚠️ CURRENTLY SIMULATED - Matchday and time-based estimates
 * 
 * Options for real data (uncomment one):
 * 1. OpenStreetMap Overpass API (free, no key): Query for road closures near venue
 * 2. Highways England API (requires API key): https://webtris.highwaysengland.co.uk/api/swagger/ui/index
 * 3. Local authority road closure APIs (varies by region)
 */
export async function fetchRoadClosures(
  coordinates?: { lat: number; lng: number },
  radius: number = 5 // km
): Promise<RoadClosure[]> {
  if (!coordinates) return []
  
  try {
    // Try OpenStreetMap Overpass API (free, no key required) for real road closures
    try {
      const overpassQuery = `[out:json][timeout:25];
        (
          way["highway"]["access"!~"yes|designated"]["closed"~"yes|closed"](around:${radius * 1000},${coordinates.lat},${coordinates.lng});
          relation["highway"]["access"!~"yes|designated"]["closed"~"yes|closed"](around:${radius * 1000},${coordinates.lat},${coordinates.lng});
        );
        out geom;`;
      
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`, {
        headers: { 
          'User-Agent': 'inCommand Transport System',
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.elements && data.elements.length > 0) {
          const realClosures: RoadClosure[] = data.elements.map((element: any) => {
            // Calculate distance from venue
            const center = element.center || (element.geometry && element.geometry[0])
            const distance = center ? 
              Math.sqrt(
                Math.pow((center.lat - coordinates.lat) * 111, 2) + 
                Math.pow((center.lon - coordinates.lng) * 111, 2)
              ) : 0
            
            return {
              road: element.tags?.name || 
                    element.tags?.ref || 
                    'Unnamed road',
              reason: element.tags?.note || 
                     element.tags?.description || 
                     'Road closure reported',
              severity: element.tags?.severity as 'minor' | 'moderate' | 'major' || 'moderate',
              coordinates: center ? { lat: center.lat, lng: center.lon } : undefined,
              distance: distance
            }
          })
          
          if (realClosures.length > 0) {
            console.log('Found real road closures from OpenStreetMap:', realClosures.length)
            return realClosures
          }
        }
      }
    } catch (error) {
      console.log('OpenStreetMap API failed for road closures, falling back to simulated data:', error)
    }
    
    // Fallback: Simulated road closures based on venue location and matchday detection
    const closures: RoadClosure[] = []
    const hour = new Date().getHours()
    const dayOfWeek = new Date().getDay() // 0 = Sunday
    
    // Matchday detection (typically weekends or weekday evenings)
    const isMatchday = dayOfWeek === 6 || dayOfWeek === 0 || (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 17)
    
    // Liverpool area (Anfield example)
    if (coordinates.lat > 53.3 && coordinates.lat < 53.5 && coordinates.lng > -3.0 && coordinates.lng < -2.8) {
      if (isMatchday && hour >= 14 && hour <= 22) {
        closures.push({
          road: 'Anfield Road',
          reason: 'Matchday traffic management',
          severity: 'moderate',
          coordinates: { lat: coordinates.lat + 0.01, lng: coordinates.lng },
          distance: 0.5
        })
        closures.push({
          road: 'Walton Breck Road',
          reason: 'Matchday closure',
          severity: 'moderate',
          coordinates: { lat: coordinates.lat + 0.008, lng: coordinates.lng + 0.002 },
          distance: 0.3
        })
      }
    }
    
    // Manchester area (Old Trafford example)
    else if (coordinates.lat > 53.4 && coordinates.lat < 53.5 && coordinates.lng > -2.3 && coordinates.lng < -2.2) {
      if (isMatchday && hour >= 14 && hour <= 22) {
        closures.push({
          road: 'Sir Matt Busby Way',
          reason: 'Matchday traffic management',
          severity: 'moderate',
          coordinates: { lat: coordinates.lat + 0.005, lng: coordinates.lng },
          distance: 0.2
        })
      }
    }
    
    // London area (Wembley example)
    else if (coordinates.lat > 51.5 && coordinates.lat < 51.6 && coordinates.lng > -0.3 && coordinates.lng < -0.2) {
      if (isMatchday && hour >= 14 && hour <= 22) {
        closures.push({
          road: 'Olympic Way',
          reason: 'Event traffic management',
          severity: 'moderate',
          coordinates: { lat: coordinates.lat, lng: coordinates.lng },
          distance: 0.1
        })
      }
    }
    
    return closures
  } catch (error) {
    console.error('Failed to fetch road closures:', error)
    return []
  }
}

/**
 * Fetch nearby bus stops using coordinates
 * ⚠️ CURRENTLY SIMULATED - Hardcoded stops for known venues
 * 
 * Options for real data (uncomment one):
 * 1. OpenStreetMap Overpass API (free, no key): https://overpass-turbo.eu/
 * 2. GTFS feeds from local transport authorities (Merseytravel, TfGM, etc.)
 * 3. Local authority transport APIs
 */
export async function fetchBusStops(
  coordinates?: { lat: number; lng: number },
  radius: number = 1 // km
): Promise<BusStop[]> {
  if (!coordinates) return []
  
  try {
    // Try OpenStreetMap Overpass API (free, no key required) for real bus stops
    try {
      const query = `[out:json][timeout:25];
        (
          node["public_transport"="platform"]["bus"="yes"](around:${radius * 1000},${coordinates.lat},${coordinates.lng});
          node["highway"="bus_stop"](around:${radius * 1000},${coordinates.lat},${coordinates.lng});
        );
        out;`;
      
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
        headers: { 
          'User-Agent': 'inCommand Transport System',
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.elements && data.elements.length > 0) {
          const realStops: BusStop[] = data.elements
            .slice(0, 5) // Limit to 5 nearest stops
            .map((element: any) => {
              const distance = coordinates ? 
                Math.sqrt(
                  Math.pow((element.lat - coordinates.lat) * 111, 2) + 
                  Math.pow((element.lon - coordinates.lng) * 111, 2)
                ) : 0
              
              return {
                stop: element.tags?.name || 
                      element.tags?.['name:en'] || 
                      `${element.lat.toFixed(4)}, ${element.lon.toFixed(4)}`,
                routes: element.tags?.routes?.split(';').filter((r: string) => r.trim()) || [],
                distance: distance
              }
            })
            .sort((a: BusStop, b: BusStop) => a.distance - b.distance)
          
          if (realStops.length > 0) {
            console.log('Found real bus stops from OpenStreetMap:', realStops.length)
            return realStops
          }
        }
      }
    } catch (error) {
      console.log('OpenStreetMap API failed, falling back to simulated data:', error)
    }
    
    // Fallback: Simulated bus stops based on known venues
    const stops: BusStop[] = []
    
    // Liverpool area (Anfield example)
    if (coordinates.lat > 53.3 && coordinates.lat < 53.5 && coordinates.lng > -3.0 && coordinates.lng < -2.8) {
      stops.push({
        stop: 'Anfield Road Stop',
        routes: ['26', '27', '917'],
        distance: 0.2
      })
      stops.push({
        stop: 'Walton Breck Road Stop',
        routes: ['17', '26'],
        distance: 0.4
      })
      stops.push({
        stop: 'County Road Stop',
        routes: ['14', '17', '26'],
        distance: 0.6
      })
    }
    
    // Manchester area
    else if (coordinates.lat > 53.4 && coordinates.lat < 53.5 && coordinates.lng > -2.3 && coordinates.lng < -2.2) {
      stops.push({
        stop: 'Sir Matt Busby Way Stop',
        routes: ['250', '255', '263'],
        distance: 0.15
      })
      stops.push({
        stop: 'Chester Road Stop',
        routes: ['250', '255'],
        distance: 0.5
      })
    }
    
    // London area
    else if (coordinates.lat > 51.3 && coordinates.lat < 51.6 && coordinates.lng > -0.5 && coordinates.lng < 0.3) {
      stops.push({
        stop: 'Wembley Park Station',
        routes: ['18', '83', '92', '182'],
        distance: 0.3
      })
      stops.push({
        stop: 'Wembley Stadium Station',
        routes: ['92', '182', '206'],
        distance: 0.2
      })
    }
    
    return stops.sort((a, b) => a.distance - b.distance)
  } catch (error) {
    console.error('Failed to fetch bus stops:', error)
    return []
  }
}

/**
 * Fetch transport status for a given location
 * Combines multiple free APIs based on location
 */
export async function fetchTransportStatus(
  location?: string,
  postcode?: string,
  coordinates?: { lat: number; lng: number }
): Promise<TransportStatus[]> {
  const results: TransportStatus[] = []

  // If location is London or postcode starts with London area codes, use TfL
  const isLondon = location?.toLowerCase().includes('london') || 
                   postcode?.toUpperCase().startsWith('SW') ||
                   postcode?.toUpperCase().startsWith('SE') ||
                   postcode?.toUpperCase().startsWith('NW') ||
                   postcode?.toUpperCase().startsWith('NE') ||
                   postcode?.toUpperCase().startsWith('W') ||
                   postcode?.toUpperCase().startsWith('E') ||
                   postcode?.toUpperCase().startsWith('N') ||
                   postcode?.toUpperCase().startsWith('EC')

  if (isLondon) {
    // ✅ REAL DATA - TfL API
    const tflStatus = await fetchTfLStatus(coordinates)
    results.push(...tflStatus)
  } else {
    // ⚠️ SIMULATED DATA - National Rail (location-based estimates)
    const railStatus = await fetchNationalRailStatus(postcode, coordinates)
    results.push(...railStatus)
  }

  // ⚠️ SIMULATED DATA - Road closures (matchday-based estimates)
  const roadClosures = await fetchRoadClosures(coordinates, 5)
  if (roadClosures.length > 0) {
    roadClosures.forEach(closure => {
      results.push({
        type: 'road',
        status: closure.severity === 'major' ? 'severe' : 
                closure.severity === 'moderate' ? 'disrupted' : 'delayed',
        message: `${closure.road}: ${closure.reason}${closure.distance ? ` (${closure.distance.toFixed(1)}km away)` : ''}`,
        lastUpdated: new Date().toISOString(),
        details: {
          closure: closure.reason,
          distance: closure.distance
        }
      })
    })
  } else {
    // Only show "normal" road status if we have coordinates and no closures found
    if (coordinates) {
      results.push({
        type: 'road',
        status: 'normal',
        message: 'No road closures reported nearby',
        lastUpdated: new Date().toISOString()
      })
    }
  }

  // ⚠️ ESTIMATED DATA - Taxi wait times (time-based estimates, no free real-time API available)
  const hour = new Date().getHours()
  const isPeakHour = (hour >= 17 && hour <= 19) || (hour >= 22 || hour <= 2)
  const taxiWait = isPeakHour ? '~15-20 mins' : '~5-10 mins'
  
  results.push({
    type: 'taxi',
    status: isPeakHour ? 'delayed' : 'normal',
    message: `Taxi wait time: ${taxiWait}`,
    lastUpdated: new Date().toISOString(),
    details: {
      delay: isPeakHour ? 15 : 5
    }
  })

  return results
}

/**
 * Get arrival planning summary
 * Provides actionable insights for customer arrival planning
 */
export async function getArrivalPlanningSummary(
  location?: string,
  postcode?: string,
  coordinates?: { lat: number; lng: number }
): Promise<{
  warnings: string[]
  recommendations: string[]
  estimatedArrivalTime: string
  nearbyStops: BusStop[]
}> {
  const statuses = await fetchTransportStatus(location, postcode, coordinates)
  const roadClosures = await fetchRoadClosures(coordinates, 5)
  const busStops = await fetchBusStops(coordinates, 1)
  
  const warnings: string[] = []
  const recommendations: string[] = []
  
  // Check for disruptions
  const disruptions = statuses.filter(s => s.status !== 'normal')
  if (disruptions.length > 0) {
    warnings.push(`${disruptions.length} transport service${disruptions.length > 1 ? 's' : ''} experiencing issues`)
  }
  
  // Check for road closures
  if (roadClosures.length > 0) {
    warnings.push(`${roadClosures.length} road closure${roadClosures.length > 1 ? 's' : ''} nearby`)
    recommendations.push('Consider alternative routes or allow extra travel time')
  }
  
  // Bus stop recommendations
  if (busStops.length > 0) {
    const nearestStop = busStops[0]
    recommendations.push(`Nearest bus stop: ${nearestStop.stop} (${nearestStop.distance.toFixed(1)}km away)`)
    recommendations.push(`Routes: ${nearestStop.routes.join(', ')}`)
  }
  
  // Peak hour recommendations
  const hour = new Date().getHours()
  const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)
  if (isPeakHour) {
    recommendations.push('Peak hour traffic expected - allow extra 15-20 minutes travel time')
  }
  
  // Estimate arrival time
  let estimatedArrivalTime = '30-45 minutes'
  if (disruptions.length > 0) {
    estimatedArrivalTime = '45-60 minutes'
  }
  if (roadClosures.length > 0) {
    estimatedArrivalTime = '60-75 minutes'
  }
  
  return {
    warnings,
    recommendations,
    estimatedArrivalTime,
    nearbyStops: busStops
  }
}
