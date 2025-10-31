import { NextApiRequest, NextApiResponse } from 'next';
import { getStandThresholds, upsertStandThresholds } from '@/lib/database/thresholds';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract company_id and event_id from headers or query params
  const companyId = req.headers['x-company-id'] as string || req.query.company_id as string;
  const eventId = req.headers['x-event-id'] as string || req.query.event_id as string;

  if (!companyId || !eventId) {
    return res.status(400).json({ error: 'company_id and event_id are required' });
  }

  try {
    if (req.method === 'GET') {
      const thresholds = await getStandThresholds(companyId, eventId);
      
      // Return defaults if none exist
      if (!thresholds) {
        return res.status(200).json({
          default_green_threshold: 90,
          default_amber_threshold: 97,
          default_red_threshold: 100,
          stand_overrides: {}
        });
      }
      
      res.status(200).json({
        default_green_threshold: thresholds.default_green_threshold,
        default_amber_threshold: thresholds.default_amber_threshold,
        default_red_threshold: thresholds.default_red_threshold,
        stand_overrides: thresholds.stand_overrides || {}
      });
    } else if (req.method === 'PUT') {
      const { default_green_threshold, default_amber_threshold, default_red_threshold, stand_overrides } = req.body;
      
      const updated = await upsertStandThresholds(companyId, eventId, {
        default_green_threshold,
        default_amber_threshold,
        default_red_threshold,
        stand_overrides
      });
      
      res.status(200).json({
        default_green_threshold: updated.default_green_threshold,
        default_amber_threshold: updated.default_amber_threshold,
        default_red_threshold: updated.default_red_threshold,
        stand_overrides: updated.stand_overrides
      });
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Thresholds API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

