import { NextApiRequest, NextApiResponse } from 'next';
import { getStands, createStand, updateStand, deleteStand, updateStandOccupancy, getTotalCapacity } from '@/lib/database/stands';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract company_id and event_id from headers or query params
  const companyId = req.headers['x-company-id'] as string || req.query.company_id as string;
  const eventId = req.headers['x-event-id'] as string || req.query.event_id as string;

  if (!companyId || !eventId) {
    return res.status(400).json({ error: 'company_id and event_id are required' });
  }

  try {
    if (req.method === 'GET') {
      // Return stands configuration + current occupancy
      const stands = await getStands(companyId, eventId);
      const totalCapacity = await getTotalCapacity(companyId, eventId);
      
      res.status(200).json({
        standsSetup: {
          stands: stands.map((stand) => ({
            id: stand.id,
            name: stand.name,
            capacity: stand.capacity,
            order: stand.order_index,
            current: stand.current_occupancy || 0,
            snapshots: stand.snapshots || {},
          })),
          totalCapacity,
        },
      });
    } else if (req.method === 'POST') {
      // For operational updates (current occupancy)
      const { standId, occupancy, recordedBy, countdownBucket } = req.body;
      
      if (!standId || typeof occupancy !== 'number') {
        return res.status(400).json({ error: 'standId and occupancy are required' });
      }
      
      await updateStandOccupancy(companyId, eventId, standId, occupancy, recordedBy, countdownBucket);
      res.status(200).json({ success: true });
    } else if (req.method === 'PUT') {
      // For config/setup updates (adding/removing stands)
      const { action, data } = req.body;
      
      if (action === 'create') {
        const newStand = await createStand(companyId, eventId, {
          name: data.name,
          capacity: data.capacity,
          order_index: data.order || 0
        });
        res.status(201).json(newStand);
      } else if (action === 'update') {
        const updatedStand = await updateStand(companyId, eventId, data.id, {
          name: data.name,
          capacity: data.capacity,
          order_index: data.order
        });
        res.status(200).json(updatedStand);
      } else if (action === 'delete') {
        await deleteStand(companyId, eventId, data.id);
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid action. Use create, update, or delete' });
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Stands API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

