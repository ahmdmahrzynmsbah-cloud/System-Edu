import re

with open('src/components/SuperAdminDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("    // Dynamic database scanning\n    scanDatabaseIsolation(loadedTenants);\n", "")

with open('src/components/SuperAdminDashboard.tsx', 'w') as f:
    f.write(content)
