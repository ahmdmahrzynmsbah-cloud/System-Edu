import re

with open('src/components/SuperAdminDashboard.tsx', 'r') as f:
    content = f.read()

# find useEffect block for load data
# It starts at: // Load and seed tenants and log on mount
# and ends at: // 2. Logs Load
start_idx = content.find('  // Load and seed tenants and log on mount')
end_idx = content.find('    // 2. Logs Load', start_idx)

if start_idx != -1 and end_idx != -1:
    old_block = content[start_idx:end_idx]
    
    new_block = """  // Load and seed tenants and log on mount
  useEffect(() => {
    // 1. Tenants Load
    const loadData = async () => {
      try {
        const dbTenants = await getAllTenants();
        if (dbTenants.length > 0) {
          setTenants(dbTenants);
          scanDatabaseIsolation(dbTenants);
        } else {
          // Check local storage first
          const savedTenants = localStorage.getItem('sams_system_tenants');
          let loadedTenants: Tenant[] = [];
          if (savedTenants) {
             loadedTenants = JSON.parse(savedTenants);
          } else {
            loadedTenants = [
              {
                id: 'tenant-1',
                name: 'الأستاذ أحمد كمال',
                phone: '01012345678',
                password: '123',
                status: 'active',
                joinedDate: '2026-06-01',
                expiryDate: '2026-12-31',
                appName: 'أكاديمية أحمد كمال للغة العربية',
                features: ['dashboard', 'students', 'classes', 'attendance', 'exams', 'fees', 'notifications', 'settings'],
                pricePaid: 1500,
                maxStudents: 100,
                maxSecretaries: 3,
                whatsappGatewayEnabled: true
              }
            ];
          }
          setTenants(loadedTenants);
          scanDatabaseIsolation(loadedTenants);
          await Promise.all(loadedTenants.map(t => saveTenant(t)));
        }
      } catch (err) {
        console.error("Failed to load tenants:", err);
      }
    };
    loadData();

    const unsubscribe = subscribeToTenants((updatedList) => {
      if (updatedList.length > 0) {
        setTenants(updatedList);
        scanDatabaseIsolation(updatedList);
      }
    });

"""
    content = content[:start_idx] + new_block + content[end_idx:]

    # Also fix the return () => unsubscribe();
    log_end = content.find('  }, []);', end_idx)
    
    content = content[:log_end] + "    return () => { if (unsubscribe) unsubscribe(); }\n" + content[log_end:]

with open('src/components/SuperAdminDashboard.tsx', 'w') as f:
    f.write(content)
