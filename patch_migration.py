import re

with open('src/components/SuperAdminDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("""          const loadedTenants: Tenant[] = [
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
          setTenants(loadedTenants);
          scanDatabaseIsolation(loadedTenants);
          await Promise.all(loadedTenants.map(t => saveTenant(t)));""",
"""            {
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
          await Promise.all(loadedTenants.map(t => saveTenant(t)));""")

with open('src/components/SuperAdminDashboard.tsx', 'w') as f:
    f.write(content)
