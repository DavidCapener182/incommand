import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { getServiceSupabaseClient } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

// Extend the generated type so we can attach any future columns
// that may be present in the radio_messages table without breaking
// the type checker if migrations have been applied in the database
// but the generated client types are lagging behind.
type RadioMessage = Database['public']['Tables']['radio_messages']['Row'] &
  Record<string, any>;

type RadioMessageInsert =
  Database['public']['Tables']['radio_messages']['Insert'] & Record<string, any>;

type IncidentProcessingResult = {
  incidentCreated: boolean;
  incidentId?: string | number;
};

type TaskProcessingResult = {
  taskCreated: boolean;
  taskId?: string;
};

function normalizeEventId(eventId: string | number | undefined): string | undefined {
  if (typeof eventId === 'string') return eventId;
  if (typeof eventId === 'number' && Number.isFinite(eventId)) {
    return String(eventId);
  }
  return undefined;
}

function extractPriority(message: RadioMessageInsert): string {
  if (typeof message.priority === 'string' && message.priority.trim().length > 0) {
    return message.priority;
  }
  const text = (message.message as string | undefined)?.toLowerCase() ?? '';
  if (/critical|urgent|life[-\s]?threatening/.test(text)) return 'critical';
  if (/immediate|priority|high/.test(text)) return 'high';
  if (/routine|update/.test(text)) return 'low';
  return 'medium';
}

async function processRadioMessage(
  message: RadioMessage,
  eventId: string,
  userId: string
): Promise<IncidentProcessingResult> {
  try {
    const serviceSupabase = getServiceSupabaseClient();

    const incidentInsert: Database['public']['Tables']['incidents']['Insert'] = {
      event_id: eventId,
      title: message.message?.slice(0, 120) || 'Radio message incident',
      description: message.message || '',
      priority: extractPriority(message),
      status: 'open',
      created_by: userId,
      callsign_from: (message as Record<string, any>).from_callsign ?? null,
      callsign_to: (message as Record<string, any>).to_callsign ?? null,
      occurrence: (message as Record<string, any>).transmitted_at ?? null
    };

    const { data: incident, error: incidentError } = await serviceSupabase
      .from('incidents')
      .insert(incidentInsert)
      .select('id')
      .single();

    if (incidentError || !incident) {
      if (incidentError?.code === '42P01') {
        // Table missing – feature not available yet. Log and continue gracefully.
        logger.warn('Incidents table unavailable when processing radio message', {
          component: 'RadioMessagesAPI',
          action: 'processRadioMessage',
          messageId: message.id,
          eventId
        });
        return { incidentCreated: false };
      }
      throw incidentError ?? new Error('Failed to create incident');
    }

    try {
      await serviceSupabase
        .from('radio_messages')
        .update({ incident_id: incident.id } as Record<string, any>)
        .eq('id', message.id);
    } catch (linkError) {
      logger.warn('Failed to link radio message to created incident', {
        component: 'RadioMessagesAPI',
        action: 'linkIncident',
        messageId: message.id,
        incidentId: incident.id,
        error: linkError instanceof Error
          ? { message: linkError.message, stack: linkError.stack }
          : linkError
      });
    }

    return { incidentCreated: true, incidentId: incident.id };
  } catch (error) {
    logger.error('Error processing radio message for incident creation', error, {
      component: 'RadioMessagesAPI',
      action: 'processRadioMessage',
      messageId: message.id,
      eventId
    });
    throw error;
  }
}

async function processRadioMessageForTask(
  _message: RadioMessage,
  _eventId: string,
  _userId: string
): Promise<TaskProcessingResult> {
  // Task automation is optional and depends on additional schema that may not be
  // present in every deployment. Rather than failing the request when the feature
  // is unavailable we simply acknowledge that no task was created. When a
  // dedicated task workflow is introduced this function can be extended to create
  // and link the new task, mirroring the incident behaviour above.
  return { taskCreated: false };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { channel, from_callsign, message } = body as Record<string, any>;

    if (!channel || !from_callsign || !message) {
      return NextResponse.json(
        { error: 'channel, from_callsign and message are required' },
        { status: 400 }
      );
    }

    const messageData: RadioMessageInsert = {
      channel,
      from_callsign,
      message,
      priority: body.priority ?? 'routine',
      transmitted_at: body.transmitted_at ?? new Date().toISOString()
    } as RadioMessageInsert;

    messageData.created_by = user.id;

    const normalizedEventId = normalizeEventId(body.event_id);
    if (normalizedEventId) {
      messageData.event_id = normalizedEventId;
    }

    if (body.metadata !== undefined) {
      messageData.metadata = body.metadata;
    }

    if (body.attachments !== undefined) {
      messageData.attachments = body.attachments;
    }

    if (body.status) {
      messageData.status = body.status;
    }

    const { data: insertedMessage, error } = await supabase
      .from('radio_messages')
      .insert(messageData)
      .select()
      .single();

    if (error || !insertedMessage) {
      logger.error('Failed to create radio message', error, {
        component: 'RadioMessagesAPI',
        action: 'createMessage',
        userId: user.id
      });
      return NextResponse.json(
        { error: error?.message || 'Failed to create radio message' },
        { status: 500 }
      );
    }

    const autoCreateIncident = body.auto_create_incident !== false;
    const autoCreateTask = body.auto_create_task !== false;

    let incidentCreated = false;
    let incidentId: string | number | undefined;
    let taskCreated = false;
    let taskId: string | undefined;

    let messageRecord: RadioMessage | null = insertedMessage as RadioMessage;

    const eventId = normalizeEventId(messageData.event_id);

    if (messageRecord && eventId) {
      if (autoCreateIncident) {
        try {
          const processed = await processRadioMessage(messageRecord, eventId, user.id);
          if (processed.incidentCreated && processed.incidentId) {
            incidentCreated = true;
            incidentId = processed.incidentId;
          }
        } catch (processError) {
          logger.error('Error processing radio message for auto-incident creation', processError, {
            component: 'RadioMessagesAPI',
            action: 'autoIncident',
            messageId: messageRecord.id,
            eventId
          });
        }
      }

      if (autoCreateTask && !incidentCreated) {
        try {
          const taskProcessed = await processRadioMessageForTask(
            messageRecord,
            eventId,
            user.id
          );

          if (taskProcessed.taskCreated && taskProcessed.taskId) {
            taskCreated = true;
            taskId = taskProcessed.taskId;

            const { data: updatedMessage } = await supabase
              .from('radio_messages')
              .select()
              .eq('id', messageRecord.id)
              .single();

            if (updatedMessage) {
              messageRecord = updatedMessage as RadioMessage;
            }
          }
        } catch (taskError) {
          logger.error('Error processing radio message for auto-task creation', taskError, {
            component: 'RadioMessagesAPI',
            action: 'autoTask',
            messageId: messageRecord.id,
            eventId
          });
        }
      }

      if (incidentCreated && incidentId) {
        const { data: updatedMessage } = await supabase
          .from('radio_messages')
          .select()
          .eq('id', messageRecord.id)
          .single();

        if (updatedMessage) {
          messageRecord = updatedMessage as RadioMessage;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: messageRecord,
      incidentCreated,
      incidentId: incidentId ?? null,
      taskCreated,
      taskId: taskId ?? null
    });
  } catch (error) {
    logger.error('Unexpected error handling radio message request', error, {
      component: 'RadioMessagesAPI',
      action: 'POST'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
