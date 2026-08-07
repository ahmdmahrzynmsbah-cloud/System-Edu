const fs = require('fs');
let code = fs.readFileSync('src/components/StudentBarcodes.tsx', 'utf8');

code = code.replace(
  /<div class="meta-row">المواعيد: <span style="font-size: 8px;">\$\{scheduleFormatted\}<\/span><\/div>/g,
  '<div class="meta-row">المواعيد: <span style="font-size: 8px;">${(classroom?.schedule_days || scheduleFormatted).substring(0, 30)}${(classroom?.schedule_days || scheduleFormatted).length > 30 ? \'...\' : \'\'}</span></div>'
);

fs.writeFileSync('src/components/StudentBarcodes.tsx', code);
