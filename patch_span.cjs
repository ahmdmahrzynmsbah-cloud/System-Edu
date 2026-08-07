const fs = require('fs');
let code = fs.readFileSync('src/components/ClassesManager.tsx', 'utf8');

code = code.replace(
  '<span className="flex items-center gap-1.5 font-sans">\n                    <Calendar className="w-4 h-4 text-slate-400" />\n                    مواعيد المجموعة\n                  </span>',
  '<span className="flex items-center gap-1.5 font-sans whitespace-nowrap shrink-0">\n                    <Calendar className="w-4 h-4 text-slate-400" />\n                    مواعيد المجموعة\n                  </span>'
);

fs.writeFileSync('src/components/ClassesManager.tsx', code);
