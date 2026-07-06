const fs = require('fs');

let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Undo previous changes if needed, or just rewrite the classes.
// Wait, I can just use regex to replace the entire class string for the cards.

code = code.replace(
  /className="bg-white p-5 rounded-2xl border-2 border-\[\#0D5C8C\]\/20 border-r-4 border-r-\[\#0D5C8C\] shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer"/,
  'className="bg-white p-5 rounded-2xl border-2 border-indigo-200 border-r-4 border-r-indigo-600 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer"'
);

code = code.replace(
  /className="bg-white p-5 rounded-2xl border-2 border-\[\#1A7FAA\]\/20 border-r-4 border-r-\[\#1A7FAA\] shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer"/,
  'className="bg-white p-5 rounded-2xl border-2 border-sky-200 border-r-4 border-r-sky-500 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer"'
);

code = code.replace(
  /className="bg-white p-5 rounded-2xl border-2 border-yellow-400\/50 border-r-4 border-r-yellow-400 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer"/,
  'className="bg-white p-5 rounded-2xl border-2 border-yellow-300 border-r-4 border-r-yellow-500 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer"'
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log("Fixed Dashboard cards v2");
