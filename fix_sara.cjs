const fs = require('fs');
let code = fs.readFileSync('src/components/SystemRoles.tsx', 'utf-8');

code = code.replace(
  `{!u.isDefault && (`,
  `{u.id !== 'u-1' && (`
);

fs.writeFileSync('src/components/SystemRoles.tsx', code);
