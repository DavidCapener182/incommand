# Feature Placement Strategy
## Mapping 15 Advanced Capabilities to InCommand Lifecycle Stages

---

## 1. Context Review: InCommand Lifecycle Pillars

Based on the current InCommand architecture and operational workflows, the platform operates across five primary lifecycle stages:

### **Planning Stage**
- Event creation and configuration (`EventCreationModal`, `src/app/settings/events/`)
- Staff assignment and competency planning (`callsign-assignment`, `staffing-centre`)
- Resource allocation (medical, security, infrastructure)
- SOP template generation and doctrine alignment
- Compliance pre-checks against licensing conditions
- Venue configuration and zone mapping

**Current Modules:**
- Event Management (`src/app/settings/events/`)
- Staff Management (`src/app/staff/`, `src/app/staffing-centre/`)
- Callsign Assignment (`src/app/callsign-assignment/`)
- Settings & Configuration (`src/app/settings/`)

### **Live Operations Stage**
- Real-time incident logging and tracking (`src/components/IncidentTable.tsx`, `src/app/incidents/`)
- Dashboard monitoring (`src/components/Dashboard.tsx`, `src/app/dashboard/`)
- Staff dispatch and task assignment (`src/components/StaffCommandCentre.tsx`)
- Real-time analytics and KPIs (`src/app/analytics/`)
- Communication hub (radio, messaging, notifications)
- Weather monitoring and environmental alerts
- Crowd density tracking and occupancy monitoring

**Current Modules:**
- Dashboard (`src/app/dashboard/`)
- Incident Management (`src/app/incidents/`)
- Command Centre (`src/app/callsign-assignment/`, `src/app/display/`)
- Analytics (`src/app/analytics/`)
- Messages (`src/app/messages/`)
- Monitoring (`src/app/monitoring/`)

### **Intelligence Stage**
- AI-powered insights and predictions (`src/lib/ai/`, `src/app/api/ai-insights/`)
- Pattern analysis (`src/app/api/v1/events/[id]/patterns/`)
- Predictive analytics (`src/app/api/analytics/predictive-insights/`)
- Crowd behavior analysis
- Risk assessment and early warning systems
- Social media sentiment monitoring (`src/app/api/social-media/`)

**Current Modules:**
- AI Services (`src/lib/ai/`)
- Analytics APIs (`src/app/api/analytics/`)
- Pattern Analysis (`src/app/api/v1/events/[id]/patterns/`)
- Social Media (`src/app/api/social-media/`)

### **Post-Event Stage**
- Event debrief generation (`src/lib/ai/eventSummaryGenerator.ts`)
- Performance benchmarking (`src/app/api/v1/events/[id]/benchmarking/`)
- Lessons learned extraction (`src/lib/ai/eventSummaryGenerator.ts`)
- Compliance reporting (`src/app/api/compliance/exports/`)
- Analytics and trend analysis (`src/app/reports/`)
- Staff performance evaluation

**Current Modules:**
- Reports (`src/app/reports/`)
- Event Summaries (`src/lib/ai/eventSummaryGenerator.ts`)
- Benchmarking (`src/app/api/v1/events/[id]/benchmarking/`)
- Compliance (`src/app/api/compliance/`)

### **Governance Stage**
- Audit logging (`src/app/admin/audit-logs/`)
- Access control and role management (`src/lib/auth/roles.ts`)
- Data protection and privacy controls
- Training and simulation capabilities
- Continuous improvement and learning engine
- Stakeholder transparency and reporting

**Current Modules:**
- Admin (`src/app/admin/`)
- Audit Logs (`src/app/admin/audit-logs/`)
- Security (`src/lib/auth/`, `src/lib/middleware/auth.ts`)
- Settings (`src/app/settings/`)

---

## 2. Feature Mapping Matrix

### **Feature 1: Real-Time Operational Readiness Index**

**Primary Home:** Live Operations Stage → Dashboard Module

**Location:** `src/components/Dashboard.tsx` (new card component), `src/app/dashboard/page.tsx`

