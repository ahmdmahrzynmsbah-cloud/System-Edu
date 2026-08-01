const fs = require('fs');

let classesCode = fs.readFileSync('src/components/ClassesManager.tsx', 'utf8');
classesCode = classesCode.replace('setClasses(samsDb.getClasses());', 'setClasses(samsDb.getClasses(true));');
classesCode = classesCode.replace('setStudents(samsDb.getStudents());', 'setStudents(samsDb.getStudents(true));');
fs.writeFileSync('src/components/ClassesManager.tsx', classesCode);

let studentsCode = fs.readFileSync('src/components/StudentsList.tsx', 'utf8');
studentsCode = studentsCode.replace('setClasses(samsDb.getClasses());', 'setClasses(samsDb.getClasses(true));');
studentsCode = studentsCode.replace('setStudents(samsDb.getStudents());', 'setStudents(samsDb.getStudents(true));');
fs.writeFileSync('src/components/StudentsList.tsx', studentsCode);

