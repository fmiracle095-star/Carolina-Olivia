const fs = require('fs');
let layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
let replaced = layout.replace('<Providers>', '').replace('</Providers>', '').replace('import { Providers } from "@/src/components/Providers";', '');
fs.writeFileSync('src/app/layout.tsx', replaced);
