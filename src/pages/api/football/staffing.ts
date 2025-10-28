import { NextApiRequest, NextApiResponse } from 'next';
import { getStaffingRoles, createStaffingRole, updateStaffingRole, deleteStaffingRole, updateStaffingActual, getStaffingSummary } from '@/lib/database/staffing';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract company_id and event_id from headers or query params
  const companyId = req.headers['x-company-id'] as string || req.query.company_id as string;
  const eventId = req.headers['x-event-id'] as string || req.query.event_id as string;

  if (!companyId || !eventId) {
    return res.status(400).json({ error: 'company_id and event_id are required' });
  }

  try {
    if (req.method === 'GET') {
      // Return staffing deployment plan + actual
      const roles = await getStaffingRoles(companyId, eventId);
      const summary = await getStaffingSummary(companyId, eventId);
      
      res.status(200).json({ 
        roles: roles.map(role => ({
          id: role.id,
          name: role.name,
          planned: role.planned_count,
          actual: role.actual_count || 0,
          icon: role.icon,
          color: role.color
        })),
        summary
      });
    } else if (req.method === 'POST') {
      // Update actual staffing numbers (auto-save)
      const { roleId, actual, recordedBy } = req.body;
      
      if (typeof roleId !== 'string' || typeof actual !== 'number') {
        return res.status(400).json({ error: 'roleId and actual are required' });
      }
      
      await updateStaffingActual(companyId, eventId, roleId, actual, recordedBy);
      res.status(200).json({ success: true });
    } else if (req.method === 'PUT') {
      // Update deployment plan (explicit save)
      const { action, data } = req.body;
      
      if (action === 'create') {
        const newRole = await createStaffingRole(companyId, eventId, {
          name: data.name,
          planned_count: data.planned,
          icon: data.icon,
          color: data.color
        });
        res.status(201).json(newRole);
      } else if (action === 'update') {
        const updatedRole = await updateStaffingRole(companyId, eventId, data.id, {
          name: data.name,
          planned_count: data.planned,
          icon: data.icon,
          color: data.color
        });
        res.status(200).json(updatedRole);
      } else if (action === 'delete') {
        await deleteStaffingRole(companyId, eventId, data.id);
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid action. Use create, update, or delete' });
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Staffing API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

