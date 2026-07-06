const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  'div className={`p-5 rounded-2xl border shadow-xs',
  'div className={`p-5 rounded-2xl shadow-xs'
);

code = code.replace(
  "'bg-slate-50 border-slate-200 border-r-4 border-slate-400 text-slate-700'",
  "'bg-slate-50 border-2 border-slate-200 border-r-4 border-r-slate-400 text-slate-700'"
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log("Fixed Fees Card");
