import re

with open('src/components/LoginScreen.tsx', 'r') as f:
    content = f.read()

import_str = "import { Shield, Lock, Eye, EyeOff, UserCircle2, ArrowRight } from 'lucide-react';"
new_import = import_str + "\nimport { getSystemUsersByTenant, getAllSystemUsers } from '../lib/usersApi';"
if "getAllSystemUsers" not in content:
    content = content.replace(import_str, new_import)

# Find the loadUsers block exactly using regex
load_users_pattern = re.compile(r"const loadUsers = \(\) => \{.*?\};.*?loadUsers\(\);", re.DOTALL)
new_load_users = """const loadUsers = async () => {
      try {
        const dbUsers = await getAllSystemUsers();
        if (dbUsers.length > 0) {
          setUsers(dbUsers);
        } else {
          setUsers([
            { id: 'u-1', name: 'المدير الأكاديمي', role: 'teacher', password: '123', isDefault: true, tenantId: 'default' },
            { id: 'u-2', name: 'أ. سارة علي', role: 'secretary', password: '456', isDefault: true, tenantId: 'default' }
          ]);
        }
      } catch (err) {
        // Fallback
        const saved = localStorage.getItem('sams_system_users');
        if (saved) {
          setUsers(JSON.parse(saved));
        } else {
          setUsers([
            { id: 'u-1', name: 'المدير الأكاديمي', role: 'teacher', password: '123', isDefault: true },
            { id: 'u-2', name: 'أ. سارة علي', role: 'secretary', password: '456', isDefault: true }
          ]);
        }
      }
    };
    loadUsers();"""

content = re.sub(load_users_pattern, new_load_users, content)

with open('src/components/LoginScreen.tsx', 'w') as f:
    f.write(content)

