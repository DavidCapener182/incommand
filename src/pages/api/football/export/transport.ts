import { NextApiRequest, NextApiResponse } from 'next';
import { getTransportConfig, getTransportIssues } from '@/lib/database/transport';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const companyId = req.query.company_id as string;
  const eventId = req.query.event_id as string;

  if (!companyId || !eventId) {
    return res.status(400).json({ error: 'company_id and event_id are required' });
  }

  try {
    const config = await getTransportConfig(companyId, eventId);
    const issues = await getTransportIssues(companyId, eventId);

    if (!config) {
      return res.status(404).json({ error: 'No transport configuration found' });
    }

    // Generate CSV
    const csvRows = [
      ['Issue Type', 'Description', 'Severity', 'Reported At', 'Reported By', 'Resolved', 'Resolved At'].join(','),
      ...issues.map((issue) => [
        issue.type,
        `"${issue.description.replace(/"/g, '""')}"`,
        issue.severity,
        issue.reported_at ? new Date(issue.reported_at).toISOString() : '',
        issue.reported_by || 'N/A',
        issue.resolved ? 'Yes' : 'No',
        issue.resolved_at ? new Date(issue.resolved_at).toISOString() : ''
      ].join(',')),
      ['', '', '', '', '', '', ''].join(','),
      ['Location', config.location, '', '', '', '', ''].join(','),
      ['Postcode', config.postcode || 'N/A', '', '', '', '', ''].join(','),
      ['Monitoring Radius', `${config.radius} miles`, '', '', '', '', ''].join(','),
      ['Providers', config.providers?.join('; ') || 'N/A', '', '', '', '', ''].join(',')
    ];

    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transport-report-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

