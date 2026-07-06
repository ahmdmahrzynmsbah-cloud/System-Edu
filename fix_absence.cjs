const fs = require('fs');
let code = fs.readFileSync('src/utils/db.ts', 'utf8');

const target = `    if (status === 'absent') {
      const uStr = localStorage.getItem('sams_user');
      const uObj = uStr ? JSON.parse(uStr) : null;
      const uName = uObj?.name || 'مستخدم النظام';
      
      this.addAdminNotification({
        type: 'absence',
        message: \`سجلت السكرتيرة (\${uName}) غياب للطالب/ة (\${studentName})\`,
        metadata: { student_id, date, secretary: uName }
      });
    }`;

const replacement = `    if (status === 'absent') {
      const loggedInRole = localStorage.getItem('sams_logged_in_role') || 'admin';
      const loggedInName = localStorage.getItem('sams_logged_in_name') || 'مستخدم النظام';
      const roleText = (loggedInRole === 'secretary' || loggedInName.includes('سارة') || loggedInName.includes('سكرتيرة')) ? 'السكرتيرة' : 'الإدارة';
      
      this.addAdminNotification({
        type: 'absence',
        message: \`سجلت \${roleText} (\${loggedInName}) غياب للطالب/ة (\${studentName})\`,
        metadata: { student_id, date, actor: loggedInName }
      });
    }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/utils/db.ts', code);
  console.log("Successfully replaced in db.ts");
} else {
  console.log("Target string not found in db.ts");
}
