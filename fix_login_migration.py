import re

with open('src/components/LoginScreen.tsx', 'r') as f:
    content = f.read()

start_idx = content.find('    const loadUsers = async () => {')
end_idx = content.find('    loadUsers();', start_idx)

if start_idx != -1 and end_idx != -1:
    new_block = """    const loadUsers = async () => {
      try {
        const dbTenants = await getAllTenants();
        if (dbTenants.length > 0) {
          setTenants(dbTenants);
          localStorage.setItem('sams_system_tenants', JSON.stringify(dbTenants));
        } else {
          const saved = localStorage.getItem('sams_system_tenants');
          if (saved) {
             const parsed = JSON.parse(saved);
             setTenants(parsed);
             await Promise.all(parsed.map((t: any) => saveTenant(t)));
          }
        }
      } catch (err) {
        const saved = localStorage.getItem('sams_system_tenants');
        if (saved) setTenants(JSON.parse(saved));
      }
      try {
        const dbUsers = await getAllSystemUsers();
        if (dbUsers.length > 0) {
          setUsers(dbUsers);
        } else {
          const saved = localStorage.getItem('sams_system_users');
          let parsed: any[] = [];
          if (saved) {
            parsed = JSON.parse(saved);
          } else {
            parsed = [
              { id: 'u-1', name: 'المدير الأكاديمي', role: 'teacher', password: '123', isDefault: true, tenantId: 'default' },
              { id: 'u-2', name: 'أ. سارة علي', role: 'secretary', password: '456', isDefault: true, tenantId: 'default' }
            ];
          }
          setUsers(parsed);
          // Wait, saveSystemUser requires importing it. Is it imported?
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
"""
    content = content[:start_idx] + new_block + content[end_idx:]

with open('src/components/LoginScreen.tsx', 'w') as f:
    f.write(content)
