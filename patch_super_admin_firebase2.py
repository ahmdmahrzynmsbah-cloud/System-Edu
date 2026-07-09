import re

with open('src/components/SuperAdminDashboard.tsx', 'r') as f:
    content = f.read()

load_tenants_old = """    const savedTenants = localStorage.getItem('sams_system_tenants');
    let loadedTenants: Tenant[] = [];
    if (savedTenants) {
      loadedTenants = JSON.parse(savedTenants);
    } else {
      // Seed default teachers
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
      localStorage.setItem('sams_system_tenants', JSON.stringify(loadedTenants));
    }
    setTenants(loadedTenants);
    scanDatabaseIsolation(loadedTenants);"""

load_tenants_new = """    const loadData = async () => {
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

if load_tenants_old in content:
    content = content.replace(load_tenants_old, load_tenants_new)
else:
    print("load_tenants_old NOT FOUND")

with open('src/components/SuperAdminDashboard.tsx', 'w') as f:
    f.write(content)
