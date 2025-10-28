import { NextApiRequest, NextApiResponse } from 'next';
import { getFixtureTasks, createFixtureTask, updateFixtureTask, deleteFixtureTask, updateTaskCompletion, getTaskCompletionSummary } from '@/lib/database/fixture';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract company_id and event_id from headers or query params
  const companyId = req.headers['x-company-id'] as string || req.query.company_id as string;
  const eventId = req.headers['x-event-id'] as string || req.query.event_id as string;

  if (!companyId || !eventId) {
    return res.status(400).json({ error: 'company_id and event_id are required' });
  }

  try {
    if (req.method === 'GET') {
      // Return fixture checklist with task statuses
      const tasks = await getFixtureTasks(companyId, eventId);
      const summary = await getTaskCompletionSummary(companyId, eventId);
      
      res.status(200).json({
        fixture: `Event ${eventId}`, // You might want to get this from an events table
        tasks: tasks.map(task => ({
          id: task.id,
          minute: task.minute,
          description: task.description,
          assignedRole: task.assigned_role,
          completed: task.completed || false,
          completedAt: task.completed_at,
          completedBy: task.completed_by
        })),
        summary
      });
    } else if (req.method === 'POST') {
      // Update task completion status
      const { taskId, completed, completedBy } = req.body;
      
      if (typeof taskId !== 'string' || typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'taskId and completed are required' });
      }
      
      await updateTaskCompletion(companyId, eventId, taskId, completed, completedBy);
      res.status(200).json({ success: true });
    } else if (req.method === 'PUT') {
      // Update checklist configuration
      const { action, data } = req.body;
      
      if (action === 'create') {
        const newTask = await createFixtureTask(companyId, eventId, {
          minute: data.minute,
          description: data.description,
          assigned_role: data.assignedRole
        });
        res.status(201).json(newTask);
      } else if (action === 'update') {
        const updatedTask = await updateFixtureTask(companyId, eventId, data.id, {
          minute: data.minute,
          description: data.description,
          assigned_role: data.assignedRole
        });
        res.status(200).json(updatedTask);
      } else if (action === 'delete') {
        await deleteFixtureTask(companyId, eventId, data.id);
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid action. Use create, update, or delete' });
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Fixture API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

