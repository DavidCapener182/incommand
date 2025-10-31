import { NextApiRequest, NextApiResponse } from 'next';
import { getStands } from '@/lib/database/stands';
import { getStandThresholds } from '@/lib/database/thresholds';

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
    const stands = await getStands(companyId, eventId);
    const thresholds = await getStandThresholds(companyId, eventId);

    // Generate CSV
    const csvRows = [
      ['Stand Name', 'Current Occupancy', 'Capacity', 'Percentage', 'Status', 'Timestamp'].join(','),
      ...stands.map(stand => {
        const percent = stand.capacity ? Math.min(100, ((stand.current_occupancy || 0) / stand.capacity) * 100) : 0
        const amberThreshold = thresholds?.stand_overrides[stand.name]?.amber ?? thresholds?.default_amber_threshold ?? 97
        const redThreshold = thresholds?.stand_overrides[stand.name]?.red ?? thresholds?.default_red_threshold ?? 100
        
        let status = 'Normal'
        if (percent >= redThreshold) status = 'Full'
        else if (percent >= amberThreshold) status = 'Busy'
        
        return [
          stand.name,
          stand.current_occupancy || 0,
          stand.capacity,
          `${percent.toFixed(1)}%`,
          status,
          new Date().toISOString()
        ].join(',')
      })
    ];

    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="stand-occupancy-report-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

