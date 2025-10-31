import { NextApiRequest, NextApiResponse } from 'next';
import { getStaffingRoles } from '@/lib/database/staffing';
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
    const roles = await getStaffingRoles(companyId, eventId);
    const settings = await getSupportToolsSettings(companyId, eventId, 'staffing');
    const targetThreshold = settings?.settings_json?.target_threshold || 90;
    const alertThreshold = settings?.settings_json?.alert_threshold || 85;

    // Generate CSV
    const csvRows = [
      ['Role', 'Planned', 'Actual', 'Percentage of Planned', 'Status', 'Variance', 'Timestamp'].join(','),
      ...roles.map((role) => {
        const percentOfPlanned = role.planned_count > 0 ? ((role.actual_count || 0) / role.planned_count) * 100 : 0
        let status = 'At Target'
        if (percentOfPlanned >= targetThreshold) status = 'At Target'
        else if (percentOfPlanned >= alertThreshold) status = 'Near Target'
        else status = 'Below Target'
        
        return [
          role.name,
          role.planned_count,
          role.actual_count || 0,
          `${percentOfPlanned.toFixed(1)}%`,
          status,
          (role.actual_count || 0) - role.planned_count,
          new Date().toISOString()
        ].join(',')
      }),
      [
        'TOTAL',
        roles.reduce((sum, r) => sum + (r.planned_count || 0), 0),
        roles.reduce((sum, r) => sum + (r.actual_count || 0), 0),
        '',
        '',
        '',
        ''
      ].join(',')
    ];

    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="staffing-report-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

