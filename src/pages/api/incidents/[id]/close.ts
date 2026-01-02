import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabaseServer';

const INCIDENT_FIELDS =
  'id,event_id,is_closed,status,resolution_notes,resolved_at,escalation_level,updated_at,closed_by,priority,incident_type,occurrence';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const incidentId = params.id;
    const supabase = getServiceClient() as any;
    
    if (!incidentId) {
      return NextResponse.json(
        { error: 'Incident ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { resolution_notes, closed_by, resolution_time } = body;

    // Validate that the incident exists and is not already closed
    const { data: incident, error: fetchError } = await supabase
      .from('incident_logs')
      .select(INCIDENT_FIELDS)
      .eq('id', parseInt(incidentId))
      .single();

    if (fetchError || !incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    if (incident.is_closed) {
      return NextResponse.json(
        { error: 'Incident is already closed' },
        { status: 400 }
      );
    }

    // Update the incident_logs table
    const updateData: any = {
      is_closed: true,
      status: 'closed',
      resolved_at: resolution_time || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (resolution_notes) {
      updateData.resolution_notes = resolution_notes;
    }

    if (closed_by) {
      updateData.closed_by = closed_by;
    }

    const { data: updatedIncident, error: updateError } = await supabase
      .from('incident_logs')
      .update(updateData)
      .eq('id', parseInt(incidentId))
      .select(INCIDENT_FIELDS)
      .single();

    if (updateError) {
      console.error('Error updating incident:', updateError);
      return NextResponse.json(
        { error: 'Failed to close incident' },
        { status: 500 }
      );
    }

    // Log the closure action for audit purposes
    await supabase
      .from('audit_logs')
      .insert({
        action: 'incident_closed',
        action_type: 'update',
        table_name: 'incident_logs',
        record_id: incidentId,
        performed_by: closed_by || 'system',
        details: {
          resolution_notes,
          resolution_time: updateData.resolved_at
        },
        created_at: new Date().toISOString()
      });

    // Clear any pending escalation timers for this incident
    // Clear any pending escalation timers for this incident
    await supabase
      .from('escalation_timers')
      .delete()
      .eq('incident_id', parseInt(incidentId));

    // Notify relevant supervisors of the closure (if escalation system is active)
    if (incident.escalation_level) {
      // This would integrate with your notification system
      console.log(`Incident ${incidentId} closed - notifying supervisors`);
    }

    return NextResponse.json({
      success: true,
      message: 'Incident closed successfully',
      data: updatedIncident
    });

  } catch (error) {
    console.error('Error in close incident endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const incidentId = params.id;
    const supabase = getServiceClient() as any;
    
    if (!incidentId) {
      return NextResponse.json(
        { error: 'Incident ID is required' },
        { status: 400 }
      );
    }

    // Get incident details
    const { data: incident, error } = await supabase
      .from('incident_logs')
      .select(INCIDENT_FIELDS)
      .eq('id', parseInt(incidentId))
      .single();

    if (error || !incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: incident
    });

  } catch (error) {
    console.error('Error in get incident endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
