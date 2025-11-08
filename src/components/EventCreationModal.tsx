// @ts-nocheck
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '@/types/supabase'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface SupportAct {
  act_name: string;
  start_time: string;
}

interface ContactInfo {
  email: string;
  phone: string;
}

interface EventFormData {
  event_name: string;
  event_type: string;
  venue_name: string;
  venue_address: string;
  event_date: string;
  security_call_time: string;
  show_stop_meeting_time: string;
  doors_open_time: string;
  main_act_start_time: string;
  show_down_time: string;
  curfew_time?: string;
  artist_name?: string;
  expected_attendance?: string;
  description?: string;
  // Personnel fields - all optional since they vary by event type
  duty_manager_name?: string;
  production_manager_name?: string;
  head_of_security_name?: string;
  assistant_head_of_security_name?: string;
  event_control_name?: string;
  safety_officer_name?: string;
  deputy_safety_officer_name?: string;
  security_manager_name?: string;
  parade_manager_name?: string;
  traffic_control_manager_name?: string;
  festival_director_name?: string;
  support_acts: SupportAct[];
  event_brief?: string;
  // Event type specific fields
  home_team?: string;
  away_team?: string;
  competition?: string;
  parade_route?: string;
  festival_theme?: string;
  [key: string]: any; // Add index signature for dynamic access
}

// English football competitions
const COMPETITIONS = [
  'Premier League',
  'Championship',
  'League One',
  'League Two',
  'FA Cup',
  'EFL Cup',
  'Community Shield',
  'Champions League',
  'Europa League',
  'Europa Conference League',
  'Women\'s Super League',
  'Women\'s Championship',
  'Women\'s FA Cup',
  'UEFA Women\'s Champions League',
  'National League',
  'National League North',
  'National League South',
  'FA Trophy',
  'FA Vase',
  'County Cup',
  'Pre-Season Friendly',
  'International Friendly',
  'Other'
];

interface Props {
  isOpen: boolean
  onClose: () => void
  onEventCreated: () => void
}

