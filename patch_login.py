import re

with open('src/components/LoginScreen.tsx', 'r') as f:
    content = f.read()

import_str = "import { Shield, Lock, Eye, EyeOff, UserCircle2, ArrowRight } from 'lucide-react';"
new_import = import_str + "\nimport { getSystemUsersByTenant, getAllSystemUsers } from '../lib/usersApi';"
content = content.replace(import_str, new_import)

load_users_old = """  useEffect(() => {
    const loadUsers = () => {
      const saved = localStorage.getItem('sams_system_users');
      if (saved) {
        setUsers(JSON.parse(saved));
      } else {
        setUsers([
          { id: 'u-1', name: 'المدير الأكاديمي', role: 'teacher', password: '123', isDefault: true },
          { id: 'u-2', name: 'أ. سارة علي', role: 'secretary', password: '456', isDefault: true }
        ]);
      }
    };
    loadUsers();
  }, []);"""

load_users_new = """  useEffect(() => {
    const loadUsers = async () => {
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
        }
      }
    };
    loadUsers();
  }, []);"""
content = content.replace(load_users_old, load_users_new)

sec_logic_old = """    // 3. Check Secretary or sub-user across all Tenant databases
    if (role === 'secretary') {
      let matchedSec: any = null;
      let secTenantId = '';
      
      for (const tenant of tenants) {
        try {
          const tenantUsersRaw = localStorage.getItem(`${tenant.id}_sams_system_users`);
          if (tenantUsersRaw) {
            const tenantUsers = JSON.parse(tenantUsersRaw);
            const found = tenantUsers.find((u: any) => 
              u.role === 'secretary' && 
              u.password === trimmedPassword &&
              (!finalName || u.name.toLowerCase().includes(finalName.toLowerCase()))
            );
            if (found) {
              matchedSec = found;
              secTenantId = tenant.id;
              break;
            }
          }
        } catch (e) {}
      }

      if (matchedSec) {
        localStorage.setItem('sams_current_tenant_id', secTenantId);
        onLogin(matchedSec.role, matchedSec.permissions, matchedSec.name);
        return;
      }
    }"""
    
sec_logic_new = """    // 3. Check Secretary or sub-user across all Tenant databases via Firebase loaded users
    if (role === 'secretary') {
      let matchedSec: any = null;
      let secTenantId = '';

      // we use `users` state which now contains all users from Firebase
      const found = users.find((u: any) => 
        u.role === 'secretary' && 
        u.password === trimmedPassword &&
        (!finalName || u.name.toLowerCase().includes(finalName.toLowerCase()))
      );

      if (found) {
        matchedSec = found;
        secTenantId = found.tenantId || 'default';
      }

      if (matchedSec) {
        localStorage.setItem('sams_current_tenant_id', secTenantId);
        onLogin(matchedSec.role, matchedSec.permissions, matchedSec.name);
        return;
      }
    }"""
content = content.replace(sec_logic_old, sec_logic_new)

admin_logic_old = """    if (role === 'teacher') {
      let matchedAdmin: any = null;
      let adminTenantId = '';

      for (const tenant of tenants) {
        try {
          const tenantUsersRaw = localStorage.getItem(`${tenant.id}_sams_system_users`);
          if (tenantUsersRaw) {
            const tenantUsers = JSON.parse(tenantUsersRaw);
            const found = tenantUsers.find((u: any) => 
              u.role === 'teacher' && 
              u.password === trimmedPassword &&
              (!finalName || u.name.toLowerCase().includes(finalName.toLowerCase()))
            );
            if (found) {
              matchedAdmin = found;
              adminTenantId = tenant.id;
              break;
            }
          }
        } catch (e) {}
      }

      if (matchedAdmin) {
        localStorage.setItem('sams_current_tenant_id', adminTenantId);
        onLogin(matchedAdmin.role, matchedAdmin.permissions, matchedAdmin.name);
        return;
      }
    }"""

admin_logic_new = """    if (role === 'teacher') {
      let matchedAdmin: any = null;
      let adminTenantId = '';

      const found = users.find((u: any) => 
        u.role === 'teacher' && 
        u.password === trimmedPassword &&
        (!finalName || u.name.toLowerCase().includes(finalName.toLowerCase()))
      );

      if (found) {
        matchedAdmin = found;
        adminTenantId = found.tenantId || 'default';
      }

      if (matchedAdmin) {
        localStorage.setItem('sams_current_tenant_id', adminTenantId);
        onLogin(matchedAdmin.role, matchedAdmin.permissions, matchedAdmin.name);
        return;
      }
    }"""
content = content.replace(admin_logic_old, admin_logic_new)

with open('src/components/LoginScreen.tsx', 'w') as f:
    f.write(content)

