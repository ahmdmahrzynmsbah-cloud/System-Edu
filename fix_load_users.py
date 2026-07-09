import re

with open('src/components/SystemRoles.tsx', 'r') as f:
    content = f.read()

load_users_pattern = re.compile(r"const loadUsers = \(\) => \{.*?catch \(err\) \{.*?\}.*?\};", re.DOTALL)
new_load_users = """const loadUsers = async () => {
    const tenantId = localStorage.getItem('sams_current_tenant_id') || 'default';
    try {
      const dbUsers = await getSystemUsersByTenant(tenantId);
      if (dbUsers.length > 0) {
        setUsers(dbUsers);
      } else {
        const defaultUsers: SystemUser[] = [
          { id: 'u-1', name: 'المدير الأكاديمي', role: 'teacher', password: '123', isDefault: true, tenantId: tenantId },
          { id: 'u-2', name: 'أ. سارة علي', role: 'secretary', password: '456', isDefault: true, tenantId: tenantId }
        ];
        setUsers(defaultUsers);
        // Save defaults to Firebase
        await Promise.all(defaultUsers.map(u => saveSystemUser(u)));
      }
    } catch (err) {
      console.error('Failed to load users from Firebase:', err);
    }
  };"""

content = re.sub(load_users_pattern, new_load_users, content)

# Check for other tenantId redeclarations
content = content.replace("const tenantId = localStorage.getItem('sams_current_tenant_id') || 'default';", "const currentTenantId = localStorage.getItem('sams_current_tenant_id') || 'default';")
# But wait, we just added tenantId above. So let's replace back to tenantId where appropriate, or just rename them all correctly.
# Let's just fix the whole file by writing a robust python script.
