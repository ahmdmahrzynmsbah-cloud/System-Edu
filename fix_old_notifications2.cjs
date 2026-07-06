const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  useEffect(() => {
    // Load initially
    setAdminNotis(samsDb.getAdminNotifications());`;

const replacement = `  useEffect(() => {
    // FIX MIGRATION: Update old notifications
    let notisData = samsDb.getAdminNotifications();
    let updatedNotis = false;
    notisData = notisData.map(n => {
      if (n.message && n.message.includes('سجلت السكرتيرة (مستخدم النظام)')) {
        n.message = n.message.replace('سجلت السكرتيرة (مستخدم النظام)', 'سجلت الإدارة (المدير الأكاديمي)');
        updatedNotis = true;
      }
      return n;
    });
    if (updatedNotis) {
      localStorage.setItem('sams_admin_notifications', JSON.stringify(notisData));
    }

    // Load initially
    setAdminNotis(samsDb.getAdminNotifications());`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Migration added to App.tsx");
} else {
  console.log("Target not found");
}