**Secondary Touchpoints:**
- Planning Stage: Pre-event readiness checks (`src/app/settings/events/`)
- Intelligence Stage: Predictive readiness forecasting (`src/app/api/analytics/`)
- Post-Event Stage: Readiness trend analysis in debriefs (`src/app/reports/`)

**Key Integrations:**
- Staffing data (`staff` table, `staff_assignments`)
- Incident data (`incident_logs`)
- Weather API (`src/app/api/weather/`)
- Transport feeds (external API integration)
- Asset status (new `assets` table or integration)
- Crowd density (`crowd_density` field in incidents, or dedicated `crowd_density_readings` table)

**Data Sources:**
- `staff` table → staff on post vs planned
- `incident_logs` → incident pressure metrics
- `events` table → planned vs actual parameters
- Weather service → external factors
- Transport APIs → ingress/egress status
- Asset management → infrastructure status

**Implementation Notes:**
- Create new `operational_readiness` table to store historical readiness scores
- Add `ReadinessIndexCard` component to Dashboard
- Create API endpoint `/api/analytics/readiness-index` for calculation
- Integrate with existing KPI grid system

---

### **Feature 2: Live Doctrine Assistant & Dynamic SOP Adjustment Engine**

**Primary Home:** Planning Stage (setup) + Live Operations Stage (monitoring)

**Location:** 
- Planning: `src/app/settings/sops/` (new module)
- Live Ops: `src/components/DoctrineAssistant.tsx` (new component), integrated into Dashboard

**Secondary Touchpoints:**
- Governance Stage: SOP template library and compliance checking
- Post-Event Stage: SOP effectiveness analysis in debriefs

**Key Integrations:**
- Knowledge Base (`src/app/admin/content/knowledge-base/`, `src/lib/knowledge/`)
- Green Guide integration (`src/app/api/green-guide-search/`)
- Incident patterns → SOP trigger conditions
- Weather monitoring → SOP adjustments
- Staff competency → SOP assignment

**Data Sources:**
- `knowledge_base` table (Purple Guide, JESIP content)
- `sops` table (new table for SOP templates and live SOPs)
- `incident_logs` → pattern detection
- Weather API → condition triggers
- `staff_skills` → competency matching

**Implementation Notes:**
- Create `sops` table with fields: `id`, `company_id`, `event_id`, `sop_type`, `template_id`, `conditions`, `actions`, `status`, `created_at`, `updated_at`
- Create `sop_adjustments` table for logging changes
- Build SOP template library from Purple Guide content
- Create `DoctrineAssistant` component with real-time monitoring
- Add "Accept/Modify/Reject" workflow for SOP adjustments

---

### **Feature 3: Golden Thread Decision Logging & Inquiry Pack**

**Primary Home:** Governance Stage → Audit & Compliance Module

**Location:** `src/app/admin/decisions/` (new module), `src/components/DecisionLogger.tsx`

**Secondary Touchpoints:**
- Live Operations Stage: Decision logging widget in Dashboard
- Post-Event Stage: Inquiry pack generation in Reports

**Key Integrations:**
- Audit logging system (`src/app/admin/audit-logs/`)
- Incident system → link decisions to incidents
- Dashboard screenshots → evidence capture
- Radio transcripts → decision context
- Staff assignments → decision owners

**Data Sources:**
- `decisions` table (new): `id`, `event_id`, `company_id`, `trigger_issue`, `options_considered`, `information_available`, `decision_taken`, `rationale`, `decision_owner`, `role_level`, `timestamp`, `location`, `follow_up_review_time`, `linked_incidents`, `evidence_refs`, `locked_at`
- `decision_evidence` table: links to screenshots, transcripts, emails
- `audit_logs` → decision audit trail

**Implementation Notes:**
- Create `decisions` and `decision_evidence` tables
- Build `DecisionLogger` modal component
- Add decision logging button to Dashboard and Incident details
- Create inquiry pack generator (`src/lib/reporting/inquiryPack.ts`)
- Implement record locking mechanism (tamper-evident)

---

### **Feature 4: Predictive Crowd Flow & "Next 60 Minutes" Risk View**

**Primary Home:** Intelligence Stage → Predictive Analytics Module

