export async function apiFetch(path: string, token: string | null, options: RequestInit = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || '';
  const url = baseUrl ? `${baseUrl}${path}` : path;
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const response = await fetch(url, { ...options, headers });
  
  // if (!response.ok) throw new Error('API Error'); // let callers handle status
  return response;
}
