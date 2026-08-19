const fs = require('fs');

// Update src/lib/api.ts
let apiTs = fs.readFileSync('src/lib/api.ts', 'utf8');
apiTs = apiTs.replace('export async function apiFetch(url: string, token: string | null, options: RequestInit = {}) {',
  `export async function apiFetch(path: string, token: string | null, options: RequestInit = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || '';
  const url = baseUrl ? \`\${baseUrl}\${path}\` : path;`);
fs.writeFileSync('src/lib/api.ts', apiTs);

console.log('src/lib/api.ts updated');
