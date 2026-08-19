const fs = require('fs');

let file = fs.readFileSync('src/lib/AuthContext.tsx', 'utf8');

file = file.replace(
  `let defaultSupabase = null;
try {
  defaultSupabase = createClient();
} catch (e) {}
const AuthContext = createContext<any>({ supabase: defaultSupabase, session: null, user: null });`,
  `const AuthContext = createContext<any>(undefined);`
);

fs.writeFileSync('src/lib/AuthContext.tsx', file);
console.log('updated AuthContext again 4');