**Location:** `src/app/analytics/crowd-flow/` (new page), `src/components/analytics/CrowdFlowPredictor.tsx`

**Secondary Touchpoints:**
- Live Operations Stage: Dashboard widget showing next-hour predictions
- Planning Stage: Pre-event flow modeling

**Key Integrations:**
- Ticket scanning data (external API or `ticket_scans` table)
- Access control systems (`access_control_logs` table)
- CCTV analytics (external integration)
- Transport feeds → ingress/egress patterns
- Show schedule (`events` table, `support_acts` table)
- Weather → impact on flow
- Bar/toilet queue data (new `facility_queues` table or integration)

**Data Sources:**
- `ticket_scans` table (new or external)
- `access_control_logs` table (new or external)
- `crowd_density_readings` table (new: time-series density by zone)
- `events` table → show schedule
- `support_acts` table → performance times
- Transport APIs → arrival/departure patterns
- Weather API → impact modeling

**Implementation Notes:**
- Create `crowd_density_readings` table for time-series data
- Build predictive model service (`src/lib/analytics/crowdFlowPredictor.ts`)
- Create heatmap visualization component
- Add "What if?" scenario testing UI
- Integrate with existing predictive analytics infrastructure

---

### **Feature 5: Simulation & "What If?" Scenario Engine**

**Primary Home:** Governance Stage (Training) + Planning Stage (Pre-event) + Live Operations Stage (Quick testing)

**Location:** 
- Training: `src/app/training/simulations/` (new module)
- Planning: `src/app/settings/events/[id]/scenarios/` (new)
- Live Ops: Quick scenario tester in Dashboard

**Secondary Touchpoints:**
- Post-Event Stage: Replay historic events for training
- Intelligence Stage: Use predictive models for scenario outcomes

**Key Integrations:**
- Event data → scenario inputs
- Incident patterns → inject incidents
- Predictive analytics → model outcomes
- Decision logging → capture training decisions
- Staff assignments → scenario staffing

**Data Sources:**
- `simulations` table (new): `id`, `company_id`, `event_id`, `simulation_type`, `scenario_data`, `injected_events`, `participant_decisions`, `created_at`
- `simulation_runs` table: stores execution results
- Historic `events` and `incident_logs` → replay data
- `decisions` table → training decision capture

**Implementation Notes:**
- Create `simulations` and `simulation_runs` tables
- Build simulation engine (`src/lib/simulation/scenarioEngine.ts`)
- Create training mode UI (`src/app/training/simulations/`)
- Add scenario builder for planning stage
- Integrate with crowd flow predictor for outcome modeling
- Store exercise outcomes in `lessons_learned` table

---

### **Feature 6: AI Crowd Behaviour & Welfare Sentiment Intelligence**

**Primary Home:** Intelligence Stage → Crowd Intelligence Module

**Location:** `src/app/analytics/crowd-intelligence/` (new page), `src/components/analytics/CrowdBehaviorMonitor.tsx`

**Secondary Touchpoints:**
- Live Operations Stage: Dashboard alerts for welfare concerns
- Post-Event Stage: Sentiment analysis in debriefs

**Key Integrations:**
- CCTV analytics (external API integration)
- Acoustic analysis (external service)
- Social media monitoring (`src/app/api/social-media/`)
- Event app feedback (new `event_app_feedback` table or API)
- Incident system → correlate with incidents

**Data Sources:**
- `crowd_behavior_readings` table (new): `id`, `event_id`, `zone_id`, `timestamp`, `behavior_type`, `severity`, `source`, `metadata`
- `welfare_sentiment` table (new): `id`, `event_id`, `zone_id`, `timestamp`, `sentiment_score`, `keywords`, `source`, `concern_level`
- Social media API → sentiment keywords
- CCTV analytics API → behavior patterns
- Event app → user feedback

**Implementation Notes:**
- Create `crowd_behavior_readings` and `welfare_sentiment` tables
- Build sentiment analysis service (`src/lib/ai/sentimentAnalysis.ts`)
- Create behavior detection service (integrates with CCTV analytics)
- Build `CrowdComfortIndex` component
- Add zone-based alerts to Dashboard
- Integrate with existing social media monitoring

