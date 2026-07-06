const fs = require('fs');

let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  /className="bg-white p-5 rounded-2xl border-2 border-indigo-200 border-r-4 border-r-indigo-600 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer"/g,
  'className="bg-white p-5 rounded-2xl border border-[#0D5C8C] border-r-4 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer"'
);

code = code.replace(
  /className="bg-white p-5 rounded-2xl border-2 border-sky-200 border-r-4 border-r-sky-500 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer"/g,
  'className="bg-white p-5 rounded-2xl border border-[#1A7FAA] border-r-4 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer"'
);

code = code.replace(
  /className="bg-white p-5 rounded-2xl border-2 border-yellow-300 border-r-4 border-r-yellow-500 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer"/g,
  'className="bg-white p-5 rounded-2xl border border-yellow-400 border-r-4 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer"'
);

code = code.replace(
  /bg-slate-50 border-2 border-slate-200 border-r-4 border-r-slate-400 text-slate-700/g,
  'bg-slate-50 border border-slate-400 border-r-4 text-slate-700'
);

code = code.replace(
  /bg-\[\#FEF2F2\] border-2 border-red-200 border-r-4 border-r-\[\#C0152A\] text-\[\#C0152A\]/g,
  'bg-[#FEF2F2] border border-[#C0152A] border-r-4 text-[#C0152A]'
);

code = code.replace(
  /bg-emerald-50 border-2 border-emerald-200 border-r-4 border-r-emerald-600 text-emerald-800/g,
  'bg-emerald-50 border border-emerald-600 border-r-4 text-emerald-800'
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log("Fixed borders");
