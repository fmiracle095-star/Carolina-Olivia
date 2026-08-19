const fs = require('fs');

let file = fs.readFileSync('src/lib/AuthContext.tsx', 'utf8');

file = file.replace(
  'const AuthContext = createContext<any>({ supabase: null, session: null, user: null });',
  `
let defaultSupabase = null;
try {
  defaultSupabase = createClient();
} catch (e) {}
const AuthContext = createContext<any>({ supabase: defaultSupabase, session: null, user: null });`
);

fs.writeFileSync('src/lib/AuthContext.tsx', file);
console.log('updated AuthContext again 3');
