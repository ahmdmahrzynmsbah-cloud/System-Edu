import re

with open('src/components/SystemRoles.tsx', 'r') as f:
    content = f.read()

start_idx = content.find('  const loadUsers = async () => {')
end_idx = content.find('  const saveUsers = async', start_idx)

if start_idx != -1 and end_idx != -1:
    new_block = """  const loadUsers = async () => {
    const currentTenantId = localStorage.getItem('sams_current_tenant_id') || 'default';
    try {
      const dbUsers = await getSystemUsersByTenant(currentTenantId);
      if (dbUsers.length > 0) {
        setUsers(dbUsers);
      } else {
        // Fallback to local storage migration
        const saved = localStorage.getItem(`${currentTenantId}_sams_system_users`) || localStorage.getItem('sams_system_users');
        let defaultUsers: SystemUser[] = [];
        if (saved) {
           defaultUsers = JSON.parse(saved);
        } else {
           defaultUsers = [
            { id: 'u-1', name: 'المدير الأكاديمي', role: 'teacher', password: '123', isDefault: true, tenantId: currentTenantId },
            { id: 'u-2', name: 'أ. سارة علي', role: 'secretary', password: '456', isDefault: true, tenantId: currentTenantId }
          ];
        }
        
        // Ensure tenantId is set for all migrated users
        defaultUsers = defaultUsers.map(u => ({...u, tenantId: currentTenantId}));
        
        setUsers(defaultUsers);
        // Save defaults to Firebase
        await Promise.all(defaultUsers.map(u => saveSystemUser(u)));
      }
    } catch (err) {
      console.error('Failed to load users from Firebase:', err);
    }
  };

"""
    content = content[:start_idx] + new_block + content[end_idx:]

with open('src/components/SystemRoles.tsx', 'w') as f:
    f.write(content)
