export async function apiFetch(url: string, token: string | null, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const response = await fetch(url, { ...options, headers });
  
  // if (!response.ok) throw new Error('API Error'); // let callers handle status
  return response;
}
