/**
 * Safe JSON parser for HTTP responses
 * Prevents "Unexpected token '<'" errors when HTML is returned instead of JSON
 * 
 * Usage:
 *   const data = await safeJson(response);
 * 
 * Throws descriptive error if response is not valid JSON
 */
export async function safeJson(res: Response) {
  const ct = res.headers.get('content-type') || '';
  const body = await res.text();
  
  if (!ct.includes('application/json')) {
    const preview = body.slice(0, 120);
    throw new Error(
      `Expected JSON, got ${ct || 'unknown'} (HTTP ${res.status}). ` +
      `Body starts: ${preview}${body.length > 120 ? '...' : ''}`
    );
  }
  
  try {
    return JSON.parse(body);
  } catch (e) {
    const preview = body.slice(0, 120);
    throw new Error(
      `Invalid JSON in response (HTTP ${res.status}). ` +
      `Body starts: ${preview}${body.length > 120 ? '...' : ''}`
    );
  }
}