---

### **Feature 7: Safeguarding, Vulnerable Persons & Lost/Found Workflow**

**Primary Home:** Live Operations Stage → Incident Management Module (specialized workflow)

**Location:** `src/app/safeguarding/` (new module), `src/components/safeguarding/SafeguardingIncidentForm.tsx`

**Secondary Touchpoints:**
- Planning Stage: Safeguarding plan templates
- Post-Event Stage: Safeguarding statistics in reports
- Governance Stage: Safeguarding compliance tracking

**Key Integrations:**
- Incident system → specialized incident type
- Staff assignments → search team assignment
- CCTV system → search authorization logging
- Police integration → escalation workflows
- Lost/Found system (`src/app/lost-and-found/`)

**Data Sources:**
- `safeguarding_incidents` table (new): `id`, `event_id`, `incident_type`, `person_description`, `last_known_location`, `accompanying_persons`, `immediate_actions`, `search_authorized_by`, `search_areas`, `police_contacted_at`, `resolved_at`, `resolution_details`
- `cctv_search_requests` table: logs CCTV searches for safeguarding
- `lost_and_found` table (existing) → link to safeguarding incidents
- `incident_logs` → link to main incident system

**Implementation Notes:**
- Create `safeguarding_incidents` and `cctv_search_requests` tables
- Build specialized safeguarding workflow UI
- Add time-based escalation rules
- Integrate with existing lost/found system
- Create safeguarding dashboard (`src/app/safeguarding/`)
- Add police contact workflow

---

### **Feature 8: Human Factors & Fatigue Management**

**Primary Home:** Live Operations Stage → Staff Management Module

**Location:** `src/app/staffing/fatigue/` (new page), `src/components/staffing/FatigueMonitor.tsx`

**Secondary Touchpoints:**
- Planning Stage: Fatigue risk assessment in planning
- Post-Event Stage: Fatigue analysis in debriefs
- Governance Stage: Duty of care compliance

**Key Integrations:**
- Staff management (`src/app/staffing-centre/`)
- Staff assignments (`staff_assignments` table)
- Incident system → correlate incidents with fatigue zones
- Mobile app → self-reporting interface

**Data Sources:**
- `staff_fatigue_reports` table (new): `id`, `staff_id`, `event_id`, `timestamp`, `fatigue_level`, `heat_cold_discomfort`, `stress_level`, `workload_perception`, `concerns`, `reported_via`
- `staff_assignments` → time on post, shift duration
- `staff` table → role type
- `incident_logs` → incident history by zone

**Implementation Notes:**
- Create `staff_fatigue_reports` table
- Build fatigue monitoring dashboard
- Add self-reporting interface (mobile-friendly)
- Create fatigue alert system
- Build rotation suggestion engine
- Link to decision logging for rotation decisions

---

### **Feature 9: Staff Competency & Readiness Tracker**

**Primary Home:** Planning Stage → Staff Management Module

**Location:** `src/app/staff/competency/` (new page), `src/components/staff/CompetencyTracker.tsx`

**Secondary Touchpoints:**
- Live Operations Stage: Competency-aware staff dispatch
- Post-Event Stage: Competency gap analysis in debriefs
- Governance Stage: Compliance and certification tracking

**Key Integrations:**
- Staff database (`src/app/staff/`, `staff` table)
- Staff skills (`staff_skills` table - existing)
- Callsign assignment → competency validation
- Zone planning → competency requirements

**Data Sources:**
- `staff` table → basic staff info
- `staff_skills` table (existing): qualifications and levels
- `staff_experience` table (new): years, event types, prior roles
- `competency_requirements` table (new): zone/gate/function → required skills
- `competency_gaps` table (new): identified gaps per event

**Implementation Notes:**
- Enhance `staff_skills` table with levels and expiry dates
- Create `staff_experience` and `competency_requirements` tables
- Build competency validation engine (`src/lib/staff/competencyValidator.ts`)
- Create competency dashboard
- Add competency-aware staff assignment to callsign system
- Build gap analysis reports

