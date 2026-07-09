import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Imports
imports_add = "import { db } from './lib/firebase';\nimport { doc, onSnapshot } from 'firebase/firestore';\n"
content = imports_add + content

# Sync hook
hook = """
  // Global Realtime Sync
  useEffect(() => {
    if (!currentUserRole || currentUserRole === 'super_admin') return;

    const tenantId = localStorage.getItem('sams_current_tenant_id');
    if (!tenantId || tenantId === 'default') return;

    const KEYS = [
      'sams_v2_students', 'sams_v2_teachers', 'sams_v2_classes', 'sams_v2_subjects',
      'sams_v2_grades', 'sams_v2_attendance', 'sams_v2_fees', 'sams_v2_notifications',
      'sams_v2_audit_logs', 'sams_v2_books', 'sams_v2_book_payments',
      'sams_v2_exams', 'sams_v2_assignments', 'sams_v2_exam_grades', 'sams_v2_assignment_grades'
    ];

    const unsubscribes = KEYS.map(baseKey => {
      const tenantKey = `${tenantId}_${baseKey}`;
      return onSnapshot(doc(db, 'system_tenant_data', tenantKey), (snap) => {
         if (snap.exists()) {
             const remoteData = snap.data().data;
             const localData = localStorage.getItem(tenantKey);
             if (remoteData && remoteData !== localData) {
                 localStorage.setItem(tenantKey, remoteData);
                 // Trigger refresh for all components
                 setRefreshTrigger(prev => prev + 1);
             }
         }
      });
    });

    return () => {
       unsubscribes.forEach(u => u());
    }
  }, [currentUserRole]);
"""

old_hook = "  // Auto-logout effect when suspended"
content = content.replace(old_hook, hook + "\n" + old_hook)

with open('src/App.tsx', 'w') as f:
    f.write(content)
