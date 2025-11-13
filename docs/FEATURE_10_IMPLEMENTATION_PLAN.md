# Feature 10: Intelligent Radio Traffic Analysis - Implementation Plan

## Overview

The Intelligent Radio Traffic Analysis system provides real-time transcription, analysis, and intelligence extraction from radio communications. It automatically detects incidents, creates tasks, and monitors channel health to support operational decision-making.

## Prerequisites

- [x] Feature 3: Decision Logging (completed)
- [x] Feature 1: Operational Readiness Index (completed)
- [x] Feature 2: Live Doctrine Assistant (completed)
- [ ] Radio system integration (external API or existing `radio_messages` table)
- [ ] Speech-to-text service (external API integration)

## Implementation Phases

### Phase 1: Database Schema & Core Infrastructure (Week 1)

#### Step 1.1: Database Schema
- [ ] Create `radio_messages` table for storing transcribed radio traffic
- [ ] Create `radio_channel_health` table for channel metrics
- [ ] Create indexes for performance
- [ ] Set up RLS policies for company isolation
- [ ] Create triggers for automatic updates

**Migration File:** `database/radio_analysis_migration.sql`

**Table Structures:**
- `radio_messages`: Stores individual radio messages with transcription, categorization, and priority
- `radio_channel_health`: Tracks channel-level metrics (traffic volume, response times, overload indicators)

#### Step 1.2: TypeScript Types
- [ ] Create `src/types/radio.ts` with types for radio messages and channel health
- [ ] Update Supabase types (or create fallback types)

### Phase 2: Radio Transcription Service (Week 1-2)

#### Step 2.1: Transcription API Integration
- [ ] Create `src/lib/radio/transcription.ts` service
- [ ] Integrate with speech-to-text API (e.g., OpenAI Whisper, Google Speech-to-Text, or Azure)
- [ ] Handle audio stream processing
- [ ] Implement error handling and retry logic

#### Step 2.2: Radio Message Ingestion API
- [ ] Create `src/app/api/radio/messages/route.ts` for receiving radio messages
- [ ] Create `src/app/api/radio/transcribe/route.ts` for transcription requests
- [ ] Implement message validation and storage

### Phase 3: Traffic Analysis Engine (Week 2)

#### Step 3.1: Analysis Engine
- [ ] Create `src/lib/ai/radioAnalysis.ts` for traffic analysis
- [ ] Implement pattern detection (overload indicators, emergency keywords)
- [ ] Create categorization logic (incident, routine, emergency, etc.)
- [ ] Implement priority scoring

#### Step 3.2: Auto-Incident Creation
- [ ] Create service to detect incident keywords in radio traffic
- [ ] Integrate with incident creation API (`src/app/api/incidents/route.ts`)
- [ ] Link radio messages to created incidents
- [ ] Implement deduplication logic

### Phase 4: Channel Health Monitoring (Week 2-3)

#### Step 4.1: Health Metrics Calculation
- [ ] Create `src/lib/radio/channelHealth.ts` service
- [ ] Calculate traffic volume metrics
- [ ] Calculate response time metrics
- [ ] Detect overload patterns
- [ ] Generate health scores

#### Step 4.2: Health API Endpoints
- [ ] Create `src/app/api/radio/channels/route.ts` for channel listing
- [ ] Create `src/app/api/radio/channels/[id]/health/route.ts` for health metrics
- [ ] Implement real-time updates via Supabase channels

### Phase 5: UI Components (Week 3)

#### Step 5.1: Radio Traffic Analyzer Component
- [ ] Create `src/components/monitoring/RadioTrafficAnalyzer.tsx`
- [ ] Display real-time radio messages
- [ ] Show message categorization and priority
- [ ] Implement filtering and search
- [ ] Add message detail view

#### Step 5.2: Channel Health Dashboard
- [ ] Create `src/components/monitoring/ChannelHealthCard.tsx`
- [ ] Display channel health metrics
- [ ] Show overload alerts
- [ ] Visualize traffic volume trends

