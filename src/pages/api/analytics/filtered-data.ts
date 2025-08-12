import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      eventId,
      from,
      to,
      compareEventId,
      compareFrom,
      compareTo,
      includeComparison = 'false'
    } = req.query;

    // Validate required parameters
    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    // Validate date parameters
    const validateDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    };

    if (from && !validateDate(from as string)) {
      return res.status(400).json({ error: 'Invalid from date format' });
    }

    if (to && !validateDate(to as string)) {
      return res.status(400).json({ error: 'Invalid to date format' });
    }

    if (compareFrom && !validateDate(compareFrom as string)) {
      return res.status(400).json({ error: 'Invalid compareFrom date format' });
    }

    if (compareTo && !validateDate(compareTo as string)) {
      return res.status(400).json({ error: 'Invalid compareTo date format' });
    }

    // Build date range filters
    const buildDateFilter = (fromDate?: string, toDate?: string) => {
      let filter = supabase
        .from('incident_logs')
        .select('*');

      if (fromDate) {
        filter = filter.gte('timestamp', fromDate);
      }

      if (toDate) {
        filter = filter.lte('timestamp', toDate);
      }

      return filter;
    };

    // Fetch current period data
    const currentData = await fetchAnalyticsData(
      eventId as string,
      from as string,
      to as string
    );

    let comparisonData = null;

    // Fetch comparison data if requested
    if (includeComparison === 'true') {
      if (compareEventId) {
        // Compare with specific event
        comparisonData = await fetchAnalyticsData(
          compareEventId as string,
          compareFrom as string,
          compareTo as string
        );
      } else if (compareFrom && compareTo) {
        // Compare with custom date range for same event
        comparisonData = await fetchAnalyticsData(
          eventId as string,
          compareFrom as string,
          compareTo as string
        );
      } else {
        // Auto-detect previous event for comparison
        const previousEvent = await findPreviousEvent(eventId as string);
        if (previousEvent) {
          comparisonData = await fetchAnalyticsData(
            previousEvent.id,
            undefined,
            undefined
          );
        }
      }
    }

    // Calculate comparison metrics
    const comparisonMetrics = comparisonData ? calculateComparisonMetrics(currentData, comparisonData) : null;

    // Prepare response
    const response = {
      current: currentData,
      comparison: comparisonData,
      metrics: comparisonMetrics,
      metadata: {
        eventId: eventId as string,
        dateRange: {
          from: from || null,
          to: to || null
        },
        comparisonRange: {
          from: compareFrom || null,
          to: compareTo || null,
          eventId: compareEventId || null
        },
        includeComparison: includeComparison === 'true',
        timestamp: new Date().toISOString()
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Filtered data API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function fetchAnalyticsData(eventId: string, fromDate?: string, toDate?: string) {
  // Fetch incidents
  let incidentsQuery = supabase
    .from('incident_logs')
    .select('*')
    .eq('event_id', eventId);

  if (fromDate) {
    incidentsQuery = incidentsQuery.gte('timestamp', fromDate);
  }
  if (toDate) {
    incidentsQuery = incidentsQuery.lte('timestamp', toDate);
  }

  const { data: incidents, error: incidentsError } = await incidentsQuery;

  if (incidentsError) {
    throw new Error(`Failed to fetch incidents: ${incidentsError.message}`);
  }

  // Fetch attendance data
  let attendanceQuery = supabase
    .from('attendance_logs')
    .select('*')
    .eq('event_id', eventId);

  if (fromDate) {
    attendanceQuery = attendanceQuery.gte('timestamp', fromDate);
  }
  if (toDate) {
    attendanceQuery = attendanceQuery.lte('timestamp', toDate);
  }

  const { data: attendance, error: attendanceError } = await attendanceQuery;

  if (attendanceError) {
    throw new Error(`Failed to fetch attendance: ${attendanceError.message}`);
  }

  // Fetch performance metrics
  let performanceQuery = supabase
    .from('performance_metrics')
    .select('*')
    .eq('event_id', eventId);

  if (fromDate) {
    performanceQuery = performanceQuery.gte('timestamp', fromDate);
  }
  if (toDate) {
    performanceQuery = performanceQuery.lte('timestamp', toDate);
  }

  const { data: performance, error: performanceError } = await performanceQuery;

  if (performanceError) {
    throw new Error(`Failed to fetch performance: ${performanceError.message}`);
  }

  // Calculate KPIs
  const kpis = calculateKPIs(incidents, attendance, performance);

  return {
    incidents,
    attendance,
    performance,
    kpis
  };
}

function calculateKPIs(incidents: any[], attendance: any[], performance: any[]) {
  const totalIncidents = incidents.length;
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length;
  const avgResponseTime = incidents.length > 0 
    ? incidents.reduce((sum, i) => sum + (i.response_time || 0), 0) / incidents.length 
    : 0;
  
  const peakAttendance = attendance.length > 0 
    ? Math.max(...attendance.map(a => a.count || 0))
    : 0;
  
  const avgStaffEfficiency = performance.length > 0
    ? performance.reduce((sum, p) => sum + (p.efficiency_score || 0), 0) / performance.length
    : 0;

  return {
    totalIncidents,
    resolvedIncidents,
    resolutionRate: totalIncidents > 0 ? (resolvedIncidents / totalIncidents) * 100 : 0,
    avgResponseTime,
    peakAttendance,
    avgStaffEfficiency,
    dataPoints: {
      incidents: incidents.length,
      attendance: attendance.length,
      performance: performance.length
    }
  };
}

function calculateComparisonMetrics(current: any, comparison: any) {
  const calculateChange = (current: number, comparison: number) => {
    const change = current - comparison;
    const changePercent = comparison > 0 ? (change / comparison) * 100 : 0;
    return {
      current,
      comparison,
      change,
      changePercent,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  };

  return {
    incidents: calculateChange(current.kpis.totalIncidents, comparison.kpis.totalIncidents),
    attendance: calculateChange(current.kpis.peakAttendance, comparison.kpis.peakAttendance),
    responseTime: calculateChange(current.kpis.avgResponseTime, comparison.kpis.avgResponseTime),
    staffEfficiency: calculateChange(current.kpis.avgStaffEfficiency, comparison.kpis.avgStaffEfficiency),
    resolutionRate: calculateChange(current.kpis.resolutionRate, comparison.kpis.resolutionRate)
  };
}

async function findPreviousEvent(currentEventId: string) {
  // Get current event details
  const { data: currentEvent, error: currentError } = await supabase
    .from('events')
    .select('*')
    .eq('id', currentEventId)
    .single();

  if (currentError || !currentEvent) {
    return null;
  }

  // Find previous event by the same organizer
  const { data: previousEvents, error: previousError } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', currentEvent.organizer_id)
    .lt('start_date', currentEvent.start_date)
    .order('start_date', { ascending: false })
    .limit(1);

  if (previousError || !previousEvents || previousEvents.length === 0) {
    return null;
  }

  return previousEvents[0];
}