---

### **Feature 10: Intelligent Radio Traffic Analysis**

**Primary Home:** Intelligence Stage → Communication Intelligence Module

**Location:** `src/app/monitoring/radio-analysis/` (new page), `src/components/monitoring/RadioTrafficAnalyzer.tsx`

**Secondary Touchpoints:**
- Live Operations Stage: Radio alerts in Dashboard
- Governance Stage: Radio traffic quality metrics

**Key Integrations:**
- Radio system (external API or `radio_messages` table)
- Incident system → auto-create incidents from radio
- Staff assignments → task creation from radio
- Notification system → alert on overload patterns

**Data Sources:**
- `radio_messages` table (new or existing): `id`, `channel`, `from_callsign`, `to_callsign`, `message`, `timestamp`, `transcription`, `category`, `priority`
- `radio_channel_health` table (new): channel metrics, traffic volume, response times
- Radio audio streams → transcription service (external)

**Implementation Notes:**
- Create `radio_messages` and `radio_channel_health` tables
- Build radio transcription service (integrate with speech-to-text API)
- Create traffic analysis engine (`src/lib/ai/radioAnalysis.ts`)
- Build pattern detection for overload indicators
- Add auto-incident creation from radio messages
- Create channel health dashboard

---

### **Feature 11: Automated Learning & "Lessons Learned" Engine**

**Primary Home:** Post-Event Stage → Continuous Improvement Module

**Location:** `src/app/reports/lessons-learned/` (new page), `src/lib/ai/lessonsLearnedEngine.ts`

**Secondary Touchpoints:**
- Planning Stage: Apply lessons to new events
- Governance Stage: Learning repository and benchmarking

**Key Integrations:**
- Event summaries (`src/lib/ai/eventSummaryGenerator.ts`)
- Benchmarking (`src/app/api/v1/events/[id]/benchmarking/`)
- Pattern analysis (`src/app/api/v1/events/[id]/patterns/`)
- Knowledge base → store lessons
- SOP system → update SOPs from lessons

**Data Sources:**
- `lessons_learned` table (new): `id`, `event_id`, `company_id`, `lesson_type`, `issue_description`, `mitigation_tried`, `effectiveness`, `recommended_action`, `linked_sop_id`, `created_at`
- `event_summaries` table (existing)
- `pattern_analyses` table (existing)
- `benchmarking_results` table (existing)
- `incident_logs` → recurring issues

**Implementation Notes:**
- Create `lessons_learned` table
- Build lessons extraction engine (`src/lib/ai/lessonsLearnedEngine.ts`)
- Create lessons repository UI
- Add benchmarking integration for cross-event learning
- Build SOP update suggestions from lessons
- Create improvement recommendations generator

---

### **Feature 12: Compliance Assurance Layer**

**Primary Home:** Governance Stage → Compliance Module

**Location:** `src/app/compliance/` (new module), `src/components/compliance/ComplianceMonitor.tsx`

**Secondary Touchpoints:**
- Planning Stage: Pre-event compliance checks
- Live Operations Stage: Real-time compliance monitoring
- Post-Event Stage: Compliance reporting

**Key Integrations:**
- Event planning → license conditions
- Staff management → medical/welfare provisions
- Incident system → capacity and timing restrictions
- Settings system → CT and security requirements

**Data Sources:**
- `license_conditions` table (new): `id`, `company_id`, `event_id`, `condition_type`, `requirement`, `monitoring_field`, `threshold`, `alert_level`
- `compliance_checks` table (new): `id`, `event_id`, `check_type`, `status`, `checked_at`, `violation_details`
- `events` table → capacity, timings
- `staff` table → medical/welfare staffing
- `incident_logs` → capacity monitoring

**Implementation Notes:**
- Create `license_conditions` and `compliance_checks` tables
- Build compliance rule engine (`src/lib/compliance/complianceEngine.ts`)
- Create compliance dashboard
- Add real-time monitoring alerts
- Build compliance report generator
- Integrate with existing compliance export (`src/app/api/compliance/exports/`)

---

### **Feature 13: Privacy-by-Design & Ethics Dashboard**