#### Step 5.3: Radio Analysis Page
- [ ] Create `src/app/monitoring/radio-analysis/page.tsx`
- [ ] Integrate RadioTrafficAnalyzer component
- [ ] Add channel health overview
- [ ] Implement real-time updates

### Phase 6: Dashboard Integration (Week 3-4)

#### Step 6.1: Radio Alerts Widget
- [ ] Create `src/components/monitoring/RadioAlertsWidget.tsx`
- [ ] Display critical radio alerts on Dashboard
- [ ] Show overload indicators
- [ ] Link to radio analysis page

#### Step 6.2: Dashboard Integration
- [ ] Add RadioAlertsWidget to `src/components/Dashboard.tsx`
- [ ] Integrate with existing alert system
- [ ] Ensure proper event filtering

### Phase 7: Auto-Task Creation (Week 4)

#### Step 7.1: Task Creation Service
- [ ] Create `src/lib/radio/taskCreator.ts` service
- [ ] Detect task-related keywords in radio messages
- [ ] Integrate with task creation API
- [ ] Link tasks to radio messages

#### Step 7.2: Task Integration
- [ ] Update task creation to include radio message references
- [ ] Add radio message context to task details

## Technical Specifications

### Database Schema

#### `radio_messages` Table
```sql
CREATE TABLE radio_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  event_id UUID REFERENCES events(id),
  channel VARCHAR(50) NOT NULL,
  from_callsign VARCHAR(50),
  to_callsign VARCHAR(50),
  message TEXT NOT NULL,
  transcription TEXT,
  audio_url TEXT,
  category VARCHAR(50), -- 'incident', 'routine', 'emergency', 'coordination', 'other'
  priority VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  incident_id UUID REFERENCES incident_logs(id),
  task_id UUID REFERENCES tasks(id),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `radio_channel_health` Table
```sql
CREATE TABLE radio_channel_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  event_id UUID REFERENCES events(id),
  channel VARCHAR(50) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_count INTEGER NOT NULL DEFAULT 0,
  avg_response_time_seconds DECIMAL(10,2),
  overload_indicator BOOLEAN DEFAULT FALSE,
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### API Endpoints

#### POST `/api/radio/messages`
Create a new radio message (with optional transcription)

#### POST `/api/radio/transcribe`
Transcribe audio and create radio message

#### GET `/api/radio/messages`
List radio messages with filtering

#### GET `/api/radio/channels`
List all radio channels for an event

#### GET `/api/radio/channels/[id]/health`
Get health metrics for a specific channel

### Key Features

1. **Real-time Transcription**: Convert radio audio to text using speech-to-text API
2. **Intelligent Categorization**: Automatically categorize messages (incident, routine, emergency)
3. **Priority Detection**: Identify high-priority messages based on keywords and context
4. **Auto-Incident Creation**: Automatically create incidents from radio traffic
5. **Channel Health Monitoring**: Track channel overload and health metrics
6. **Task Creation**: Generate tasks from radio messages
7. **Dashboard Integration**: Show critical radio alerts on main dashboard

## Integration Points

- **Incident System**: Auto-create incidents from radio messages
- **Task System**: Generate tasks from radio traffic
- **Dashboard**: Display radio alerts and channel health
- **Notification System**: Alert on overload patterns
- **Decision Logging**: Link radio messages to decisions

## Dependencies

- External speech-to-text API (OpenAI Whisper, Google Speech-to-Text, or Azure)
- Radio system integration (external API or existing infrastructure)
- Supabase real-time subscriptions for live updates

## Testing Strategy

- Unit tests for transcription service
- Unit tests for analysis engine
- Integration tests for auto-incident creation
- Integration tests for channel health calculation
- E2E tests for radio analysis page

## Success Criteria

- [ ] Radio messages are successfully transcribed and stored
- [ ] Messages are automatically categorized and prioritized
- [ ] Incidents are auto-created from radio traffic
- [ ] Channel health metrics are calculated and displayed
- [ ] Radio alerts appear on dashboard
- [ ] Tasks can be created from radio messages
- [ ] Real-time updates work correctly

