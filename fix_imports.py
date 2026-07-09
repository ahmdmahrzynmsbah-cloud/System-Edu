import re

def fix(file, imp):
    with open(file, 'r') as f:
        c = f.read()
    if 'saveToStorage' not in c.split('import ')[1].split('from')[0]:
        c = c.replace(imp, imp.replace('}', ', saveToStorage }'))
    with open(file, 'w') as f:
        f.write(c)

fix('src/components/NotificationsCenter.tsx', "import { samsDb, addAuditLog, getTenantSetting } from '../utils/db';")
fix('src/components/SettingsManager.tsx', "import { addAuditLog, getTenantSetting } from '../utils/db';")
fix('src/components/ExamsAndAssignments.tsx', "import { samsDb } from '../utils/db';")

# SuperAdminDashboard fixes
with open('src/components/SuperAdminDashboard.tsx', 'r') as f:
    c = f.read()

# Fix 'id' usage instead of 'newTenant.id'
c = c.replace("tenantId: id,", "tenantId: newTenant.id,")
c = c.replace("tenantId: id, // from setFb", "tenantId: name,")

with open('src/components/SuperAdminDashboard.tsx', 'w') as f:
    f.write(c)
