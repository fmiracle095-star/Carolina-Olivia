const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

if (!code.includes('import { motion }')) {
  code = `import { motion } from 'motion/react';\n` + code;
}

// Ensure all div that had initial/animate are motion.div
code = code.replace(/<div(\s+initial=)/g, '<motion.div$1');
code = code.replace(/<\/div>(\s*\{\/\* Action CTA Block \*\/})/g, '</motion.div>$1');
code = code.replace(/<\/div>(\s*\{\/\* Node Status Grid \*\/})/g, '</motion.div>$1');
code = code.replace(/<\/div>(\s*<\/div>\s*\{\/\* Footer \*\/})/g, '</motion.div>$1');

fs.writeFileSync('src/app/page.tsx', code);
console.log('page fixed');
