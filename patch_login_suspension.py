import re

with open('src/components/LoginScreen.tsx', 'r') as f:
    content = f.read()

# 2b
old_2b = """      if (found) {
        localStorage.setItem('sams_current_tenant_id', found.tenantId || 'default');
        onLoginSuccess('teacher', found.name, found.id);
        return;
      }"""
new_2b = """      if (found) {
        const secTenantId = found.tenantId || 'default';
        const secTenant = tenants.find(t => t.id === secTenantId);
        if (secTenant && secTenant.status === 'suspended') {
            setError('تم إيقاف هذا الحساب مؤقتاً من قبل الإدارة العامة. يرجى مراجعة الدعم الفني لتفعيل الاشتراك.');
            return;
        }
        localStorage.setItem('sams_current_tenant_id', secTenantId);
        onLoginSuccess('teacher', found.name, found.id);
        return;
      }"""
content = content.replace(old_2b, new_2b)

# 3
old_3 = """      if (matchedSec) {
        localStorage.setItem('sams_current_tenant_id', secTenantId);
        onLoginSuccess('secretary', matchedSec.name, matchedSec.id);
        return;
      }"""
new_3 = """      if (matchedSec) {
        const secTenant = tenants.find(t => t.id === secTenantId);
        if (secTenant && secTenant.status === 'suspended') {
            setError('تم إيقاف هذا الحساب مؤقتاً من قبل الإدارة العامة. يرجى مراجعة الدعم الفني لتفعيل الاشتراك.');
            return;
        }
        localStorage.setItem('sams_current_tenant_id', secTenantId);
        onLoginSuccess('secretary', matchedSec.name, matchedSec.id);
        return;
      }"""
content = content.replace(old_3, new_3)

# 4
old_4 = """    if (matchedUser) {
      localStorage.setItem('sams_current_tenant_id', 'default');
      onLoginSuccess(role, finalName || matchedUser.name, matchedUser.id);
    } else {"""
new_4 = """    if (matchedUser) {
      const secTenantId = matchedUser.tenantId || 'default';
      const secTenant = tenants.find(t => t.id === secTenantId);
      if (secTenant && secTenant.status === 'suspended') {
          setError('تم إيقاف هذا الحساب مؤقتاً من قبل الإدارة العامة. يرجى مراجعة الدعم الفني لتفعيل الاشتراك.');
          return;
      }
      localStorage.setItem('sams_current_tenant_id', secTenantId);
      onLoginSuccess(role, finalName || matchedUser.name, matchedUser.id);
    } else {"""
content = content.replace(old_4, new_4)

with open('src/components/LoginScreen.tsx', 'w') as f:
    f.write(content)
