import re

with open('src/components/SettingsManager.tsx', 'r') as f:
    c = f.read()

if 'import { saveTenant }' not in c:
    c = "import { saveTenant } from '../lib/tenantsApi';\n" + c

with open('src/components/SettingsManager.tsx', 'w') as f:
    f.write(c)

with open('src/components/SuperAdminDashboard.tsx', 'r') as f:
    c = f.read()

c = c.replace("tenantId: id", "tenantId: name")
with open('src/components/SuperAdminDashboard.tsx', 'w') as f:
    f.write(c)
