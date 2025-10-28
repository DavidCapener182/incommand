import { FootballData, FootballManualOverrides } from "@/types/football";
import { footballStubData } from "@/lib/football/stubData";

// Simple in-memory store for operator overrides.
// Intentionally ephemeral; survives per-instance only.
let overrides: FootballManualOverrides = {};

export function getManualOverrides(): FootballManualOverrides {
  return overrides;
}

export function updateManualOverrides(update: FootballManualOverrides): FootballManualOverrides {
  // Shallow merge with special handling for nested objects
  overrides = deepMerge(overrides, update);
  return overrides;
}

export function getMergedFootballData(): FootballData {
  return deepMerge(structuredClone(footballStubData), overrides);
}

// Deep merge utility preserving nested shape for Partial overrides
function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T>(target: T, source: any): T {
  if (!isObject(source)) return (source as T) ?? target;
  const out: any = Array.isArray(target) ? [...(target as any)] : { ...(target as any) };
  for (const key of Object.keys(source)) {
    const srcVal = (source as any)[key];
    const tgtVal = (out as any)[key];
    if (Array.isArray(srcVal)) {
      out[key] = srcVal; // replace arrays
    } else if (isObject(srcVal) && isObject(tgtVal)) {
      out[key] = deepMerge(tgtVal, srcVal);
    } else if (srcVal !== undefined) {
      out[key] = srcVal;
    }
  }
  return out as T;
}