export default function EventCreationModal({ isOpen, onClose, onEventCreated }: Props) {
  const [formData, setFormData] = useState<EventFormData>({
    event_name: '',
    event_type: '',
    venue_name: '',
    venue_address: '',
    event_date: new Date().toISOString().split('T')[0],
    security_call_time: '',
    show_stop_meeting_time: '',
    doors_open_time: '',
    main_act_start_time: '',
    show_down_time: '',
    curfew_time: '',
    artist_name: '',
    expected_attendance: '',
    description: '',
    support_acts: [],
    duty_manager_name: '',
    production_manager_name: '',
    head_of_security_name: '',
    assistant_head_of_security_name: '',
    event_control_name: '',
    event_brief: '',
    home_team: '',
    away_team: '',
    competition: '',
    parade_route: '',
    festival_theme: '',
  })
  const [loading, setLoading] = useState(false)
  const [descriptionLoading, setDescriptionLoading] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const descriptionTimeoutRef = useRef<NodeJS.Timeout>()
  const addressTimeoutRef = useRef<NodeJS.Timeout>()
  const [showBrief, setShowBrief] = useState(false)

  const generateDescription = async (updatedFormData: EventFormData) => {
    // Check if we have the required fields for the specific event type
    const hasRequiredFields = () => {
      switch (updatedFormData.event_type) {
        case 'Concert':
          return updatedFormData.venue_name && updatedFormData.artist_name;
        case 'Football':
          return updatedFormData.venue_name && updatedFormData.home_team && updatedFormData.away_team;
        case 'Parade':
          return updatedFormData.venue_name && updatedFormData.parade_route;
        case 'Festival':
          return updatedFormData.venue_name && updatedFormData.festival_theme;
        default:
          return updatedFormData.venue_name;
      }
    };

    if (!hasRequiredFields()) {
      console.log('Security brief: Missing required fields', updatedFormData);
      return;
    }
    
    console.log('Security brief: Generating for', updatedFormData.event_type, updatedFormData);
    setDescriptionLoading(true);
    try {
      const requestBody = {
        eventType: updatedFormData.event_type,
        venueName: updatedFormData.venue_name,
        artistName: updatedFormData.artist_name,
        homeTeam: updatedFormData.home_team,
        awayTeam: updatedFormData.away_team,
        competition: updatedFormData.competition,
        paradeRoute: updatedFormData.parade_route,
        festivalTheme: updatedFormData.festival_theme
      };
      
      console.log('Security brief: Sending request', requestBody);
      
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Security brief: Response status', response.status);
      
      const data = await response.json();
      console.log('Security brief: Response data', data);
      
      if (data.description) {
        setFormData(prev => ({ ...prev, description: data.description }));
        console.log('Security brief: Generated successfully');
      } else {
        console.log('Security brief: No description in response');
      }
    } catch (err) {
      console.error('Security brief: Failed to generate description:', err);
    } finally {
      setDescriptionLoading(false);
    }
  };

  const generateAddress = async (venueName: string) => {
    if (!venueName) return;
    
    setAddressLoading(true);
    try {
      const response = await fetch('/api/generate-venue-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueName })
      });
      const data = await response.json();
      if (data.address) {
        setFormData(prev => ({ ...prev, venue_address: data.address }));
      }
    } catch (err) {
      console.error('Failed to generate address:', err);
    } finally {
      setAddressLoading(false);
    }
  };

  // Auto-generate event name for football events
  const generateFootballEventName = (homeTeam: string, awayTeam: string, eventDate: string) => {
    if (!homeTeam || !awayTeam || !eventDate) return '';
    
    // Handle DD/MM/YYYY format
    if (eventDate.includes('/')) {
      return `${homeTeam} v ${awayTeam} - ${eventDate}`;
    }
    
    // Fallback for other formats
    const date = new Date(eventDate);
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    return `${homeTeam} v ${awayTeam} - ${formattedDate}`;
  };

  // Format date for display as DD/MM/YYYY
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log('🔄 Input changed:', name, '=', value);
    const updatedFormData = { ...formData, [name]: value };

    // Auto-fill artist_name with event_name if event_name is being changed (for concerts)
    if (name === 'event_name' && formData.event_type === 'concert') {
      updatedFormData.artist_name = value;
    }

    // Auto-generate event name for football events
    if (formData.event_type === 'football') {
      if (name === 'home_team' || name === 'away_team' || name === 'event_date') {
        const homeTeam = name === 'home_team' ? value : formData.home_team || '';
        const awayTeam = name === 'away_team' ? value : formData.away_team || '';
        const eventDate = name === 'event_date' ? value : formData.event_date || '';
        
        updatedFormData.event_name = generateFootballEventName(homeTeam, awayTeam, eventDate);
      }
    }

    setFormData(updatedFormData);

    // If we're updating fields that affect security brief generation, debounce the description generation
    const fieldsThatTriggerBrief = ['venue_name', 'artist_name', 'home_team', 'away_team', 'competition', 'parade_route', 'festival_theme'];
    if (fieldsThatTriggerBrief.includes(name)) {
      if (descriptionTimeoutRef.current) {
        clearTimeout(descriptionTimeoutRef.current);
      }
      
      descriptionTimeoutRef.current = setTimeout(() => {
        generateDescription(updatedFormData);
      }, 3000);

      // If venue name is updated, also generate address
      if (name === 'venue_name') {
        if (addressTimeoutRef.current) {
          clearTimeout(addressTimeoutRef.current);
        }
        
        addressTimeoutRef.current = setTimeout(() => {
          generateAddress(value);
        }, 3000);
      }
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Remove any non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // Format the time string
    let formattedTime = '';
    if (numericValue.length >= 2) {
      // Insert colon after the first two digits
      formattedTime = numericValue.slice(0, 2) + ':' + numericValue.slice(2, 4);
    } else {
      formattedTime = numericValue;
    }

    // Validate the time if we have a complete time string
    if (formattedTime.includes(':') && formattedTime.length === 5) {
      const [hours, minutes] = formattedTime.split(':');
      const hoursNum = parseInt(hours, 10);
      const minutesNum = parseInt(minutes, 10);
      
      if (hoursNum >= 0 && hoursNum < 24 && minutesNum >= 0 && minutesNum < 60) {
        setFormData(prev => ({ ...prev, [name]: formattedTime }));
      }
    } else {
      // Update the form with the partial input
      setFormData(prev => ({ ...prev, [name]: formattedTime }));
    }
  };

  const formatDateToUK = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTimeToDisplay = (time: string) => {
    if (!time) return '';
    // Ensure time is in 24-hour format
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (descriptionTimeoutRef.current) {
        clearTimeout(descriptionTimeoutRef.current);
      }
      if (addressTimeoutRef.current) {
        clearTimeout(addressTimeoutRef.current);
      }
    };
  }, []);

  // Dispatch event modal state changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('eventModalChange', { detail: { isOpen } }))
  }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      console.log('🚀 Form submitted with event_type:', formData.event_type);
      console.log('📋 Full form data:', formData);
      setLoading(true)
      setError(null)

    try {
      // Check if user is authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) throw authError
      
      if (!session) {
        throw new Error('You must be authenticated to create an event')
      }

      // Fetch company_id from profiles table
      const { data: profile, error: profileError } = await supabase
        .from<Database['public']['Tables']['profiles']['Row'], Database['public']['Tables']['profiles']['Update']>('profiles')
        .select('company_id')
        .eq('id', session.user.id)
        .single();
      if (profileError) throw profileError;
      if (!profile || !profile.company_id) {
        setError('Could not determine your company. Please check your profile.');
        setLoading(false);
        return;
      }
      const company_id = profile.company_id;

      // Validate required fields based on event type
      let requiredFields = [
        'event_name',
        'event_type',
        'venue_name',
        'venue_address',
        'event_date',
        'security_call_time'
      ];

      // Add event-type-specific required fields
      switch (formData.event_type) {
        case 'Concert':
          requiredFields.push('show_stop_meeting_time', 'doors_open_time', 'main_act_start_time', 'show_down_time');
          break;
        case 'Football':
          requiredFields.push('doors_open_time', 'main_act_start_time', 'show_down_time');
          break;
        case 'Parade':
          requiredFields.push('doors_open_time', 'main_act_start_time', 'show_down_time');
          break;
        case 'Festival':
          requiredFields.push('doors_open_time', 'main_act_start_time', 'show_down_time');
          break;
        default:
          requiredFields.push('doors_open_time', 'main_act_start_time', 'show_down_time');
      }

      const missingFields = requiredFields.filter(field => !formData[field])
      console.log('🔍 Required fields check:', { requiredFields, missingFields, formData });
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`)
        setLoading(false)
        return
      }
      console.log('✅ All required fields validated');

      console.log('🔄 Starting database operations...');
      // First, set all events' is_current to false for this company only
      const { error: updateError } = await supabase
        .from<Database['public']['Tables']['events']['Row'], Database['public']['Tables']['events']['Update']>('events')
        .update({ is_current: false })
        .eq('company_id', company_id)
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (updateError) throw updateError
      console.log('✅ Updated existing events is_current to false');

      // Format the event data
      console.log('🔍 Event type being sent to database:', formData.event_type);
      const eventData = {
        event_name: formData.event_name,
        event_type: formData.event_type,
        artist_name: formData.artist_name,
        venue_name: formData.venue_name,
        venue_address: formData.venue_address,
        start_datetime: formData.event_date + ' ' + (formData.main_act_start_time || ''),
        end_datetime: formData.event_date + ' ' + (formData.show_down_time || ''),
        description: formData.description,
        expected_attendance: formData.expected_attendance,
        security_call_times: formData.security_call_times || null,
        venue_opening_time: formData.venue_opening_time || null,
        doors_open_time: formData.doors_open_time || null,
        main_act_times: formData.main_act_times || null,
        support_act_times: formData.support_act_times || null,
        event_end_time: formData.event_end_time || null,
        curfew_time: formData.curfew_time || null,
        event_manager_name: formData.event_manager_name || null,
        is_current: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: formData.created_by || null,
        assistant_head_of_security: formData.assistant_head_of_security_name || null,
        duty_manager: formData.duty_manager_name || null,
        event_control: formData.event_control_name || null,
        event_date: formData.event_date,
        head_of_security: formData.head_of_security_name || null,
        main_act_start_time: formData.main_act_start_time || null,
        production_manager: formData.production_manager_name || null,
        security_call_time: formData.security_call_time || null,
        show_down_time: formData.show_down_time || null,
        show_stop_meeting_time: formData.show_stop_meeting_time || null,
        support_acts: formData.support_acts ? JSON.stringify(formData.support_acts) : null,
        event_description: formData.event_description || formData.description || null,
        venue_capacity: formData.venue_capacity || null,
        company_id,
        event_brief: formData.event_brief || null,
        // Football-specific fields
        home_team: formData.home_team || null,
        away_team: formData.away_team || null,
        competition: formData.competition || null,
        // Other event-type-specific fields
        parade_route: formData.parade_route || null,
        festival_theme: formData.festival_theme || null,
      }

      console.log('🔄 Inserting new event into database...');
      const { error: insertError, data: insertedEvent } = await supabase
        .from<Database['public']['Tables']['events']['Row'], Database['public']['Tables']['events']['Update']>('events')
        .insert([eventData as any])
        .select()

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw insertError;
      }
      console.log('✅ Event created successfully:', insertedEvent);

      // Insert support acts if any
      if (formData.support_acts.length > 0 && insertedEvent?.[0]?.id) {
        const supportActsData = formData.support_acts.map(act => ({
          event_id: insertedEvent[0].id,
          act_name: act.act_name,
          start_time: act.start_time
        }))

        const { error: supportActsError } = await supabase
          .from<any, any>('support_acts')
          .insert(supportActsData)

        if (supportActsError) throw supportActsError
      }

      // Call onEventCreated first to refresh data
      await onEventCreated()
      // Then close the modal
      onClose()
    } catch (err) {
      console.error('Error saving event:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while saving the event')
    } finally {
      setLoading(false)
    }
  }

  const renderTimeInput = (name: string, label: string, required: boolean = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        name={name}
        value={formData[name]}
        onChange={handleTimeChange}
        placeholder="HH:mm"
        maxLength={5}
        inputMode="numeric"
        pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        required={required}
      />
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="card-modal space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Event Type Selection</h3>
              <div>
                <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Event Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="event_type"
                  id="event_type"
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.event_type}
                  onChange={handleInputChange}
                >
                  <option value="">Select an event type</option>
                  <option value="concert">Concert / Gig</option>
                  <option value="football">Football Match</option>
                  <option value="festival">Festival</option>
                  <option value="parade">Parade / Procession</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="card-modal space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Event Details</h3>
              
              {/* Event Name */}
              <div>
                <label htmlFor="event_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Event Name <span className="text-red-500">*</span>
                </label>
                {formData.event_type === 'football' ? (
                  <div className="mt-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                    <span className="text-sm font-medium">Auto-generated: </span>
                    <span className="text-sm">{formData.event_name || 'Will be generated when teams and date are entered'}</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    name="event_name"
                    id="event_name"
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.event_name}
                    onChange={handleInputChange}
                  />
                )}
              </div>

              {/* Event Type Specific Fields */}
              {formData.event_type === 'concert' && (
                <div>
                  <label htmlFor="artist_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Artist/Headliner Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="artist_name"
                    id="artist_name"
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.artist_name}
                    onChange={handleInputChange}
                  />
                </div>
              )}

              {formData.event_type === 'football' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="home_team" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Home Team <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="home_team"
                        id="home_team"
                        required
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={formData.home_team || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="away_team" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Away Team <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="away_team"
                        id="away_team"
                        required
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={formData.away_team || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  {/* Competition Field */}
                  <div>
                    <label htmlFor="competition" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Competition <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="competition"
                      id="competition"
                      required
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={formData.competition || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Competition</option>
                      {COMPETITIONS.map((competition) => (
                        <option key={competition} value={competition}>
                          {competition}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {formData.event_type === 'parade' && (
                <div>
                  <label htmlFor="parade_route" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Parade Route <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="parade_route"
                    id="parade_route"
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.parade_route || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Main Street to City Hall"
                  />
                </div>
              )}

              {formData.event_type === 'festival' && (
                <div>
                  <label htmlFor="festival_theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Festival Theme/Genre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="festival_theme"
                    id="festival_theme"
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.festival_theme || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Music Festival, Food Festival, Cultural Festival"
                  />
                </div>
              )}

              {/* Event Date - Show early for football events */}
              {formData.event_type === 'football' && (
                <div>
                  <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Match Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="event_date"
                    id="event_date"
                    value={formData.event_date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="DD/MM/YYYY"
                    required
                    pattern="\d{2}/\d{2}/\d{4}"
                    title="Please enter date in DD/MM/YYYY format"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enter date in DD/MM/YYYY format (e.g., 26/10/2025)</p>
                </div>
              )}

              {/* Venue Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="venue_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Venue Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="venue_name"
                    id="venue_name"
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.venue_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="expected_attendance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Expected Attendance
                  </label>
                  <input
                    type="text"
                    name="expected_attendance"
                    id="expected_attendance"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.expected_attendance}
                    onChange={handleInputChange}
                    placeholder="e.g., 10,000"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="venue_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Venue Address <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    name="venue_address"
                    id="venue_address"
                    required
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.venue_address}
                    onChange={handleInputChange}
                    placeholder={addressLoading ? "Generating address..." : "Address will be auto-filled when venue name is entered"}
                  />
                  {addressLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50 rounded-lg">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Address will be automatically generated based on venue name</p>
              </div>
              {/* Security Brief */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Security Brief</label>
                  <button
                    type="button"
                    className="md:hidden text-xs text-blue-600 underline focus:outline-none"
                    onClick={() => setShowBrief((prev) => !prev)}
                  >
                    {showBrief ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className={`${showBrief ? '' : 'hidden'} md:block mt-1 relative`}>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    rows={6}
                    placeholder={descriptionLoading ? "Generating security brief..." : `Security brief will be automatically generated when venue and ${formData.event_type === 'concert' ? 'artist' : formData.event_type === 'football' ? 'team' : 'event'} details are filled`}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={descriptionLoading}
                  />
                  {descriptionLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50 rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Brief is automatically generated based on historical data and risk assessment</p>
                </div>
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="card-modal space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Event Brief</h3>
              <div>
                <label htmlFor="event_brief" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Event Brief (from client)
                </label>
                <textarea
                  name="event_brief"
                  id="event_brief"
                  value={formData.event_brief || ''}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="Paste or type the event brief provided by the client here."
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This field is for the client&apos;s event brief and can contain large pasted text.</p>
              </div>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="card-modal space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Event Schedule</h3>
              
              {/* Event Date - Only show for non-football events */}
              {formData.event_type !== 'Other' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Event Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="event_date"
                      value={formData.event_date}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      style={{ colorScheme: 'light' }}
                    />
                  </div>
                </div>
              )}

              {/* Event Type Specific Timing Fields */}
              {formData.event_type === 'concert' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderTimeInput('security_call_time', 'Security Call Time (24h)', true)}
                    {renderTimeInput('show_stop_meeting_time', 'Show Stop Meeting Time (24h)', true)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderTimeInput('doors_open_time', 'Doors Opening Time (24h)', true)}
                    {renderTimeInput('main_act_start_time', `${formData.artist_name || 'Main Act'} Start Time (24h)`, true)}
                  </div>
                </>
              )}

              {formData.event_type === 'football' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderTimeInput('security_call_time', 'Stewarding Call Time (24h)', true)}
                    {renderTimeInput('doors_open_time', 'Turnstiles Opening Time (24h)', true)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderTimeInput('main_act_start_time', 'Kick-off Time (24h)', true)}
                    {renderTimeInput('show_down_time', 'Match End Time (24h)', true)}
                  </div>
                </>
              )}

              {formData.event_type === 'parade' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderTimeInput('security_call_time', 'Security Call Time (24h)', true)}
                    {renderTimeInput('doors_open_time', 'Parade Start Time (24h)', true)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderTimeInput('main_act_start_time', 'Parade End Time (24h)', true)}
                    {renderTimeInput('show_down_time', 'Clean-up Complete Time (24h)', true)}
                  </div>
                </>
              )}

              {formData.event_type === 'festival' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderTimeInput('security_call_time', 'Security Call Time (24h)', true)}
                    {renderTimeInput('doors_open_time', 'Gates Opening Time (24h)', true)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderTimeInput('main_act_start_time', 'Festival Start Time (24h)', true)}
                    {renderTimeInput('show_down_time', 'Festival End Time (24h)', true)}
                  </div>
                </>
              )}

              {/* Support Acts - Only for Concerts */}
              {formData.event_type === 'concert' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Support Acts</h3>
                  {formData.support_acts.map((act, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        value={act.act_name}
                        onChange={(e) => {
                          const newActs = [...formData.support_acts];
                          newActs[index].act_name = e.target.value;
                          setFormData(prev => ({ ...prev, support_acts: newActs }));
                        }}
                        placeholder="Act Name"
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={act.start_time}
                        onChange={(e) => {
                          const newActs = [...formData.support_acts];
                          // Use the same time validation/formatting as other time fields
                          const numericValue = e.target.value.replace(/\D/g, '');
                          let formattedTime = '';
                          if (numericValue.length >= 2) {
                            formattedTime = numericValue.slice(0, 2) + ':' + numericValue.slice(2, 4);
                          } else {
                            formattedTime = numericValue;
                          }
                          if (formattedTime.includes(':') && formattedTime.length === 5) {
                            const [hours, minutes] = formattedTime.split(':');
                            const hoursNum = parseInt(hours, 10);
                            const minutesNum = parseInt(minutes, 10);
                            if (hoursNum >= 0 && hoursNum < 24 && minutesNum >= 0 && minutesNum < 60) {
                              newActs[index].start_time = formattedTime;
                            } else {
                              newActs[index].start_time = formattedTime;
                            }
                          } else {
                            newActs[index].start_time = formattedTime;
                          }
                          setFormData(prev => ({ ...prev, support_acts: newActs }));
                        }}
                        placeholder="HH:mm"
                        maxLength={5}
                        inputMode="numeric"
                        pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        support_acts: [...prev.support_acts, { act_name: '', start_time: '' }]
                      }));
                    }}
                    className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    + Add Support Act
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      case 5:
        return (
          <div className="card-modal space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Key Personnel</h3>
              {(() => {
                // Define personnel based on event type
                let personnel = [];
                
                switch (formData.event_type) {
                  case 'Football':
                    personnel = [
                      {
                        title: 'Safety Officer',
                        field: 'safety_officer_name'
                      },
                      {
                        title: 'Deputy Safety Officer',
                        field: 'deputy_safety_officer_name'
                      },
                      {
                        title: 'Security Manager',
                        field: 'security_manager_name'
                      }
                    ];
                    break;
                  case 'Concert':
                    personnel = [
                      {
                        title: 'Production Manager',
                        field: 'production_manager_name'
                      },
                      {
                        title: 'Head of Security',
                        field: 'head_of_security_name'
                      },
                      {
                        title: 'Assistant Head of Security',
                        field: 'assistant_head_of_security_name'
                      },
                      {
                        title: 'Event Control',
                        field: 'event_control_name'
                      }
                    ];
                    break;
                  case 'Parade':
                    personnel = [
                      {
                        title: 'Parade Manager',
                        field: 'parade_manager_name'
                      },
                      {
                        title: 'Head of Security',
                        field: 'head_of_security_name'
                      },
                      {
                        title: 'Traffic Control Manager',
                        field: 'traffic_control_manager_name'
                      },
                      {
                        title: 'Event Control',
                        field: 'event_control_name'
                      }
                    ];
                    break;
                  case 'Festival':
                    personnel = [
                      {
                        title: 'Festival Director',
                        field: 'festival_director_name'
                      },
                      {
                        title: 'Head of Security',
                        field: 'head_of_security_name'
                      },
                      {
                        title: 'Assistant Head of Security',
                        field: 'assistant_head_of_security_name'
                      },
                      {
                        title: 'Event Control',
                        field: 'event_control_name'
                      }
                    ];
                    break;
                  default:
                    personnel = [
                      {
                        title: 'Duty Manager',
                        field: 'duty_manager_name'
                      },
                      {
                        title: 'Head of Security',
                        field: 'head_of_security_name'
                      },
                      {
                        title: 'Event Control',
                        field: 'event_control_name'
                      }
                    ];
                }
                
                return personnel.map((manager) => (
                  <div key={manager.field}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{manager.title} *</label>
                    <input
                      type="text"
                      name={manager.field}
                      value={formData[manager.field] || ''}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                ));
              })()}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    isOpen ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
        <div className="card-modal w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Event</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none transition-colors"
              type="button"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {error && (
              <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400 dark:text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
                  </div>
                </div>
              </div>
          )}

          <div className="space-y-6">
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 5) * 100}%` }}
                />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {renderStep()}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setStep(prev => prev - 1)}
                    disabled={step === 1}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      step === 1
                        ? 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                        : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Previous
                  </button>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    {step < 5 ? (
                      <button
                        type="button"
                        onClick={() => setStep(prev => prev + 1)}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#2A3990] dark:bg-[#3B4BA8] rounded-lg hover:bg-[#1e2a6a] dark:hover:bg-[#2A3990] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A3990] transition-colors"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#2A3990] dark:bg-[#3B4BA8] rounded-lg hover:bg-[#1e2a6a] dark:hover:bg-[#2A3990] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A3990] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Creating...' : 'Create Event'}
                      </button>
                    )}
                  </div>
                </div>
              </form>
          </div>
        </div>
      </div>
    ) : null
  )
} 
