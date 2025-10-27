// Disable service workers in development
export async function GET() {
  return new Response('// Service Worker disabled in development', {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
