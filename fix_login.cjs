const fs = require('fs');
let code = fs.readFileSync('src/components/LoginScreen.tsx', 'utf8');
code = code.replace(/\{\/\* Quick Autocomplete Helpers \*\/\}[\s\S]*?<\/div>\s*<\/div>/, '');
fs.writeFileSync('src/components/LoginScreen.tsx', code);
