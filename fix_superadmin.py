import re

with open('src/components/SuperAdminDashboard.tsx', 'r') as f:
    c = f.read()

c = c.replace("tenantId: newTenant.id,", "tenantId: prefix.replace('_', ''),")

with open('src/components/SuperAdminDashboard.tsx', 'w') as f:
    f.write(c)
