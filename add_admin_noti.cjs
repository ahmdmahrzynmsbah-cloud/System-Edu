const fs = require('fs');
let typesCode = fs.readFileSync('src/types.ts', 'utf8');

if (!typesCode.includes('AdminNotification')) {
  typesCode += `
export interface AdminNotification {
  id: string;
  type: 'absence' | 'payment_reminder' | 'system';
  message: string;
  created_at: string;
  read: boolean;
  metadata?: any;
}
`;
  fs.writeFileSync('src/types.ts', typesCode);
}

let dbCode = fs.readFileSync('src/utils/db.ts', 'utf8');
if (!dbCode.includes('getAdminNotifications')) {
  dbCode = dbCode.replace(/addNotification\(noti.*?\{[\s\S]*?return newNoti;\n  \},/m, 
    `$&

  // ADMIN NOTIFICATIONS
  getAdminNotifications(): import('../types').AdminNotification[] {
    return loadFromStorage<import('../types').AdminNotification[]>('sams_admin_notifications', []);
  },
  
  addAdminNotification(noti: Omit<import('../types').AdminNotification, 'id' | 'created_at' | 'read'>) {
    const list = this.getAdminNotifications();
    const newNoti: import('../types').AdminNotification = {
      ...noti,
      id: \`admin-notif-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`,
      created_at: new Date().toISOString(),
      read: false
    };
    list.unshift(newNoti); // add to top
    saveToStorage('sams_admin_notifications', list);
    return newNoti;
  },

  markAdminNotificationRead(id: string) {
    const list = this.getAdminNotifications();
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx].read = true;
      saveToStorage('sams_admin_notifications', list);
    }
  },
  
  markAllAdminNotificationsRead() {
    const list = this.getAdminNotifications();
    list.forEach(n => n.read = true);
    saveToStorage('sams_admin_notifications', list);
  },
`);
  fs.writeFileSync('src/utils/db.ts', dbCode);
}

