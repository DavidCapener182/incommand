import { NextApiRequest, NextApiResponse } from 'next';
import { getGates, createGate, updateGate, deleteGate, updateGateStatus, getGateStatusSummary } from '@/lib/database/crowd';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract company_id and event_id from headers or query params
  const companyId = req.headers['x-company-id'] as string || req.query.company_id as string;
  const eventId = req.headers['x-event-id'] as string || req.query.event_id as string;

  if (!companyId || !eventId) {
    return res.status(400).json({ error: 'company_id and event_id are required' });
  }

  try {
    if (req.method === 'GET') {
      // Return gate statuses + configuration
      const gates = await getGates(companyId, eventId);
      const summary = await getGateStatusSummary(companyId, eventId);
      
      res.status(200).json({
        gates: gates.map(gate => ({
          id: gate.id,
          name: gate.name,
          sensorId: gate.sensor_id,
          entryRate: gate.entry_rate,
          threshold: gate.threshold,
          status: gate.status || 'active',
          currentEntryRate: gate.current_entry_rate || gate.entry_rate
        })),
        summary
      });
    } else if (req.method === 'POST') {
      // Update current gate statuses (manual overrides)
      const { gateId, status, entryRate, recordedBy } = req.body;
      
      if (typeof gateId !== 'string') {
        return res.status(400).json({ error: 'gateId is required' });
      }
      
      await updateGateStatus(companyId, eventId, gateId, status, entryRate, recordedBy);
      res.status(200).json({ success: true });
    } else if (req.method === 'PUT') {
      // Update gate configuration
      const { action, data } = req.body;
      
      if (action === 'create') {
        const newGate = await createGate(companyId, eventId, {
          name: data.name,
          sensor_id: data.sensorId,
          entry_rate: data.entryRate,
          threshold: data.threshold
        });
        res.status(201).json(newGate);
      } else if (action === 'update') {
        const updatedGate = await updateGate(companyId, eventId, data.id, {
          name: data.name,
          sensor_id: data.sensorId,
          entry_rate: data.entryRate,
          threshold: data.threshold
        });
        res.status(200).json(updatedGate);
      } else if (action === 'delete') {
        await deleteGate(companyId, eventId, data.id);
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid action. Use create, update, or delete' });
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Crowd API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