**Primary Home:** Governance Stage → Privacy & Ethics Module

**Location:** `src/app/admin/privacy/` (new module), `src/components/admin/PrivacyDashboard.tsx`

**Secondary Touchpoints:**
- Planning Stage: DPIA management for new technologies
- Live Operations Stage: Privacy mode toggles
- All Stages: Data retention and access controls

**Key Integrations:**
- Data sources registry → track all data inputs
- Access control system → who can access what
- Audit logging → data access audit trail
- Settings → privacy preferences

**Data Sources:**
- `dpias` table (new): `id`, `company_id`, `technology_name`, `data_types`, `retention_period`, `access_controls`, `legal_basis`, `created_at`, `reviewed_at`
- `data_sources` table (new): `id`, `source_name`, `data_type`, `retention_period`, `access_level`
- `privacy_settings` table (new): `id`, `company_id`, `anonymization_mode`, `data_sharing_consent`
- `audit_logs` → data access tracking

**Implementation Notes:**
- Create `dpias`, `data_sources`, and `privacy_settings` tables
- Build privacy dashboard UI
- Create DPIA management system
- Add anonymization toggles
- Build public assurance summary generator
- Integrate with audit logging for data access

---

### **Feature 14: Public-Facing Safety & Information Layer**

**Primary Home:** Live Operations Stage → Public Information Module

**Location:** `src/app/public/safety/` (new public-facing module), `src/components/public/SafetyInformation.tsx`

**Secondary Touchpoints:**
- Planning Stage: Public information plan configuration
- Intelligence Stage: Queue time predictions

**Key Integrations:**
- Crowd flow predictor → queue time estimates
- Access control → gate status
- Facility monitoring → toilet/bar availability
- Event app APIs → widget integration
- Public screens → display integration

**Data Sources:**
- `public_safety_messages` table (new): `id`, `event_id`, `message_type`, `content`, `target_location`, `active_from`, `active_until`
- `queue_times` table (new): `id`, `event_id`, `facility_type`, `location`, `estimated_wait`, `updated_at`
- `facility_status` table (new): `id`, `event_id`, `facility_type`, `location`, `status`, `capacity`, `current_usage`
- Crowd flow data → queue predictions

**Implementation Notes:**
- Create `public_safety_messages`, `queue_times`, and `facility_status` tables
- Build public API endpoints (`src/app/api/public/safety/`)
- Create public-facing UI components (no auth required)
- Build widget system for event apps
- Add location-aware messaging
- Integrate with accessibility features

---

### **Feature 15: Stakeholder Transparency Portal**

**Primary Home:** Governance Stage → Stakeholder Management Module

**Location:** `src/app/stakeholders/` (new module), `src/components/stakeholders/StakeholderPortal.tsx`

**Secondary Touchpoints:**
- Live Operations Stage: Live summary dashboards
- Post-Event Stage: Post-event reports and metrics

**Key Integrations:**
- Dashboard data → summarized views
- Reports system → stakeholder-specific reports
- Access control → role-based access
- Audit logging → access tracking

**Data Sources:**
- `stakeholder_accounts` table (new): `id`, `company_id`, `stakeholder_type`, `email`, `access_level`, `allowed_features`, `created_at`, `last_access`
- `stakeholder_access_logs` table (new): `id`, `stakeholder_id`, `resource_type`, `resource_id`, `accessed_at`
- `stakeholder_dashboards` table (new): `id`, `stakeholder_id`, `dashboard_config`, `metrics_scope`
- Existing dashboard and report data → filtered views

**Implementation Notes:**
- Create `stakeholder_accounts`, `stakeholder_access_logs`, and `stakeholder_dashboards` tables
- Build stakeholder portal UI
- Create role-based dashboard views
- Add time-limited access controls
- Build access logging system
- Create stakeholder-specific report templates

---

## 3. Shared Services & Sequenced Rollout

### **Foundational Shared Services**

These services must be established or enhanced before dependent features can be fully implemented:

