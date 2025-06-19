import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserIcon, ClockIcon, MapIcon } from '@heroicons/react/24/outline';

interface TrafficReport {
  id: string;
  event_id: string;
  report_text: string;
  created_by: string | null;
  created_at: string;
  author_email?: string;
}

interface Props {
  eventId: string;
  isAdmin?: boolean;
  venueAddress: string;
  showMap?: boolean;
}

export default function TrafficReportCard({ eventId, isAdmin, venueAddress, showMap = false }: Props) {
  const [report, setReport] = useState<TrafficReport | null>(null);
  const [history, setHistory] = useState<TrafficReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newReport, setNewReport] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const fetchLatestReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('traffic_reports')
        .select('*, profiles:created_by(email)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setReport({
          ...data,
          author_email: data.profiles?.email || undefined,
        });
      } else {
        setReport(null);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load traffic report');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('traffic_reports')
        .select('*, profiles:created_by(email)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setHistory(
        (data || []).map((r: any) => ({ ...r, author_email: r.profiles?.email || undefined }))
      );
    } catch (err) {
      setHistory([]);
    }
  };

  useEffect(() => {
    if (eventId) fetchLatestReport();
  }, [eventId]);

  useEffect(() => {
    if (!venueAddress) return;
    setGeoLoading(true);
    setGeoError(null);
    setCoords(null);
    fetch(`/api/geocode?address=${encodeURIComponent(venueAddress)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
          setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
        } else {
          setGeoError('Could not geocode address');
        }
      })
      .catch(() => setGeoError('Could not geocode address'))
      .finally(() => setGeoLoading(false));
  }, [venueAddress]);

  const trafficUrl = coords
    ? `https://www.google.com/maps/@${coords.lat},${coords.lon},15z/data=!5m1!1e1`
    : venueAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueAddress)}`
      : '#';

  const staticMapUrl = coords
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lon}&zoom=15&size=600x70&markers=${coords.lat},${coords.lon},red-pushpin`
    : null;

  return (
    <div className="h-full bg-gradient-to-br from-yellow-50 via-yellow-100 to-white p-4 transition-all duration-500 rounded-lg shadow">
      {/* Only show the static map and the View Live Traffic Map button */}
      <div className="mb-2 w-full">
        {geoLoading ? (
          <div className="h-[70px] flex items-center justify-center text-gray-400 bg-gray-100 rounded">Loading map…</div>
        ) : geoError ? (
          <div className="h-[70px] flex items-center justify-center text-gray-400 bg-gray-100 rounded">No map available</div>
        ) : coords && staticMapUrl ? (
          <img
            src={staticMapUrl}
            alt="Venue Location Map"
            style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '0.5rem' }}
          />
        ) : (
          <div className="h-[70px] flex items-center justify-center text-gray-400 bg-gray-100 rounded">No map available</div>
        )}
      </div>
      <div className="flex items-center justify-center">
        <a
          href={trafficUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm font-medium"
        >
          View Live Traffic Map
        </a>
      </div>
    </div>
  );
} 