const fs = require('fs');
let code = fs.readFileSync('src/utils/db.ts', 'utf8');

// Find the saveAttendance function and inject AdminNotification code
const replaceTarget = `    saveToStorage(KEYS.ATTENDANCE, list);`;
const replaceWith = `    saveToStorage(KEYS.ATTENDANCE, list);

    if (status === 'absent') {
      const uStr = localStorage.getItem('sams_user');
      const uObj = uStr ? JSON.parse(uStr) : null;
      const uName = uObj?.name || 'مستخدم النظام';
      
      this.addAdminNotification({
        type: 'absence',
        message: \`سجلت السكرتيرة (\${uName}) غياب للطالب/ة (\${studentName})\`,
        metadata: { student_id, date, secretary: uName }
      });
    }`;

code = code.replace(replaceTarget, replaceWith);
fs.writeFileSync('src/utils/db.ts', code);
