import re

with open('src/components/SystemRoles.tsx', 'r') as f:
    content = f.read()

old_use_effect = """  useEffect(() => {
    loadUsers();
  }, []);"""

new_use_effect = """  useEffect(() => {
    const currentTenantId = localStorage.getItem('sams_current_tenant_id') || 'default';
    const unsubscribe = subscribeToSystemUsers(currentTenantId, (dbUsers) => {
      if (dbUsers.length > 0) {
        setUsers(dbUsers);
      } else {
        // Fallback to local storage migration if no users exist in db
        loadUsers();
      }
    });
    return () => unsubscribe();
  }, []);"""

content = content.replace(old_use_effect, new_use_effect)

with open('src/components/SystemRoles.tsx', 'w') as f:
    f.write(content)
