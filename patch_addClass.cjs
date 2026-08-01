const fs = require('fs');
let code = fs.readFileSync('src/utils/db.ts', 'utf8');

code = code.replace(
  'addClass(cls: ClassRoom) {\n    const classes = this.getClasses();\n    classes.push(cls);\n    saveToStorage(KEYS.CLASSES, classes);\n    addAuditLog(\'INSERT\', \'classes\', cls.id, \`إنشاء مجموعة دراسي جديد: \${cls.name}\`);\n  },',
  'addClass(cls: ClassRoom) {\n    const classes = loadFromStorage<ClassRoom[]>(KEYS.CLASSES, INITIAL_CLASSES);\n    classes.push(cls);\n    saveToStorage(KEYS.CLASSES, classes);\n    addAuditLog(\'INSERT\', \'classes\', cls.id, \`إنشاء مجموعة دراسي جديد: \${cls.name}\`);\n  },'
);

code = code.replace(
  'updateClass(updatedCls: ClassRoom) {\n    const classes = this.getClasses();',
  'updateClass(updatedCls: ClassRoom) {\n    const classes = loadFromStorage<ClassRoom[]>(KEYS.CLASSES, INITIAL_CLASSES);'
);

code = code.replace(
  'archiveClass(id: string) {\n    const classes = this.getClasses();',
  'archiveClass(id: string) {\n    const classes = loadFromStorage<ClassRoom[]>(KEYS.CLASSES, INITIAL_CLASSES);'
);

code = code.replace(
  'restoreClass(id: string) {\n    const classes = this.getClasses();',
  'restoreClass(id: string) {\n    const classes = loadFromStorage<ClassRoom[]>(KEYS.CLASSES, INITIAL_CLASSES);'
);

code = code.replace(
  'archiveStudent(id: string) {\n    const students = this.getStudents();',
  'archiveStudent(id: string) {\n    const students = loadFromStorage<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS);'
);

code = code.replace(
  'restoreStudent(id: string) {\n    const students = this.getStudents();',
  'restoreStudent(id: string) {\n    const students = loadFromStorage<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS);'
);


fs.writeFileSync('src/utils/db.ts', code);
