const fs = require('fs');
let code = fs.readFileSync('src/components/ClassesManager.tsx', 'utf8');

code = code.replace(
  'تأسيس المجموعة الدراسية',
  '{editingClassId ? "تحديث بيانات المجموعة" : "تأسيس المجموعة الدراسية"}'
);

fs.writeFileSync('src/components/ClassesManager.tsx', code);
