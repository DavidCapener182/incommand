import { NextApiRequest, NextApiResponse } from 'next';
import { getFixtureTasks } from '@/lib/database/fixture';

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
    const tasks = await getFixtureTasks(companyId, eventId);

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'No fixture data found' });
    }

    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;
    const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    // Generate CSV
    const csvRows = [
      ['Minute', 'Description', 'Assigned Role', 'Status', 'Completed At', 'Completed By'].join(','),
      ...tasks.map((task) => [
        task.minute,
        `"${task.description.replace(/"/g, '""')}"`,
        task.assigned_role || 'Unassigned',
        task.completed ? 'Completed' : 'Pending',
        task.completed_at ? new Date(task.completed_at).toISOString() : '',
        task.completed_by || ''
      ].join(',')),
      ['', '', '', '', '', ''].join(','),
      ['SUMMARY', '', '', '', '', ''].join(','),
      ['Total Tasks', totalCount, '', '', '', ''].join(','),
      ['Completed Tasks', completedCount, '', '', '', ''].join(','),
      ['Pending Tasks', totalCount - completedCount, '', '', '', ''].join(','),
      ['Progress', `${progressPercent.toFixed(1)}%`, '', '', '', ''].join(',')
    ];

    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="match-report-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

