const fs = require('fs');

let file = fs.readFileSync('src/lib/AuthContext.tsx', 'utf8');

file = file.replace(
  'const AuthContext = createContext<any>({});',
  `import { createClient } from './supabase/client';
  
const AuthContext = createContext<any>({ supabase: null, session: null, user: null });`
);

file = file.replace(
  '<AuthContext.Provider value={{}}>{children}</AuthContext.Provider>',
  `const supabase = createClient();
  return <AuthContext.Provider value={{ supabase, session: null, user: null }}>{children}</AuthContext.Provider>`
);

fs.writeFileSync('src/lib/AuthContext.tsx', file);
console.log('updated AuthContext again');
