import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { 
  autoAssignIncident, 
  getAvailableStaff, 
  validateAssignmentRules,
  type StaffMember 
} from '../../../lib/incidentAssignment';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting middleware
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(identifier);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Check for Supabase authentication
    const supabaseClient = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `${user.id}-${clientIP}`;
    
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { 
      incidentId, 
      staffIds, 
      assignmentType = 'manual',
      eventId,
      incidentType,
      priority,
      location,
      requiredSkills = [],
      bulkAssignments = [] // New field for bulk operations
    } = body;

    // Handle bulk assignments
    if (bulkAssignments && bulkAssignments.length > 0) {
      const results = [];
      const errors = [];
      
      for (const assignment of bulkAssignments) {
        try {
          const { incidentId: bulkIncidentId, staffIds: bulkStaffIds, assignmentType: bulkType } = assignment;
          
          if (!bulkIncidentId || !bulkStaffIds || !Array.isArray(bulkStaffIds)) {
            errors.push({ incidentId: bulkIncidentId, error: 'Invalid assignment data' });
            continue;
          }
          
          // Validate staff availability for bulk assignment
          const availableStaff = await getAvailableStaff(eventId, supabaseClient);
          const unavailableStaff = bulkStaffIds.filter(staffId => 
            !availableStaff.some(staff => 
              staff.id === staffId && 
              staff.availability_status === 'available' && 
              staff.active_assignments < 3
            )
          );
          
          if (unavailableStaff.length > 0) {
            errors.push({ 
              incidentId: bulkIncidentId, 
              error: 'Some staff are unavailable for assignment',
              unavailableStaff 
            });
            continue;
          }
          
          // Update incident with assigned staff
          const { error: updateError } = await supabaseClient
            .from('incident_logs')
            .update({
              assigned_staff_ids: bulkStaffIds,
              auto_assigned: bulkType === 'auto',
              assignment_notes: `Bulk assigned ${bulkStaffIds.length} staff member(s)`
            })
            .eq('id', bulkIncidentId);
          
          if (updateError) {
            errors.push({ incidentId: bulkIncidentId, error: updateError.message });
          } else {
            results.push({ incidentId: bulkIncidentId, success: true, assignedStaff: bulkStaffIds });
          }
        } catch (error) {
          errors.push({ 
            incidentId: assignment.incidentId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
      
      return NextResponse.json({
        success: true,
        bulkResults: results,
        errors: errors,
        message: `Processed ${results.length} assignments successfully, ${errors.length} failed`
      });
    }

    if (!incidentId || !eventId) {
      return NextResponse.json(
        { error: 'Missing required fields: incidentId, eventId' },
        { status: 400 }
      );
    }

    // Get available staff for validation
    const availableStaff = await getAvailableStaff(eventId, supabaseClient);

    // Handle auto-assignment
    if (assignmentType === 'auto') {
      if (!incidentType || !priority) {
        return NextResponse.json(
          { error: 'Auto-assignment requires incidentType and priority' },
          { status: 400 }
        );
      }

      const assignment = await autoAssignIncident(
        incidentId,
        eventId,
        incidentType,
        priority,
        location,
        requiredSkills,
        supabaseClient
      );

      if (!assignment) {
        return NextResponse.json(
          { error: 'No suitable staff found for auto-assignment' },
          { status: 404 }
        );
      }

      // Update incident with auto-assigned staff
      const { error: updateError } = await supabaseClient
        .from('incident_logs')
        .update({
          assigned_staff_ids: assignment.assignedStaff,
          auto_assigned: true,
          assignment_notes: assignment.assignmentNotes
        })
        .eq('id', incidentId);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        assignment,
        message: 'Staff auto-assigned successfully'
      });
    }

    // Handle manual assignment
    if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
      return NextResponse.json(
        { error: 'Staff IDs array is required for manual assignment' },
        { status: 400 }
      );
    }

    // Validate staff availability
    const unavailableStaff = staffIds.filter(staffId => 
      !availableStaff.some(staff => 
        staff.id === staffId && 
        staff.availability_status === 'available' && 
        staff.active_assignments < 3
      )
    );

    if (unavailableStaff.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some staff are unavailable for assignment',
          unavailableStaff 
        },
        { status: 400 }
      );
    }

    // Get incident details for validation
    const { data: incident, error: incidentError } = await supabaseClient
      .from('incident_logs')
      .select('incident_type, priority')
      .eq('id', incidentId)
      .single();

    if (incidentError || !incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    // Validate assignment rules for all staff members
    const validationErrors: string[] = [];
    
    for (const staffId of staffIds) {
      const staff = availableStaff.find(s => s.id === staffId);
      if (!staff) {
        validationErrors.push(`Staff member ${staffId} not found`);
        continue;
      }

      const validation = await validateAssignmentRules(
        staffId,
        incident.incident_type,
        staff.active_assignments,
        staff.skill_tags || [],
        supabaseClient
      );

      if (!validation.valid) {
        validationErrors.push(`Staff ${staff.full_name}: ${validation.reason}`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Assignment validation failed',
          reasons: validationErrors 
        },
        { status: 400 }
      );
    }

    // Update incident with assigned staff
    const { error: updateError } = await supabaseClient
      .from('incident_logs')
      .update({
        assigned_staff_ids: staffIds,
        auto_assigned: false,
        assignment_notes: `Manually assigned ${staffIds.length} staff member(s)`
      })
      .eq('id', incidentId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      assignedStaff: staffIds,
      message: 'Staff assigned successfully'
    });

  } catch (error) {
    console.error('Error in staff assignment:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for Supabase authentication
    const supabaseClient = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const incidentId = searchParams.get('incidentId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Get current staff assignments and availability
    const availableStaff = await getAvailableStaff(eventId, supabaseClient);

    // Get current assignments for the event
    const { data: assignments, error: assignmentsError } = await supabaseClient
      .from('incident_logs')
      .select(`
        id,
        log_number,
        incident_type,
        priority,
        status,
        assigned_staff_ids,
        auto_assigned,
        assignment_notes
      `)
      .eq('event_id', eventId)
      .in('status', ['open', 'in_progress']);

    if (assignmentsError) {
      throw assignmentsError;
    }

    // If specific incident requested, return detailed assignment info
    if (incidentId) {
      const incident = assignments?.find(a => a.id === incidentId);
      if (!incident) {
        return NextResponse.json(
          { error: 'Incident not found' },
          { status: 404 }
        );
      }

      const assignedStaff = availableStaff.filter(staff => 
        incident.assigned_staff_ids?.includes(staff.id)
      );

      return NextResponse.json({
        success: true,
        incident,
        assignedStaff,
        availableStaff
      });
    }

    // Return all assignments for the event
    const assignmentsWithStaff = assignments?.map(assignment => ({
      ...assignment,
      assignedStaff: availableStaff.filter(staff => 
        assignment.assigned_staff_ids?.includes(staff.id)
      )
    })) || [];

    return NextResponse.json({
      success: true,
      assignments: assignmentsWithStaff,
      availableStaff,
      totalAssignments: assignmentsWithStaff.length
    });

  } catch (error) {
    console.error('Error getting staff assignments:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check for Supabase authentication
    const supabaseClient = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      incidentId, 
      staffIds, 
      assignmentType = 'manual',
      notes 
    } = body;

    if (!incidentId || !staffIds || !Array.isArray(staffIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: incidentId, staffIds' },
        { status: 400 }
      );
    }

    // Get current incident details
    const { data: incident, error: incidentError } = await supabaseClient
      .from('incident_logs')
      .select('event_id, assigned_staff_ids, incident_type')
      .eq('id', incidentId)
      .single();

    if (incidentError || !incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    // Get available staff for validation
    const availableStaff = await getAvailableStaff(incident.event_id, supabaseClient);

    // Validate staff availability and skills
    const validationErrors: string[] = [];
    
    for (const staffId of staffIds) {
      const staff = availableStaff.find(s => s.id === staffId);
      if (!staff) {
        validationErrors.push(`Staff member ${staffId} not found`);
        continue;
      }

      // Check availability
      if (staff.availability_status !== 'available' || staff.active_assignments >= 3) {
        validationErrors.push(`Staff ${staff.full_name} is unavailable for assignment`);
        continue;
      }

      // Validate assignment rules with skills
      const validation = await validateAssignmentRules(
        staffId,
        incident.incident_type,
        staff.active_assignments,
        staff.skill_tags || []
      );

      if (!validation.valid) {
        validationErrors.push(`Staff ${staff.full_name}: ${validation.reason}`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Assignment validation failed',
          reasons: validationErrors 
        },
        { status: 400 }
      );
    }

    // Update incident assignment
    const { error: updateError } = await supabaseClient
      .from('incident_logs')
      .update({
        assigned_staff_ids: staffIds,
        auto_assigned: assignmentType === 'auto',
        assignment_notes: notes || `Updated assignment: ${staffIds.length} staff member(s)`
      })
      .eq('id', incidentId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      assignedStaff: staffIds,
      message: 'Staff assignment updated successfully'
    });

  } catch (error) {
    console.error('Error updating staff assignment:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check for Supabase authentication
    const supabaseClient = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get('incidentId');
    const staffId = searchParams.get('staffId');

    if (!incidentId) {
      return NextResponse.json(
        { error: 'Incident ID is required' },
        { status: 400 }
      );
    }

    // Get current incident
    const { data: incident, error: incidentError } = await supabaseClient
      .from('incident_logs')
      .select('assigned_staff_ids')
      .eq('id', incidentId)
      .single();

    if (incidentError || !incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    let newAssignedStaff = incident.assigned_staff_ids || [];

    if (staffId) {
      // Remove specific staff member
      newAssignedStaff = newAssignedStaff.filter((id: string) => id !== staffId);
    } else {
      // Remove all staff (clear assignment)
      newAssignedStaff = [];
    }

    // Update incident
    const { error: updateError } = await supabaseClient
      .from('incident_logs')
      .update({
        assigned_staff_ids: newAssignedStaff,
        assignment_notes: staffId 
          ? `Removed staff member ${staffId}`
          : 'Cleared all staff assignments'
      })
      .eq('id', incidentId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      remainingStaff: newAssignedStaff,
      message: staffId ? 'Staff member removed' : 'All staff assignments cleared'
    });

  } catch (error) {
    console.error('Error removing staff assignment:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
