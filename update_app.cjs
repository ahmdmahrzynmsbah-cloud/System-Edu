const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `    // Poll every 30 seconds for new notifications (e.g. absence registered by someone else)
    const interval = setInterval(() => {
      setAdminNotis(samsDb.getAdminNotifications());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);`;

const replacement1 = `    // Real-time notifications update
    const updateNotis = () => {
      setAdminNotis(samsDb.getAdminNotifications());
    };
    
    window.addEventListener('sams_admin_notifications_changed', updateNotis);
    
    const handleStorage = (e) => {
      if (e.key === 'sams_admin_notifications') {
        updateNotis();
      }
    };
    window.addEventListener('storage', handleStorage);
    
    // Fallback poll just in case
    const interval = setInterval(updateNotis, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('sams_admin_notifications_changed', updateNotis);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);`;

if (code.includes(target1)) {
  code = code.replace(target1, replacement1);
} else {
  console.log("target1 not found in App.tsx");
}

const target2 = `  const unreadNotisCount = adminNotis.filter(n => !n.read).length;`;

const replacement2 = `  const displayedNotis = currentUserRole === 'secretary'
    ? adminNotis.filter(n => !(n.message && n.message.includes('سجلت الإدارة')))
    : adminNotis;

  const unreadNotisCount = displayedNotis.filter(n => !n.read).length;`;

if (code.includes(target2)) {
  code = code.replace(target2, replacement2);
} else {
  console.log("target2 not found in App.tsx");
}

const target3 = `                        {adminNotis.length > 0 ? (
                          adminNotis.map(noti => (`;
const replacement3 = `                        {displayedNotis.length > 0 ? (
                          displayedNotis.map(noti => (`;

if (code.includes(target3)) {
  code = code.replace(target3, replacement3);
} else {
  console.log("target3 not found in App.tsx");
}

const target4 = `{adminNotis.length === 0 && (`;
const replacement4 = `{displayedNotis.length === 0 && (`;

if (code.includes(target4)) {
  code = code.replace(target4, replacement4);
} else {
  console.log("target4 not found in App.tsx");
}

fs.writeFileSync('src/App.tsx', code);
console.log("Updated App.tsx");
