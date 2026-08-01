const fs = require('fs');
let code = fs.readFileSync('src/components/StudentsList.tsx', 'utf8');

const filteredStudentsLogicOld = 'const matchesStatus = statusFilter === \'all\' || s.status === statusFilter;';
const filteredStudentsLogicNew = `const isArchived = s.is_archived === true;
    if (viewArchivedStudents && !isArchived) return false;
    if (!viewArchivedStudents && isArchived) return false;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;`;

code = code.replace(filteredStudentsLogicOld, filteredStudentsLogicNew);
fs.writeFileSync('src/components/StudentsList.tsx', code);
