import re

with open('src/components/LoginScreen.tsx', 'r') as f:
    content = f.read()

def replace_block(content, target, replacement):
    if target in content:
        return content.replace(target, replacement)
    return content

target_2b = """      if (found) {
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
repl_2b = """      if (found) {
        const secTenantId = found.tenantId || 'default';
        if (secTenantId !== 'default') {
            const secTenant = tenants.find(t => t.id === secTenantId);
            if (!secTenant) {
                setError('يرجى الانتظار، جاري المزامنة. حاول مجدداً.');
                return;
            }
            if (secTenant.status === 'suspended') {
                setError('تم إيقاف هذا الحساب مؤقتاً من قبل الإدارة العامة. يرجى مراجعة الدعم الفني لتفعيل الاشتراك.');
                return;
            }
        }
        localStorage.setItem('sams_current_tenant_id', secTenantId);
        onLoginSuccess('teacher', found.name, found.id);
        return;
      }"""
content = replace_block(content, target_2b, repl_2b)

target_3 = """      if (matchedSec) {
        const secTenant = tenants.find(t => t.id === secTenantId);
        if (secTenant && secTenant.status === 'suspended') {
            setError('تم إيقاف هذا الحساب مؤقتاً من قبل الإدارة العامة. يرجى مراجعة الدعم الفني لتفعيل الاشتراك.');
            return;
        }
        localStorage.setItem('sams_current_tenant_id', secTenantId);
        onLoginSuccess('secretary', matchedSec.name, matchedSec.id);
        return;
      }"""
repl_3 = """      if (matchedSec) {
        if (secTenantId !== 'default') {
            const secTenant = tenants.find(t => t.id === secTenantId);
            if (!secTenant) {
                setError('يرجى الانتظار، جاري المزامنة. حاول مجدداً.');
                return;
            }
            if (secTenant.status === 'suspended') {
                setError('تم إيقاف هذا الحساب مؤقتاً من قبل الإدارة العامة. يرجى مراجعة الدعم الفني لتفعيل الاشتراك.');
                return;
            }
        }
        localStorage.setItem('sams_current_tenant_id', secTenantId);
        onLoginSuccess('secretary', matchedSec.name, matchedSec.id);
        return;
      }"""
content = replace_block(content, target_3, repl_3)

target_4 = """    if (matchedUser) {
      const secTenantId = matchedUser.tenantId || 'default';
      const secTenant = tenants.find(t => t.id === secTenantId);
      if (secTenant && secTenant.status === 'suspended') {
          setError('تم إيقاف هذا الحساب مؤقتاً من قبل الإدارة العامة. يرجى مراجعة الدعم الفني لتفعيل الاشتراك.');
          return;
      }
      localStorage.setItem('sams_current_tenant_id', secTenantId);
      onLoginSuccess(role, finalName || matchedUser.name, matchedUser.id);
    } else {"""
repl_4 = """    if (matchedUser) {
      const secTenantId = matchedUser.tenantId || 'default';
      if (secTenantId !== 'default') {
          const secTenant = tenants.find(t => t.id === secTenantId);
          if (!secTenant) {
              setError('يرجى الانتظار، جاري المزامنة. حاول مجدداً.');
              return;
          }
          if (secTenant.status === 'suspended') {
              setError('تم إيقاف هذا الحساب مؤقتاً من قبل الإدارة العامة. يرجى مراجعة الدعم الفني لتفعيل الاشتراك.');
              return;
          }
      }
      localStorage.setItem('sams_current_tenant_id', secTenantId);
      onLoginSuccess(role, finalName || matchedUser.name, matchedUser.id);
    } else {"""
content = replace_block(content, target_4, repl_4)

with open('src/components/LoginScreen.tsx', 'w') as f:
    f.write(content)
