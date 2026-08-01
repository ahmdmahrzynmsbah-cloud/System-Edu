const fs = require('fs');
let code = fs.readFileSync('src/utils/db.ts', 'utf8');

code = code.replace(
  'getStudents(includeArchivedOrSuspended = true): Student[] {\n    const students = loadFromStorage<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS);\n    // filter soft deletions\n    return students.filter(s => !s.deleted_at);\n  }',
  'getStudents(includeArchived = false): Student[] {\n    const students = loadFromStorage<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS);\n    // filter soft deletions\n    return students.filter(s => !s.deleted_at && (includeArchived || !s.is_archived));\n  }'
);

code = code.replace(
  'getClasses(): ClassRoom[] {\n    return loadFromStorage<ClassRoom[]>(KEYS.CLASSES, INITIAL_CLASSES);\n  }',
  'getClasses(includeArchived = false): ClassRoom[] {\n    const classes = loadFromStorage<ClassRoom[]>(KEYS.CLASSES, INITIAL_CLASSES);\n    return classes.filter(c => includeArchived || !c.is_archived);\n  }'
);

fs.writeFileSync('src/utils/db.ts', code);
