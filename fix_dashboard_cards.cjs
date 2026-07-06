const fs = require('fs');

let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  'border border-gray-100 border-r-4 border-[#0D5C8C]',
  'border-2 border-[#0D5C8C]/20 border-r-4 border-r-[#0D5C8C]'
);

code = code.replace(
  'border border-gray-100 border-r-4 border-[#1A7FAA]',
  'border-2 border-[#1A7FAA]/20 border-r-4 border-r-[#1A7FAA]'
);

code = code.replace(
  'border border-gray-100 border-r-4 border-yellow-400',
  'border-2 border-yellow-400/50 border-r-4 border-r-yellow-400'
);

code = code.replace(
  "bg-[#FEF2F2] border-red-100 border-r-4 border-[#C0152A] text-[#C0152A]",
  "bg-[#FEF2F2] border-2 border-red-200 border-r-4 border-r-[#C0152A] text-[#C0152A]"
);

code = code.replace(
  "bg-emerald-50 border-emerald-100 border-r-4 border-emerald-600 text-emerald-800",
  "bg-emerald-50 border-2 border-emerald-200 border-r-4 border-r-emerald-600 text-emerald-800"
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log("Fixed Dashboard cards");
