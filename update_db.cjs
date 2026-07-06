const fs = require('fs');

let code = fs.readFileSync('src/utils/db.ts', 'utf8');

// Helper to replace text
function replace(target, replacement) {
  if (code.includes(target)) {
    code = code.replace(target, replacement);
  } else {
    console.error("Not found:", target.substring(0, 50));
  }
}

replace(
  `saveToStorage('sams_admin_notifications', list);
    return newNoti;`,
  `saveToStorage('sams_admin_notifications', list);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('sams_admin_notifications_changed'));
    return newNoti;`
);

replace(
  `list[idx].read = true;
      saveToStorage('sams_admin_notifications', list);`,
  `list[idx].read = true;
      saveToStorage('sams_admin_notifications', list);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('sams_admin_notifications_changed'));`
);

replace(
  `list.forEach(n => n.read = true);
    saveToStorage('sams_admin_notifications', list);`,
  `list.forEach(n => n.read = true);
    saveToStorage('sams_admin_notifications', list);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('sams_admin_notifications_changed'));`
);

fs.writeFileSync('src/utils/db.ts', code);
console.log("Updated db.ts");
