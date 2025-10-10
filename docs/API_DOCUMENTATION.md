# inCommand REST API Documentation

## Overview

The inCommand REST API provides programmatic access to incident management, analytics, and reporting features. All API requests require authentication via API key.

**Base URL**: `https://your-domain.com/api/v1`

**API Version**: 1.0

---

## Authentication

All API requests must include an API key in the request header:

```http
X-API-Key: your_api_key_here
```

### Getting an API Key

1. Log in to inCommand
2. Navigate to Settings > API Keys
3. Click "Generate New API Key"
4. Copy and securely store your API key

**⚠️ Important**: API keys grant full access to your organization's data. Keep them secure and never commit them to version control.

---

## Endpoints

### Incidents

#### List Incidents

Get a list of incidents with optional filtering.

```http
GET /api/v1/incidents
```

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `event_id` | string | Filter by event ID | - |
| `status` | string | `open` or `closed` | - |
| `priority` | string | `high`, `medium`, or `low` | - |
| `type` | string | Incident type | - |
| `limit` | number | Number of results (max 100) | 100 |
| `offset` | number | Pagination offset | 0 |
| `sort_by` | string | Sort field | `timestamp` |
| `sort_order` | string | `asc` or `desc` | `desc` |

**Example Request:**

```bash
curl -X GET "https://your-domain.com/api/v1/incidents?event_id=abc123&status=open&limit=50" \
  -H "X-API-Key: your_api_key_here"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "event_id": "abc123",
      "log_number": "001",
      "incident_type": "Medical",
      "priority": "high",
      "occurrence": "Person collapsed at main gate",
      "action_taken": "Medics dispatched",
      "timestamp": "2024-01-15T14:30:00Z",
      "is_closed": false,
      "callsign_from": "Alpha 1",
      "callsign_to": "Control",
      "logged_by_callsign": "Charlie 2",
      "entry_type": "contemporaneous",
      "is_amended": false,
      "incident_photos": []
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  },
  "meta": {
    "timestamp": "2024-01-15T14:35:00Z",
    "version": "1.0"
  }
}
```

#### Create Incident

Create a new incident log entry.

```http
POST /api/v1/incidents
```

**Request Body:**

```json
{
  "event_id": "abc123",
  "incident_type": "Medical",
  "occurrence": "Person collapsed at main gate",
  "action_taken": "Medics dispatched to location",
  "priority": "high",
  "callsign_from": "Alpha 1",
  "callsign_to": "Control",
  "timestamp": "2024-01-15T14:30:00Z",
  "entry_type": "contemporaneous",
  "logged_by_callsign": "Charlie 2",
  "time_of_occurrence": "2024-01-15T14:30:00Z"
}
```

**Required Fields:**
- `event_id`
- `incident_type`
- `occurrence`

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "event_id": "abc123",
    "log_number": "001",
    // ... full incident object
  },
  "meta": {
    "timestamp": "2024-01-15T14:30:00Z",
    "version": "1.0"
  }
}
```

---

### Analytics

#### Get Analytics Summary

```http
GET /api/v1/analytics/summary
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `event_id` | string | Event ID (required) |
| `start_date` | string | ISO 8601 date |
| `end_date` | string | ISO 8601 date |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "totalIncidents": 150,
    "openIncidents": 12,
    "averageResponseTime": 8.5,
    "qualityScore": 87.3,
    "complianceRate": 94.2,
    "incidentsByType": {
      "Medical": 45,
      "Ejection": 32,
      "Theft": 18
    }
  }
}
```

---

### Webhooks

#### Register Webhook

```http
POST /api/v1/webhooks
```

**Request Body:**

```json
{
  "name": "External System Integration",
  "url": "https://external-system.com/webhook",
  "events": [
    "incident.created",
    "incident.updated",
    "alert.critical"
  ],
  "secret": "your_webhook_secret"
}
```

**Webhook Events:**
- `incident.created` - New incident logged
- `incident.updated` - Incident modified
- `incident.closed` - Incident resolved
- `log.created` - New log entry
- `log.amended` - Log entry amended
- `event.started` - Event began
- `event.ended` - Event concluded
- `alert.critical` - Critical alert triggered

**Webhook Payload Example:**

```json
{
  "event": "incident.created",
  "timestamp": "2024-01-15T14:30:00Z",
  "data": {
    "incident": {
      // Full incident object
    }
  },
  "metadata": {
    "source": "inCommand",
    "version": "1.0"
  }
}
```

**Webhook Security:**

All webhooks include an `X-Webhook-Signature` header containing an HMAC-SHA256 signature. Verify this signature using your webhook secret:

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expected = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

---

## Error Handling

All API errors follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional error details"
}
```

**HTTP Status Codes:**

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

---

## Rate Limiting

API requests are rate limited to:
- **100 requests per minute** per API key
- **1000 requests per hour** per API key

When rate limited, you'll receive a `429` status code with:

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests",
  "retryAfter": 60
}
```

---

## Webhooks vs API Polling

**Use Webhooks when:**
- ✅ You need real-time updates
- ✅ You want to minimize API calls
- ✅ Your system can receive HTTP requests

**Use API Polling when:**
- ✅ Your system is behind a firewall
- ✅ You need to pull data on demand
- ✅ Real-time updates aren't critical

---

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @incommand/api-client
```

```typescript
import { InCommandAPI } from '@incommand/api-client'

const client = new InCommandAPI({
  apiKey: 'your_api_key_here',
  baseUrl: 'https://your-domain.com/api/v1'
})

// List incidents
const incidents = await client.incidents.list({
  eventId: 'abc123',
  status: 'open'
})

// Create incident
const newIncident = await client.incidents.create({
  eventId: 'abc123',
  incidentType: 'Medical',
  occurrence: 'Person collapsed',
  priority: 'high'
})
```

### Python

```bash
pip install incommand-api
```

```python
from incommand import InCommandAPI

client = InCommandAPI(api_key='your_api_key_here')

# List incidents
incidents = client.incidents.list(
    event_id='abc123',
    status='open'
)

# Create incident
new_incident = client.incidents.create(
    event_id='abc123',
    incident_type='Medical',
    occurrence='Person collapsed',
    priority='high'
)
```

---

## Support

- **Documentation**: https://docs.incommand.app
- **API Status**: https://status.incommand.app
- **Support Email**: api-support@incommand.app
- **GitHub**: https://github.com/incommand/api-examples

---

## Changelog

### Version 1.0 (Current)
- Initial API release
- Incidents CRUD operations
- Analytics endpoints
- Webhook support
- Real-time notifications

---

**Last Updated**: January 2024
