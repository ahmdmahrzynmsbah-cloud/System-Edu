const fs = require('fs');
let code = fs.readFileSync('src/utils/db.ts', 'utf8');

const classArchiveMethods = `
  archiveClass(id: string) {
    const classes = this.getClasses();
    const idx = classes.findIndex(c => c.id === id);
    if (idx !== -1) {
      classes[idx].is_archived = true;
      classes[idx].archived_at = new Date().toISOString();
      saveToStorage(KEYS.CLASSES, classes);
      addAuditLog('UPDATE', 'classes', id, \`أرشفة المجموعة الدراسية: \${classes[idx].name}\`);
    }
  },
  restoreClass(id: string) {
    const classes = this.getClasses();
    const idx = classes.findIndex(c => c.id === id);
    if (idx !== -1) {
      classes[idx].is_archived = false;
      delete classes[idx].archived_at;
      saveToStorage(KEYS.CLASSES, classes);
      addAuditLog('UPDATE', 'classes', id, \`استعادة المجموعة الدراسية من الأرشيف: \${classes[idx].name}\`);
    }
  },
`;

code = code.replace('deleteClass(id: string)', classArchiveMethods + '  deleteClass(id: string)');

const studentArchiveMethods = `
  archiveStudent(id: string) {
    const students = this.getStudents();
    const idx = students.findIndex(s => s.id === id);
    if (idx !== -1) {
      students[idx].is_archived = true;
      students[idx].archived_at = new Date().toISOString();
      saveToStorage(KEYS.STUDENTS, students);
      addAuditLog('UPDATE', 'students', id, \`أرشفة بيانات الطالب: \${students[idx].name}\`);
    }
  },
  restoreStudent(id: string) {
    const students = this.getStudents();
    const idx = students.findIndex(s => s.id === id);
    if (idx !== -1) {
      students[idx].is_archived = false;
      delete students[idx].archived_at;
      saveToStorage(KEYS.STUDENTS, students);
      addAuditLog('UPDATE', 'students', id, \`استعادة بيانات الطالب من الأرشيف: \${students[idx].name}\`);
    }
  },
`;

code = code.replace('deleteStudent(id: string)', studentArchiveMethods + '  deleteStudent(id: string)');

fs.writeFileSync('src/utils/db.ts', code);
