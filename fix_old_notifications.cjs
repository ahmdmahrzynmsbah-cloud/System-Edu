const fs = require('fs');
const path = require('path');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  useEffect(() => {
    // Load unread count on mount
    setAdminNotis(samsDb.getAdminNotifications());
  }, []);`;

const replacement = `  useEffect(() => {
    // FIX MIGRATION: Update old notifications that incorrectly said "سجلت السكرتيرة (مستخدم النظام)"
    let notis = samsDb.getAdminNotifications();
    let updated = false;
    notis = notis.map(n => {
      if (n.message && n.message.includes('سجلت السكرتيرة (مستخدم النظام)')) {
        n.message = n.message.replace('سجلت السكرتيرة (مستخدم النظام)', 'سجلت الإدارة (المدير الأكاديمي)');
        updated = true;
      }
      return n;
    });
    if (updated) {
      localStorage.setItem('sams_admin_notifications', JSON.stringify(notis));
    }
    
    // Load unread count on mount
    setAdminNotis(samsDb.getAdminNotifications());
  }, []);`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Migration added to App.tsx");
} else {
  console.log("Target not found");
}
