type MapStyleOption = 'street' | 'satellite' | 'hybrid'

export interface MapStyleConfig {
  styleUrl: string
  attribution?: string
}

const DEFAULT_STREET = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const DEFAULT_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const provider = (process.env.NEXT_PUBLIC_MAP_PROVIDER || '').toLowerCase()

function resolveFromEnv(key: string, fallback: string): string {
  const value = process.env[key]
  return value && value.trim().length > 0 ? value : fallback
}

function getMapboxStyle(style: MapStyleOption): MapStyleConfig | null {
  const token = process.env.NEXT_PUBLIC_MAPBOX_API_KEY
  if (!token) {
    return null
  }

  const streetStyle = resolveFromEnv('NEXT_PUBLIC_MAPBOX_STYLE_STREET', 'mapbox/streets-v12')
  const satelliteStyle = resolveFromEnv('NEXT_PUBLIC_MAPBOX_STYLE_SATELLITE', 'mapbox/satellite-v9')
  const hybridStyle = resolveFromEnv('NEXT_PUBLIC_MAPBOX_STYLE_HYBRID', 'mapbox/satellite-streets-v12')

  const styleId = style === 'street' ? streetStyle : style === 'satellite' ? satelliteStyle : hybridStyle
  return {
    styleUrl: `https://api.mapbox.com/styles/v1/${styleId}?access_token=${token}`,
    attribution: '© Mapbox © OpenStreetMap contributors'
  }
}

function getMaptilerStyle(style: MapStyleOption): MapStyleConfig | null {
  const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY
  if (!key) {
    return null
  }

  const street = resolveFromEnv('NEXT_PUBLIC_MAPTILER_STYLE_STREET', 'streets-v2')
  const satellite = resolveFromEnv('NEXT_PUBLIC_MAPTILER_STYLE_SATELLITE', 'satellite')
  const hybrid = resolveFromEnv('NEXT_PUBLIC_MAPTILER_STYLE_HYBRID', 'hybrid')

  const styleId = style === 'street' ? street : style === 'satellite' ? satellite : hybrid
  return {
    styleUrl: `https://api.maptiler.com/maps/${styleId}/style.json?key=${key}`,
    attribution: '© MapTiler © OpenStreetMap contributors'
  }
}

function getGoogleStyle(style: MapStyleOption): MapStyleConfig | null {
  const mapIdEnv = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!mapIdEnv || !apiKey) {
    return null
  }

  const mapId = style === 'street'
    ? mapIdEnv
    : style === 'satellite'
      ? process.env.NEXT_PUBLIC_GOOGLE_MAP_ID_SATELLITE || mapIdEnv
      : process.env.NEXT_PUBLIC_GOOGLE_MAP_ID_HYBRID || mapIdEnv

  return {
    styleUrl: `https://maps.googleapis.com/maps/api/js?key=${apiKey}&map_ids=${mapId}`,
    attribution: '© Google'
  }
}

export function getMapStyle(style: MapStyleOption): MapStyleConfig {
  const fallbackStreet = resolveFromEnv('NEXT_PUBLIC_MAP_STREET_STYLE_URL', DEFAULT_STREET)
  const fallbackSatellite = resolveFromEnv('NEXT_PUBLIC_MAP_SATELLITE_STYLE_URL', DEFAULT_DARK)
  const fallbackHybrid = resolveFromEnv('NEXT_PUBLIC_MAP_HYBRID_STYLE_URL', fallbackSatellite)

  if (provider === 'mapbox') {
    const config = getMapboxStyle(style)
    if (config) return config
  }

  if (provider === 'maptiler') {
    const config = getMaptilerStyle(style)
    if (config) return config
  }

  if (provider === 'google') {
    const config = getGoogleStyle(style)
    if (config) return config
  }

  if (provider === 'hybrid') {
    const config = getMaptilerStyle(style)
    if (config) return config
  }

  switch (style) {
    case 'satellite':
      return { styleUrl: fallbackSatellite, attribution: '© OpenStreetMap contributors' }
    case 'hybrid':
      return { styleUrl: fallbackHybrid, attribution: '© OpenStreetMap contributors' }
    default:
      return { styleUrl: fallbackStreet, attribution: '© OpenStreetMap contributors' }
  }
}

export type { MapStyleOption }
