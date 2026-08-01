const fs = require('fs');
let code = fs.readFileSync('src/components/StudentsList.tsx', 'utf8');

code = code.replace(
  /استعادة من الأرشيف/g,
  'إعادة تفعيل الطالب'
);

code = code.replace(
  /استعادة الطالب/g,
  'إعادة تفعيل الطالب'
);

code = code.replace(
  /تأكيد الاستعادة/g,
  'تأكيد إعادة التفعيل'
);

fs.writeFileSync('src/components/StudentsList.tsx', code);
