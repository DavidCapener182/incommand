'use client'

import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
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
  duty_manager_name: string;
  production_manager_name: string;
  head_of_security_name: string;
  assistant_head_of_security_name: string;
  event_control_name: string;
  support_acts: SupportAct[];
  [key: string]: any; // Add index signature for dynamic access
}

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
    event_control_name: ''
  })
  const [loading, setLoading] = useState(false)
  const [descriptionLoading, setDescriptionLoading] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const descriptionTimeoutRef = useRef<NodeJS.Timeout>()
  const addressTimeoutRef = useRef<NodeJS.Timeout>()

  const generateDescription = async (updatedFormData: EventFormData) => {
    if (!updatedFormData.venue_name || !updatedFormData.artist_name) return;
    
    setDescriptionLoading(true);
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueName: updatedFormData.venue_name,
          artistName: updatedFormData.artist_name
        })
      });
      const data = await response.json();
      if (data.description) {
        setFormData(prev => ({ ...prev, description: data.description }));
      }
    } catch (err) {
      console.error('Failed to generate description:', err);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };

    // Auto-fill artist_name with event_name if event_name is being changed
    if (name === 'event_name') {
      updatedFormData.artist_name = value;
    }

    setFormData(updatedFormData);

    // If we're updating venue_name or artist_name, debounce the description generation
    if (name === 'venue_name' || name === 'artist_name') {
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

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Allow empty input
    if (!value) {
      setFormData(prev => ({ ...prev, [name]: '' }));
      return;
    }

    // Allow partial input while typing
    if (value.length <= 5) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Only format if we have a potentially valid time
    if (value.includes(':') && value.length === 5) {
      const [hours, minutes] = value.split(':');
      // Validate hours and minutes
      const hoursNum = parseInt(hours, 10);
      const minutesNum = parseInt(minutes, 10);
      
      if (hoursNum >= 0 && hoursNum < 24 && minutesNum >= 0 && minutesNum < 60) {
        const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        setFormData(prev => ({ ...prev, [name]: formattedTime }));
      }
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Check if user is authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) throw authError
      
      if (!session) {
        throw new Error('You must be authenticated to create an event')
      }

      // Validate required fields
      const requiredFields = [
        'event_name',
        'event_type',
        'venue_name',
        'venue_address',
        'event_date',
        'security_call_time',
        'show_stop_meeting_time',
        'doors_open_time',
        'main_act_start_time',
        'show_down_time'
      ]

      const missingFields = requiredFields.filter(field => !formData[field])
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`)
        setLoading(false)
        return
      }

      // First, set all events' is_current to false
      const { error: updateError } = await supabase
        .from('events')
        .update({ is_current: false })
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (updateError) throw updateError

      // Format the event data
      const eventData = {
        event_name: formData.event_name,
        event_type: formData.event_type,
        venue_name: formData.venue_name,
        venue_address: formData.venue_address,
        event_date: formData.event_date,
        security_call_time: formData.security_call_time,
        show_stop_meeting_time: formData.show_stop_meeting_time,
        doors_open_time: formData.doors_open_time,
        main_act_start_time: formData.main_act_start_time,
        show_down_time: formData.show_down_time,
        curfew_time: formData.curfew_time || null,
        artist_name: formData.artist_name,
        expected_attendance: formData.expected_attendance,
        description: formData.description,
        is_current: true,
        duty_manager: formData.duty_manager_name,
        production_manager: formData.production_manager_name,
        head_of_security: formData.head_of_security_name,
        assistant_head_of_security: formData.assistant_head_of_security_name,
        event_control: formData.event_control_name,
        start_datetime: formData.event_date + ' ' + formData.main_act_start_time,
        end_datetime: formData.event_date + ' ' + formData.show_down_time
      }

      const { error: insertError, data: insertedEvent } = await supabase
        .from('events')
        .insert([eventData])
        .select()

      if (insertError) throw insertError

      // Insert support acts if any
      if (formData.support_acts.length > 0 && insertedEvent?.[0]?.id) {
        const supportActsData = formData.support_acts.map(act => ({
          event_id: insertedEvent[0].id,
          act_name: act.act_name,
          start_time: act.start_time
        }))

        const { error: supportActsError } = await supabase
          .from('support_acts')
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="event_type" className="block text-sm font-medium text-gray-700">
                Event Type <span className="text-red-500">*</span>
              </label>
              <select
                name="event_type"
                id="event_type"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.event_type}
                onChange={handleInputChange}
              >
                <option value="">Select an event type</option>
                <option value="Concert">Concert</option>
                <option value="Parade">Parade</option>
                <option value="Festival">Festival</option>
                <option value="Corporate">Corporate</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="event_name" className="block text-sm font-medium text-gray-700">
                Event Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="event_name"
                id="event_name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.event_name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="venue_name" className="block text-sm font-medium text-gray-700">
                Venue Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="venue_name"
                id="venue_name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.venue_name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="artist_name" className="block text-sm font-medium text-gray-700">
                Artist/Band Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="artist_name"
                id="artist_name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.artist_name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Security Brief</label>
              <div className="mt-1 relative">
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder={descriptionLoading ? "Generating security brief..." : "Security brief will be automatically generated when venue and artist names are filled"}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={descriptionLoading}
                />
                {descriptionLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-50 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                )}
                <p className="mt-1 text-sm text-gray-500">Brief is automatically generated based on historical data and risk assessment</p>
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="venue_address" className="block text-sm font-medium text-gray-700">
                Venue Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="venue_address"
                id="venue_address"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.venue_address}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="expected_attendance" className="block text-sm font-medium text-gray-700">
                Expected Attendance <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="expected_attendance"
                id="expected_attendance"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.expected_attendance || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="event_date" className="block text-sm font-medium text-gray-700">
                Event Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="event_date"
                id="event_date"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.event_date}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  const day = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const year = date.getFullYear();
                  const formattedDate = `${year}-${month}-${day}`;
                  setFormData(prev => ({ ...prev, event_date: formattedDate }));
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="security_call_time" className="block text-sm font-medium text-gray-700">
                  Security Call Time (24h) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="security_call_time"
                  id="security_call_time"
                  required
                  pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                  placeholder="HH:mm (e.g., 17:30)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.security_call_time}
                  onChange={handleTimeChange}
                  inputMode="numeric"
                  aria-label="Enter time in 24-hour format (HH:mm)"
                  maxLength={5}
                />
              </div>
              <div>
                <label htmlFor="show_stop_meeting_time" className="block text-sm font-medium text-gray-700">
                  Show Stop Meeting Time (24h) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="show_stop_meeting_time"
                  id="show_stop_meeting_time"
                  required
                  pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                  placeholder="HH:mm (e.g., 18:00)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.show_stop_meeting_time}
                  onChange={handleTimeChange}
                  inputMode="numeric"
                  aria-label="Enter time in 24-hour format (HH:mm)"
                  maxLength={5}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="doors_open_time" className="block text-sm font-medium text-gray-700">
                  Doors Opening Time (24h) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="doors_open_time"
                  id="doors_open_time"
                  required
                  pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                  placeholder="HH:mm (e.g., 19:00)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.doors_open_time}
                  onChange={handleTimeChange}
                  inputMode="numeric"
                  aria-label="Enter time in 24-hour format (HH:mm)"
                  maxLength={5}
                />
              </div>
              <div>
                <label htmlFor="main_act_start_time" className="block text-sm font-medium text-gray-700">
                  {formData.artist_name} Start Time (24h) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="main_act_start_time"
                  id="main_act_start_time"
                  required
                  pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                  placeholder="HH:mm (e.g., 20:30)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.main_act_start_time}
                  onChange={handleTimeChange}
                  inputMode="numeric"
                  aria-label="Enter time in 24-hour format (HH:mm)"
                  maxLength={5}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Support Acts</label>
              <div className="space-y-2">
                {formData.support_acts.map((act, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={act.act_name}
                      onChange={(e) => {
                        const newActs = [...formData.support_acts];
                        newActs[index].act_name = e.target.value;
                        setFormData(prev => ({ ...prev, support_acts: newActs }));
                      }}
                      placeholder="Act Name"
                      className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={act.start_time}
                      pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                      placeholder="HH:mm"
                      onChange={(e) => {
                        const newActs = [...formData.support_acts];
                        newActs[index].start_time = e.target.value;
                        setFormData(prev => ({ ...prev, support_acts: newActs }));
                      }}
                      className="w-32 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newActs = formData.support_acts.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, support_acts: newActs }));
                      }}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
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
                  className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  + Add Support Act
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="show_down_time" className="block text-sm font-medium text-gray-700">
                  Show Down Time (24h) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="show_down_time"
                  id="show_down_time"
                  required
                  pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                  placeholder="HH:mm (e.g., 23:00)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.show_down_time}
                  onChange={handleTimeChange}
                  inputMode="numeric"
                  aria-label="Enter time in 24-hour format (HH:mm)"
                  maxLength={5}
                />
              </div>
              <div>
                <label htmlFor="curfew_time" className="block text-sm font-medium text-gray-700">
                  Curfew Time (24h)
                </label>
                <input
                  type="text"
                  name="curfew_time"
                  id="curfew_time"
                  pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                  placeholder="HH:mm (e.g., 23:30)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.curfew_time || ''}
                  onChange={handleTimeChange}
                  inputMode="numeric"
                  aria-label="Enter time in 24-hour format (HH:mm)"
                  maxLength={5}
                />
              </div>
            </div>
          </div>
        )
      case 5:
        return (
          <div className="space-y-6">
            {[
              {
                title: 'Duty Manager',
                field: 'duty_manager_name'
              },
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
            ].map((manager) => (
              <div key={manager.field}>
                <label className="block text-sm font-medium text-gray-700">{manager.title} *</label>
                <input
                  type="text"
                  name={manager.field}
                  value={formData[manager.field]}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        )
    }
  }

  return (
    isOpen ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Create New Event</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                type="button"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-4 rounded-md bg-red-50 border border-red-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 5) * 100}%` }}
                />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {renderStep()}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setStep(prev => prev - 1)}
                    disabled={step === 1}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      step === 1
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    {step < 5 ? (
                      <button
                        type="button"
                        onClick={() => setStep(prev => prev + 1)}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#2A3990] rounded-md hover:bg-[#1e2a6a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A3990]"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#2A3990] rounded-md hover:bg-[#1e2a6a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A3990] disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    ) : null
  )
} 