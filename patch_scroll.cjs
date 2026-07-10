const fs = require('fs');
let code = fs.readFileSync('src/components/ClassesManager.tsx', 'utf8');

code = code.replace(
  '<div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-slide-up">',
  '<div id="add-class-form" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-slide-up">'
);

code = code.replace(
  'window.scrollTo({ top: 0, behavior: \'smooth\' });',
  'setTimeout(() => { document.getElementById(\'add-class-form\')?.scrollIntoView({ behavior: \'smooth\', block: \'start\' }); }, 100);'
);

fs.writeFileSync('src/components/ClassesManager.tsx', code);
