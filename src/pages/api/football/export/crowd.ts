import { NextApiRequest, NextApiResponse } from 'next';
import { getGates } from '@/lib/database/crowd';
import { getSupportToolsSettings } from '@/lib/database/supportToolsSettings';

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
    const gates = await getGates(companyId, eventId);
    const settings = await getSupportToolsSettings(companyId, eventId, 'crowd');
    const entryRateAlertThreshold = settings?.settings_json?.entry_rate_alert_threshold || 90;
    const highActivityThreshold = settings?.settings_json?.high_activity_threshold || 85;

    if (gates.length === 0) {
      return res.status(404).json({ error: 'No gate data found' });
    }

    // Generate CSV
    const csvRows = [
      ['Gate Name', 'Status', 'Entry Rate (per hour)', 'Threshold', 'Percentage of Threshold', 'Congestion Level', 'Sensor ID', 'Timestamp'].join(','),
      ...gates.map((gate) => {
        const entryRate = gate.current_entry_rate || gate.entry_rate || 0;
        const percentage = gate.threshold > 0 ? (entryRate / gate.threshold) * 100 : 0
        let congestion = 'Low'
        if (percentage >= entryRateAlertThreshold) congestion = 'High'
        else if (percentage >= highActivityThreshold) congestion = 'Medium'
        
        return [
          gate.name,
          gate.status || 'active',
          entryRate,
          gate.threshold,
          `${percentage.toFixed(1)}%`,
          congestion,
          gate.sensor_id || 'N/A',
          new Date().toISOString()
        ].join(',')
      }),
      [
        'TOTAL',
        `Active: ${gates.filter(g => g.status === 'active').length}`,
        '',
        '',
        '',
        '',
        '',
        ''
      ].join(',')
    ];

    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="gate-status-report-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

