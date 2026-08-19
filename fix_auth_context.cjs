const fs = require('fs');

let file = fs.readFileSync('src/lib/AuthContext.tsx', 'utf8');

file = file.replace(
  'export const useAuth = () => useContext(AuthContext);',
  `export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};`
);
fs.writeFileSync('src/lib/AuthContext.tsx', file);

console.log('src/lib/AuthContext.tsx updated');
