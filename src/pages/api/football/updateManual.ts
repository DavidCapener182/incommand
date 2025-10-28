import type { NextApiRequest, NextApiResponse } from "next";
import {
  FootballUpdateManualRequest,
  FootballUpdateManualResponse,
} from "@/types/football";
import { getMergedFootballData, updateManualOverrides } from "@/lib/football/manualStore";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<FootballUpdateManualResponse | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = req.body as FootballUpdateManualRequest;
    if (!body || typeof body !== "object" || !body.overrides) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    updateManualOverrides(body.overrides);
    const data = getMergedFootballData();

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


