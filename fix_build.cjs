const fs = require('fs');

let file = fs.readFileSync('src/app/layout.tsx', 'utf8');

// Ensure html tag has suppressHydrationWarning
file = file.replace(
  '<html lang="en">',
  '<html lang="en" suppressHydrationWarning>'
);
fs.writeFileSync('src/app/layout.tsx', file);

console.log('src/app/layout.tsx updated');
