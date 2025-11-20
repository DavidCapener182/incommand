'use client';

import { useEffect, useState, useCallback } from 'react';
import { WeatherData, getCurrentWeather } from '@/services/weatherService';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudLightning, 
  CloudSnow, 
  Wind, 
  Droplets, 
  MapPin,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  lat: number;
  lon: number;
  locationName: string;
}

// --- Helper Components ---
const CardFrame = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  // Fixed height 130px, p-4 (16px) -> leaves 98px for content
  <div className={cn("flex flex-col rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md h-[130px] relative overflow-hidden p-4", className)}>
    {children}
  </div>
)

const CardHeader = ({ icon: Icon, title, action, lightMode = false }: { icon: any; title: string; action?: () => void; lightMode?: boolean }) => (
  <div className="flex items-center justify-between mb-1 shrink-0 relative z-10 h-5">
    <div className="flex items-center gap-1.5">
      <div className={cn("flex h-5 w-5 items-center justify-center rounded-md backdrop-blur-md", lightMode ? "bg-black/10 text-slate-700" : "bg-white/20 text-white")}>
        <Icon className="h-3 w-3" />
      </div>
      <span className={cn("text-[10px] font-bold uppercase tracking-wider", lightMode ? "text-slate-700" : "text-white/90 shadow-black/10 drop-shadow-sm")}>{title}</span>
    </div>
    {action && (
      <button onClick={action} className={cn("transition-colors", lightMode ? "text-slate-400 hover:text-slate-600" : "text-white/60 hover:text-white")}>
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
)

export default function WeatherCard({ lat, lon, locationName }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    try {
      if (!weather) setLoading(true);
      setError(null);
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) throw new Error('Invalid coords');
      const weatherData = await getCurrentWeather(lat, lon);
      setWeather(weatherData);
    } catch (err) {
      setError('Failed');
    } finally {
      setLoading(false);
    }
  }, [lat, lon, weather]);

  useEffect(() => {
    fetchWeather();
    const refreshInterval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [fetchWeather]);

  // --- Visual Logic ---
  const getWeatherVisuals = (desc: string = '') => {
    const d = desc.toLowerCase();
    if (d.includes('rain') || d.includes('drizzle')) return { bg: 'bg-gradient-to-br from-slate-700 via-blue-900 to-slate-900', icon: CloudRain, text: 'text-white', overlay: 'bg-blue-500/10' };
    if (d.includes('thunder') || d.includes('lightning')) return { bg: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800', icon: CloudLightning, text: 'text-white', overlay: 'bg-purple-500/10' };
    if (d.includes('snow')) return { bg: 'bg-gradient-to-br from-slate-100 via-blue-50 to-white', icon: CloudSnow, text: 'text-slate-700', lightMode: true, overlay: 'bg-white/40' };
    if (d.includes('clear') || d.includes('sunny')) return { bg: 'bg-gradient-to-br from-blue-400 via-blue-300 to-blue-100', icon: Sun, text: 'text-white', overlay: 'bg-yellow-500/10' };
    return { bg: 'bg-gradient-to-br from-slate-400 to-slate-600', icon: Cloud, text: 'text-white', overlay: 'bg-white/5' };
  };

  const visuals = getWeatherVisuals(weather?.description);
  const Icon = visuals.icon;

  return (
    <CardFrame className={cn("border-0", visuals.bg)}>
      <div className={cn("absolute inset-0 pointer-events-none", visuals.overlay)} />

      <CardHeader icon={Cloud} title="Weather" action={fetchWeather} lightMode={visuals.lightMode} />

      {loading && !weather ? (
        <div className={cn("flex-1 flex flex-col items-center justify-center text-[10px] animate-pulse", visuals.text)}>Loading...</div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-2 text-center"><p className="text-[10px] text-red-200">Unavailable</p></div>
      ) : weather ? (
        <div className="flex flex-col justify-between h-full min-h-0 relative z-10 pt-0.5">
          
          {/* Main Stats Row */}
          <div className="flex items-start justify-between">
            <div>
               <div className={cn("flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide mb-0 opacity-80", visuals.text)}>
                 <MapPin className="h-2.5 w-2.5" />
                 <span className="truncate max-w-[110px]">{locationName}</span>
               </div>
               <div className="flex items-baseline gap-2">
                 <span className={cn("text-2xl font-bold tracking-tighter leading-none", visuals.text)}>
                   {Math.round(weather.temperature)}°
                 </span>
                 <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-sm capitalize truncate max-w-[80px] bg-white/20 backdrop-blur-sm", visuals.text)}>
                   {weather.description}
                 </span>
               </div>
            </div>
            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-md bg-white/10 shadow-sm mt-1", visuals.text)}>
              <Icon className="h-5 w-5" />
            </div>
          </div>

          {/* Footer Details (Flush bottom) */}
          <div className="flex items-center gap-3 mt-auto border-t border-white/10 pt-2">
             <div className="flex items-center gap-1.5">
                <Wind className={cn("h-3 w-3 opacity-70", visuals.text)} />
                <div className="flex items-baseline gap-1">
                   <span className={cn("text-[9px] uppercase opacity-60", visuals.text)}>Wind</span>
                   <span className={cn("text-[10px] font-bold", visuals.text)}>{Math.round(weather.windSpeed)} mph</span>
                </div>
             </div>
             <div className="h-3 w-px bg-white/20" />
             <div className="flex items-center gap-1.5">
                <Droplets className={cn("h-3 w-3 opacity-70", visuals.text)} />
                <div className="flex items-baseline gap-1">
                   <span className={cn("text-[9px] uppercase opacity-60", visuals.text)}>Hum</span>
                   <span className={cn("text-[10px] font-bold", visuals.text)}>{weather.humidity}%</span>
                </div>
             </div>
          </div>

        </div>
      ) : null}
    </CardFrame>
  );
}