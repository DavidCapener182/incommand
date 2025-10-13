export function logClientEvent(name: string, props?: Record<string, any>) {
  try {
    // For now, console log; wire to your analytics later
    // eslint-disable-next-line no-console
    console.debug('[analytics]', name, props || {})
  } catch {}
}


