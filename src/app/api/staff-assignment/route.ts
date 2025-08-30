import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rateLimit';
import { validateRequest, schemas } from '@/lib/validation';
import { sanitize } from '@/lib/sanitize';
import { withAuth } from '@/lib/authMiddleware';
import { logger } from '@/lib/logger';
import { supabase } from '../../../lib/supabase';
import { 
  autoAssignIncident, 
  getAvailableStaff, 
  validateAssignmentRules,
  type StaffMember 
} from '../../../lib/incidentAssignment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleStaffAssignmentPOST(request: NextRequest, user: any) {
  try {
    const body = await request.json();
    
    // Validate and sanitize input
    const validation = validateRequest(schemas.staff.staffAssignment, body, 'staff-assignment-post');
    if (!validation.success) {
      logger.warn('Staff assignment validation failed', { 
        context: 'staff-assignment-post',
        errors: validation.errors 
      });
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.errors },
        { status: 400 }
      );
    }

    const { 
      incidentId, 
      staffIds, 
      assignmentType = 'manual',
      eventId,
      incidentType,
      priority,
      location,
      requiredSkills = [],
      bulkAssignments = []
    } = validation.data;

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
          const availableStaff = await getAvailableStaff(eventId);
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
          const { error: updateError } = await supabase
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
    const availableStaff = await getAvailableStaff(eventId);

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
        requiredSkills
      );

      if (!assignment) {
        return NextResponse.json(
          { error: 'No suitable staff found for auto-assignment' },
          { status: 404 }
        );
      }

      // Update incident with auto-assigned staff
      const { error: updateError } = await supabase
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
    const { data: incident, error: incidentError } = await supabase
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

    // Update incident with assigned staff
    const { error: updateError } = await supabase
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
    logger.error('Error in staff assignment', error, { 
      context: 'staff-assignment-post',
      userId: user.id 
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleStaffAssignmentGET(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const incidentId = searchParams.get('incidentId');

    // Validate query parameters
    const queryValidation = validateRequest(schemas.common.queryParams, { eventId, incidentId }, 'staff-assignment-get');
    if (!queryValidation.success) {
      logger.warn('Staff assignment query validation failed', { 
        context: 'staff-assignment-get',
        errors: queryValidation.errors 
      });
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryValidation.errors },
        { status: 400 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Get current staff assignments and availability
    const availableStaff = await getAvailableStaff(eventId);

    // Get current assignments for the event
    const { data: assignments, error: assignmentsError } = await supabase
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
    logger.error('Error getting staff assignments', error, { 
      context: 'staff-assignment-get',
      userId: user.id 
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleStaffAssignmentPUT(request: NextRequest, user: any) {
  try {
    const body = await request.json();
    
    // Validate and sanitize input
    const validation = validateRequest(schemas.staff.staffAssignmentUpdate, body, 'staff-assignment-put');
    if (!validation.success) {
      logger.warn('Staff assignment update validation failed', { 
        context: 'staff-assignment-put',
        errors: validation.errors 
      });
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.errors },
        { status: 400 }
      );
    }

    const { 
      incidentId, 
      staffIds, 
      assignmentType = 'manual',
      notes 
    } = validation.data;

    if (!incidentId || !staffIds || !Array.isArray(staffIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: incidentId, staffIds' },
        { status: 400 }
      );
    }

    // Get current incident details
    const { data: incident, error: incidentError } = await supabase
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
    const availableStaff = await getAvailableStaff(incident.event_id);

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
    const { error: updateError } = await supabase
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
    logger.error('Error updating staff assignment', error, { 
      context: 'staff-assignment-put',
      userId: user.id 
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleStaffAssignmentDELETE(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get('incidentId');
    const staffId = searchParams.get('staffId');

    // Validate query parameters
    const queryValidation = validateRequest(schemas.common.deleteParams, { incidentId, staffId }, 'staff-assignment-delete');
    if (!queryValidation.success) {
      logger.warn('Staff assignment delete validation failed', { 
        context: 'staff-assignment-delete',
        errors: queryValidation.errors 
      });
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryValidation.errors },
        { status: 400 }
      );
    }

    if (!incidentId) {
      return NextResponse.json(
        { error: 'Incident ID is required' },
        { status: 400 }
      );
    }

    // Get current incident
    const { data: incident, error: incidentError } = await supabase
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
    const { error: updateError } = await supabase
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
    logger.error('Error removing staff assignment', error, { 
      context: 'staff-assignment-delete',
      userId: user.id 
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(
  withAuth(handleStaffAssignmentPOST, { requireRole: ['user', 'admin', 'superadmin'] }),
  'general'
);

export const GET = withRateLimit(
  withAuth(handleStaffAssignmentGET, { requireRole: ['user', 'admin', 'superadmin'] }),
  'general'
);

export const PUT = withRateLimit(
  withAuth(handleStaffAssignmentPUT, { requireRole: ['user', 'admin', 'superadmin'] }),
  'general'
);

export const DELETE = withRateLimit(
  withAuth(handleStaffAssignmentDELETE, { requireRole: ['user', 'admin', 'superadmin'] }),
  'general'
);
