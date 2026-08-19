const fs = require('fs');

let file = fs.readFileSync('src/lib/AuthContext.tsx', 'utf8');
// Provide an actual default value that isn't undefined or null in a way that breaks context reading during static build
file = file.replace('const AuthContext = createContext<any>(null);', 'const AuthContext = createContext<any>({});');
file = file.replace('<AuthContext.Provider value={null}>', '<AuthContext.Provider value={{}}>');
fs.writeFileSync('src/lib/AuthContext.tsx', file);
console.log('updated AuthContext');