#### **3.1 Identity & Roles/Permissions**
**Current State:** `src/lib/auth/roles.ts`, `src/lib/middleware/auth.ts`
**Enhancements Needed:**
- Fine-grained permission system for new features (safeguarding, decisions, simulations)
- Stakeholder role types (SAG, police, venue owner)
- Feature-level access controls

**Dependencies:**
- Feature 3 (Decision Logging) - requires role-based decision ownership
- Feature 9 (Competency Tracker) - requires role-based access to competency data
- Feature 12 (Compliance) - requires role-based compliance access
- Feature 13 (Privacy) - requires role-based data access controls
- Feature 15 (Stakeholder Portal) - requires stakeholder role types

#### **3.2 Audit & Decision Logging**
**Current State:** `src/app/admin/audit-logs/`, `database/auditable_logging_phase1_migration.sql`
**Enhancements Needed:**
- Tamper-evident record locking
- Decision-specific audit trail
- Evidence attachment system
- Inquiry pack generation

**Dependencies:**
- Feature 3 (Decision Logging) - core feature
- Feature 5 (Simulations) - training decision capture
- Feature 8 (Fatigue Management) - rotation decision logging
- Feature 13 (Privacy) - data access audit trail

#### **3.3 Notifications & Tasking**
**Current State:** `src/components/NotificationDrawer.tsx`, `src/lib/notifications/`
**Enhancements Needed:**
- Alert routing based on feature triggers
- Task creation from AI insights
- Multi-channel notification (radio, SMS, email, push)

**Dependencies:**
- Feature 1 (Readiness Index) - threshold alerts
- Feature 2 (Doctrine Assistant) - SOP adjustment notifications
- Feature 4 (Crowd Flow) - congestion alerts
- Feature 6 (Crowd Behavior) - welfare alerts
- Feature 10 (Radio Analysis) - overload alerts
- Feature 12 (Compliance) - compliance violation alerts

#### **3.4 Data Ingestion Layer**
**Current State:** Partial (weather, some APIs)
**Enhancements Needed:**
- Unified data ingestion service
- External API integration framework
- Real-time data streaming infrastructure
- Data validation and normalization

**Dependencies:**
- Feature 1 (Readiness Index) - transport, asset status feeds
- Feature 4 (Crowd Flow) - ticket scans, CCTV, transport
- Feature 6 (Crowd Behavior) - CCTV analytics, acoustic data
- Feature 10 (Radio Analysis) - radio audio streams
- Feature 14 (Public Safety) - facility status, queue data

### **Recommended Rollout Phasing**

#### **Phase 1: Foundations (Months 1-2)**
**Goal:** Establish shared services and core infrastructure

1. **Enhanced Identity & Permissions**
   - Extend role system for new feature access
   - Add stakeholder role types
   - Implement fine-grained permissions

2. **Audit & Decision Logging Enhancement**
   - Tamper-evident locking mechanism
   - Evidence attachment system
   - Decision logging UI components

3. **Data Ingestion Framework**
   - Unified ingestion service architecture
   - External API integration patterns
   - Real-time streaming infrastructure

4. **Notification System Enhancement**
   - Multi-channel routing
   - Alert rule engine
   - Task creation from alerts

**Deliverables:**
- Enhanced auth system
- Decision logging foundation (Feature 3 partial)
- Data ingestion framework
- Notification enhancements

---

#### **Phase 2: Decision Support & Intelligence (Months 3-4)**
**Goal:** Provide real-time decision support and intelligence

1. **Feature 1: Real-Time Operational Readiness Index**
   - Readiness calculation engine
   - Dashboard integration
   - Alert system

2. **Feature 3: Golden Thread Decision Logging** (Complete)
   - Inquiry pack generator
   - Evidence linking
   - Record locking

3. **Feature 2: Live Doctrine Assistant** (Planning phase)
   - SOP template library
   - Doctrine alignment engine
   - Planning-stage integration

4. **Feature 10: Intelligent Radio Traffic Analysis** (Foundation)
   - Radio transcription service
   - Basic traffic analysis
   - Auto-incident creation

**Deliverables:**
- Readiness Index dashboard
- Decision logging system
- SOP planning assistant
- Radio analysis foundation

---

