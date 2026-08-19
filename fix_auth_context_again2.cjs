const fs = require('fs');

let file = fs.readFileSync('src/lib/AuthContext.tsx', 'utf8');

file = file.replace(
  'return const supabase = createClient();',
  'const supabase = createClient();'
);

fs.writeFileSync('src/lib/AuthContext.tsx', file);
console.log('updated AuthContext again 2');
