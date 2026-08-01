const fs = require('fs');
let code = fs.readFileSync('src/components/AttendanceTracker.tsx', 'utf8');

code = code.replace(
  'setStudents(samsDb.getStudents().filter(s => s.status !== \'archived\'));',
  'setStudents(samsDb.getStudents().filter(s => s.status === \'active\' && !s.is_archived));'
);

code = code.replace(
  'setClasses(samsDb.getClasses());',
  'setClasses(samsDb.getClasses().filter(c => !c.is_archived));'
);

fs.writeFileSync('src/components/AttendanceTracker.tsx', code);
