const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /{adminNotis.length === 0 \? \(/g,
  "{displayedNotis.length === 0 ? ("
);

code = code.replace(
  /adminNotis.map\(noti => \(/g,
  "displayedNotis.map(noti => ("
);

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed App.tsx render");
