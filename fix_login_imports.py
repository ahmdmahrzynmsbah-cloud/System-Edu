import re

with open('src/components/LoginScreen.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'import { getAllTenants } from "../lib/tenantsApi";',
    'import { getAllTenants, saveTenant } from "../lib/tenantsApi";'
)

content = content.replace(
    'import { getAllSystemUsers } from "../lib/usersApi";',
    'import { getAllSystemUsers, saveSystemUser } from "../lib/usersApi";'
)

with open('src/components/LoginScreen.tsx', 'w') as f:
    f.write(content)
