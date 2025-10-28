import { NextApiRequest, NextApiResponse } from 'next';
import { getMergedFootballData } from '@/lib/football/manualStore';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const data = getMergedFootballData();
    res.status(200).json({ data });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