#### **Phase 3: Predictive & Behavioral Intelligence (Months 5-6)**
**Goal:** Advanced predictive capabilities and crowd intelligence

1. **Feature 4: Predictive Crowd Flow**
   - Flow prediction engine
   - Heatmap visualizations
   - "What if?" scenario testing

2. **Feature 6: AI Crowd Behavior & Sentiment**
   - Behavior detection integration
   - Sentiment analysis engine
   - Welfare sentiment dashboard

3. **Feature 2: Live Doctrine Assistant** (Live Ops phase)
   - Real-time SOP monitoring
   - Dynamic adjustment engine
   - Accept/Modify/Reject workflow

**Deliverables:**
- Crowd flow predictor
- Behavior and sentiment intelligence
- Live SOP adjustment system

---

#### **Phase 4: Human Factors & Safeguarding (Months 7-8)**
**Goal:** Staff welfare and specialized safeguarding workflows

1. **Feature 8: Human Factors & Fatigue Management**
   - Fatigue monitoring dashboard
   - Self-reporting interface
   - Rotation suggestion engine

2. **Feature 9: Staff Competency & Readiness Tracker**
   - Competency validation engine
   - Gap analysis system
   - Competency-aware assignment

3. **Feature 7: Safeguarding Workflow**
   - Specialized safeguarding UI
   - Search authorization logging
   - Police escalation workflow

**Deliverables:**
- Fatigue management system
- Competency tracker
- Safeguarding workflow

---

#### **Phase 5: Training & Continuous Improvement (Months 9-10)**
**Goal:** Simulation capabilities and learning engine

1. **Feature 5: Simulation & Scenario Engine**
   - Simulation engine
   - Training mode UI
   - Scenario builder

2. **Feature 11: Automated Learning Engine**
   - Lessons extraction engine
   - Learning repository
   - SOP update suggestions

**Deliverables:**
- Simulation system
- Lessons learned engine

---

#### **Phase 6: Compliance & Public Interface (Months 11-12)**
**Goal:** Compliance assurance and public-facing features

1. **Feature 12: Compliance Assurance Layer**
   - Compliance rule engine
   - Real-time monitoring
   - Compliance reporting

2. **Feature 13: Privacy & Ethics Dashboard**
   - DPIA management
   - Privacy controls
   - Public assurance summaries

3. **Feature 14: Public-Facing Safety Layer**
   - Public API endpoints
   - Safety information widgets
   - Queue time displays

4. **Feature 15: Stakeholder Transparency Portal**
   - Stakeholder portal UI
   - Role-based dashboards
   - Access logging

**Deliverables:**
- Compliance monitoring system
- Privacy dashboard
- Public safety information layer
- Stakeholder portal

---

### **Cross-Cutting Considerations**

#### **Database Migration Strategy**
- Create migration files for each new table in `database/` directory
- Follow existing naming convention: `{feature_name}_migration.sql`
- Ensure RLS policies for all new tables
- Add company isolation where applicable

#### **API Architecture**
- Follow existing API patterns in `src/app/api/`
- Create feature-specific API routes where needed
- Use versioned APIs (`/api/v1/`) for major features
- Implement rate limiting for public-facing APIs

#### **Component Architecture**
- Create feature-specific components in `src/components/{feature}/`
- Reuse existing UI patterns (cards, modals, tables)
- Follow existing design system (`CARD_DESIGN_SYSTEM.md`)

#### **Testing Strategy**
- Unit tests for calculation engines
- Integration tests for API endpoints
- E2E tests for critical workflows (decision logging, safeguarding)

#### **Documentation**
- Update `FEATURE_CATALOGUE.md` as features are implemented
- Create user guides for each major feature
- Document API endpoints in `API_DOCUMENTATION.md`

---

## Summary

This placement strategy maps all 15 proposed features to their optimal locations within the InCommand lifecycle stages, identifies key integrations and data sources, and provides a phased rollout plan that minimizes architectural churn while maximizing value delivery. The strategy prioritizes foundational shared services in Phase 1, followed by decision support capabilities, then advanced intelligence features, human factors, training, and finally compliance and public interfaces.

