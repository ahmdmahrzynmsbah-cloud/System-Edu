const fs = require('fs');
let code = fs.readFileSync('src/utils/db.ts', 'utf8');

const updateClassStr = `
  updateClass(updatedCls: ClassRoom) {
    const classes = this.getClasses();
    const idx = classes.findIndex(c => c.id === updatedCls.id);
    if (idx !== -1) {
      classes[idx] = updatedCls;
      saveToStorage(KEYS.CLASSES, classes);
      addAuditLog('UPDATE', 'classes', updatedCls.id, \`تحديث بيانات المجموعة الدراسية: \${updatedCls.name}\`);
    }
  },
`;

code = code.replace('deleteClass(id: string)', updateClassStr + '  deleteClass(id: string)');
fs.writeFileSync('src/utils/db.ts', code);
