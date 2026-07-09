import re

with open('src/components/LoginScreen.tsx', 'r') as f:
    content = f.read()

# 1. We want to update the secretary login logic
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
        onLoginSuccess('secretary', matchedSec.name, matchedSec.id);
        return;
      }
    }"""

sec_logic_new = """    // 3. Check Secretary across all Firebase users
    if (role === 'secretary') {
      let matchedSec: any = null;
      let secTenantId = '';

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
        onLoginSuccess('secretary', matchedSec.name, matchedSec.id);
        return;
      }
    }"""

content = content.replace(sec_logic_old, sec_logic_new)

# 2. We want to allow teachers added to system_users to log in as teacher too.
# There is a block:
#     // 2. Check Teacher role against Tenants
# We should also check users from Firebase

teacher_logic_old = """    // 2. Check Teacher role against Tenants
    if (role === 'teacher') {
      const matchedTenant = tenants.find(t => {
        const passMatch = t.password === trimmedPassword;
        if (!passMatch) return false;
        if (finalName) {
          return t.name.toLowerCase().includes(finalName.toLowerCase());
        }
        return true;
      });

      if (matchedTenant) {
        if (matchedTenant.status === 'suspended') {
          setError('تم إيقاف هذا الحساب مؤقتاً من قبل الإدارة العامة. يرجى مراجعة الدعم الفني لتفعيل الاشتراك.');
          return;
        }
        if (matchedTenant.expiryDate) {
          const today = new Date();
          today.setHours(0,0,0,0);
          const exp = new Date(matchedTenant.expiryDate);
          if (exp < today) {
            setError(`انتهت صلاحية اشتراك هذا الحساب بتاريخ ${matchedTenant.expiryDate}. يرجى مراجعة الإدارة العامة لتمديد الاشتراك.`);
            return;
          }
        }
        // Active Tenant!
        localStorage.setItem('sams_current_tenant_id', matchedTenant.id);
        if (matchedTenant.appName) {
          localStorage.setItem(`${matchedTenant.id}_sams_custom_app_name_v2`, matchedTenant.appName);
        }
        onLoginSuccess('teacher', matchedTenant.name, matchedTenant.id);
        return;
      }
    }"""

teacher_logic_new = teacher_logic_old + """

    // 2b. Check Teacher role against Firebase users (created from SystemRoles)
    if (role === 'teacher') {
      const found = users.find((u: any) => 
        u.role === 'teacher' && 
        u.password === trimmedPassword &&
        (!finalName || u.name.toLowerCase().includes(finalName.toLowerCase()))
      );
      if (found) {
        localStorage.setItem('sams_current_tenant_id', found.tenantId || 'default');
        onLoginSuccess('teacher', found.name, found.id);
        return;
      }
    }
"""
content = content.replace(teacher_logic_old, teacher_logic_new)

with open('src/components/LoginScreen.tsx', 'w') as f:
    f.write(content)

