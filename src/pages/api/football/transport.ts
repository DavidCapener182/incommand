import { NextApiRequest, NextApiResponse } from 'next';
import { getTransportConfig, upsertTransportConfig, getTransportIssues, createTransportIssue, updateTransportIssue, deleteTransportIssue, getTransportIssuesSummary } from '@/lib/database/transport';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract company_id and event_id from headers or query params
  const companyId = req.headers['x-company-id'] as string || req.query.company_id as string;
  const eventId = req.headers['x-event-id'] as string || req.query.event_id as string;

  if (!companyId || !eventId) {
    return res.status(400).json({ error: 'company_id and event_id are required' });
  }

  try {
    if (req.method === 'GET') {
      // Return transport issues + configuration
      const config = await getTransportConfig(companyId, eventId);
      const issues = await getTransportIssues(companyId, eventId);
      const summary = await getTransportIssuesSummary(companyId, eventId);
      
      res.status(200).json({
        location: config?.location || '',
        postcode: config?.postcode,
        coordinates: config?.latitude && config?.longitude ? {
          lat: config.latitude,
          lng: config.longitude
        } : undefined,
        providers: config?.providers || [],
        radius: config?.radius || 3,
        issues: issues.map(issue => ({
          id: issue.id,
          type: issue.type,
          description: issue.description,
          severity: issue.severity,
          timestamp: issue.reported_at,
          reportedBy: issue.reported_by,
          resolved: issue.resolved,
          resolvedAt: issue.resolved_at
        })),
        summary
      });
    } else if (req.method === 'POST') {
      // Add manual transport disruption note
      const { type, description, severity, reportedBy } = req.body;
      
      if (!type || !description || !severity) {
        return res.status(400).json({ error: 'type, description, and severity are required' });
      }
      
      const newIssue = await createTransportIssue(companyId, eventId, {
        type,
        description,
        severity,
        reported_by: reportedBy
      });
      res.status(201).json(newIssue);
    } else if (req.method === 'PUT') {
      // Update transport monitoring configuration
      const { action, data } = req.body;
      
      if (action === 'config') {
        const updatedConfig = await upsertTransportConfig(companyId, eventId, {
          location: data.location,
          postcode: data.postcode,
          latitude: data.coordinates?.lat,
          longitude: data.coordinates?.lng,
          radius: data.radius,
          providers: data.providers
        });
        res.status(200).json(updatedConfig);
      } else if (action === 'resolve') {
        const updatedIssue = await updateTransportIssue(companyId, eventId, data.issueId, data.resolved);
        res.status(200).json(updatedIssue);
      } else if (action === 'delete') {
        await deleteTransportIssue(companyId, eventId, data.issueId);
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid action. Use config, resolve, or delete' });
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Transport API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

