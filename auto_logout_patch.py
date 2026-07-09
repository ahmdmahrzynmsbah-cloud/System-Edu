import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_hook = """  useEffect(() => {
    if (!currentUserRole || currentUserRole === 'super_admin') return;

    const tenantId = localStorage.getItem('sams_current_tenant_id');
    if (!tenantId || tenantId === 'default') return;

    const unsubscribe = subscribeToTenants((tenants) => {
      const currentTenant = tenants.find(t => t.id === tenantId);
      if (currentTenant && currentTenant.status === 'suspended') {
        setShowSuspendedModal(true);
      }
    });

    return () => unsubscribe();
  }, [currentUserRole]);"""

new_hook = """  useEffect(() => {
    if (!currentUserRole || currentUserRole === 'super_admin') return;

    const tenantId = localStorage.getItem('sams_current_tenant_id');
    if (!tenantId || tenantId === 'default') return;

    const unsubscribe = subscribeToTenants((tenants) => {
      const currentTenant = tenants.find(t => t.id === tenantId);
      if (currentTenant && currentTenant.status === 'suspended') {
        setShowSuspendedModal(true);
      }
    });

    return () => unsubscribe();
  }, [currentUserRole]);

  // Auto-logout effect when suspended
  useEffect(() => {
    if (showSuspendedModal) {
      const timer = setTimeout(() => {
        handleLogout();
        setShowSuspendedModal(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuspendedModal]);"""

content = content.replace(old_hook, new_hook)

with open('src/App.tsx', 'w') as f:
    f.write(content)
