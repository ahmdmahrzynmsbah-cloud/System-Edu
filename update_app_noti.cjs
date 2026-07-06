const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('checkPaymentReminders')) {
  const importsToAdd = `import { AdminNotification } from './types';\nimport { Bell, CheckCheck, Trash2 } from 'lucide-react';\n`;
  code = code.replace(/import .*? 'lucide-react';/, match => match + '\n' + importsToAdd);

  const hookToAdd = `
  const [adminNotis, setAdminNotis] = useState<AdminNotification[]>([]);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);

  useEffect(() => {
    // Load initially
    setAdminNotis(samsDb.getAdminNotifications());

    // Check payment reminders
    const checkPaymentReminders = () => {
      const students = samsDb.getStudents().filter(s => s.status === 'active');
      const notifications = samsDb.getAdminNotifications();
      const today = new Date();
      let addedNew = false;
      
      students.forEach(student => {
        if (!student.created_at) return;
        
        let dueDate = new Date(student.created_at);
        // Advance to next due date
        while (dueDate <= today) {
           dueDate.setMonth(dueDate.getMonth() + 1);
        }
        
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        if (diffDays <= 5 && diffDays >= 0) {
          const reminderId = \`payment-\${student.id}-\${dueDate.toISOString().split('T')[0]}\`;
          const exists = notifications.some(n => n.metadata?.reminderId === reminderId);
          
          if (!exists) {
            samsDb.addAdminNotification({
              type: 'payment_reminder',
              message: \`تذكير: اقترب موعد سداد اشتراك الطالب/ة (\${student.name}). متبقي \${diffDays} يوم (تاريخ الاستحقاق: \${dueDate.toISOString().split('T')[0]}).\`,
              metadata: { student_id: student.id, reminderId }
            });
            addedNew = true;
          }
        }
      });
      
      if (addedNew) {
        setAdminNotis(samsDb.getAdminNotifications());
      }
    };
    
    checkPaymentReminders();
    
    // Poll every 30 seconds for new notifications (e.g. absence registered by someone else)
    const interval = setInterval(() => {
      setAdminNotis(samsDb.getAdminNotifications());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleMarkNotiRead = (id: string) => {
    samsDb.markAdminNotificationRead(id);
    setAdminNotis(samsDb.getAdminNotifications());
  };
  
  const handleMarkAllRead = () => {
    samsDb.markAllAdminNotificationsRead();
    setAdminNotis(samsDb.getAdminNotifications());
  };
  
  const unreadNotisCount = adminNotis.filter(n => !n.read).length;
`;

  code = code.replace(/const \[isSidebarCollapsed, setIsSidebarCollapsed\] = useState\(false\);/, match => match + '\n' + hookToAdd);

  const headerBellHtml = `
          {/* Notifications & User Details */}
          <div className="flex items-center gap-4">
            
            <div className="relative">
              <button 
                onClick={() => setShowNotiDropdown(!showNotiDropdown)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full cursor-pointer transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotisCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotiDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-[350px] bg-white border border-gray-150 rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col max-h-[400px]"
                    dir="rtl"
                  >
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                      <div className="font-bold text-slate-800 text-sm">الإشعارات</div>
                      {unreadNotisCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-xs text-[#0D5C8C] hover:text-sky-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          تحديد الكل كمقروء
                        </button>
                      )}
                    </div>
                    
                    <div className="overflow-y-auto flex-1 no-scrollbar p-2 space-y-1">
                      {adminNotis.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs font-sans">
                          لا توجد إشعارات حالياً
                        </div>
                      ) : (
                        adminNotis.map(noti => (
                          <div 
                            key={noti.id} 
                            className={\`p-3 rounded-xl border \${noti.read ? 'border-transparent opacity-60 bg-white' : 'border-blue-100 bg-blue-50/30'} flex gap-3 transition-colors text-right relative\`}
                          >
                            <div className={\`shrink-0 w-8 h-8 rounded-full flex items-center justify-center \${noti.type === 'absence' ? 'bg-orange-100 text-orange-600' : 'bg-rose-100 text-rose-600'}\`}>
                              {noti.type === 'absence' ? <Bell className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 space-y-1 pr-1">
                              <p className={\`text-xs leading-relaxed \${noti.read ? 'text-slate-600' : 'text-slate-900 font-bold'}\`}>
                                {noti.message}
                              </p>
                              <div className="text-[10px] text-slate-400 font-sans">
                                {new Date(noti.created_at).toLocaleDateString('ar-EG')} - {new Date(noti.created_at).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>
                            {!noti.read && (
                              <button 
                                onClick={() => handleMarkNotiRead(noti.id)}
                                className="absolute left-3 top-3 p-1.5 text-slate-400 hover:text-[#0D5C8C] hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                                title="تحديد كمقروء"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
`;

  code = code.replace(/<div className="hidden sm:flex items-center gap-2">/, headerBellHtml);
  
  fs.writeFileSync('src/App.tsx', code);
}
