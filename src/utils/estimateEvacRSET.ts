export type EstimationInput = {
  occupancy: number;                // current people in venue
  preset?: "conservative"|"standard"|"generous"; // egress richness
  exitCount?: number | null;        // optional; improves estimate if known
  stairsShare?: number;             // 0..1 proportion routed via stairs (default 0.2)
  premovement_s?: number;           // default 90
  avgTravelDistance_m?: number;     // default 60
}

export type EvacResult = {
  minutes: number;                  // rounded up
  details: {
    effectiveWidth_m: number;
    flow_level_ppm: number;
    flow_stairs_ppm: number;
    blended_ppm: number;
    capacity_per_min: number;
    queue_min: number;
    travel_min: number;
    premovement_min: number;
    assumptions: string[];
  }
}

export function estimateEvacRSET(input: EstimationInput): EvacResult {
  const occ = Math.max(0, input.occupancy || 0);
  const preset = input.preset ?? "standard";
  const stairsShare = Math.min(1, Math.max(0, input.stairsShare ?? 0.2));
  const premovement_min = (input.premovement_s ?? 90) / 60;
  const travel_min = (input.avgTravelDistance_m ?? 60) / 1.1 / 60;

  const PRESETS = {
    conservative: { perK_m: 0.50, min_m: 2.4 },
    standard:     { perK_m: 0.60, min_m: 3.6 },
    generous:     { perK_m: 0.80, min_m: 4.8 },
  } as const;

  const FLOW = {
    level_ppm: 80,
    stairs_ppm: 60,
  };

  const p = PRESETS[preset];
  const exitBoost = Math.max(0, (input.exitCount ?? 1) - 1) * 0.2;
  const Weff = Math.max(p.min_m, p.perK_m * (occ / 1000) + exitBoost);

  const blended_ppm = (1 - stairsShare) * FLOW.level_ppm + stairsShare * FLOW.stairs_ppm;
  const capacity_per_min = Math.max(0.1, blended_ppm * Weff); // guardrail

  const queue_min = occ / capacity_per_min;
  const minutes = Math.ceil(queue_min + travel_min + premovement_min);

  return {
    minutes,
    details: {
      effectiveWidth_m: Weff,
      flow_level_ppm: FLOW.level_ppm,
      flow_stairs_ppm: FLOW.stairs_ppm,
      blended_ppm,
      capacity_per_min,
      queue_min,
      travel_min,
      premovement_min,
      assumptions: [
        `Preset: ${preset} (perK=${p.perK_m} m/1k, min=${p.min_m} m)`,
        `Exit boost: +${exitBoost.toFixed(1)} m for ${input.exitCount ?? 1} exits`,
        `Stairs share: ${(stairsShare*100).toFixed(0)}%`,
        `Flows: level ${FLOW.level_ppm} ppm, stairs ${FLOW.stairs_ppm} ppm`,
        `Walking speed: 1.1 m/s`,
        `Premovement: ${(premovement_min).toFixed(1)} min`,
      ],
    },
  };
}
