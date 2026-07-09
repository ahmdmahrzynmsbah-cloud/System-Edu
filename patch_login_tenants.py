import re

with open('src/components/LoginScreen.tsx', 'r') as f:
    content = f.read()

import_str = "import { getSystemUsersByTenant, getAllSystemUsers } from '../lib/usersApi';"
new_import = "import { getSystemUsersByTenant, getAllSystemUsers } from '../lib/usersApi';\nimport { getAllTenants } from '../lib/tenantsApi';"

if "getAllTenants" not in content:
    content = content.replace(import_str, new_import)

# Add tenants state
state_old = """  const [users, setUsers] = useState<any[]>([]);"""
state_new = """  const [users, setUsers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);"""
content = content.replace(state_old, state_new)

# Add tenants loading to useEffect
load_users_old = """    const loadUsers = async () => {
      try {
        const dbUsers = await getAllSystemUsers();"""
load_users_new = """    const loadUsers = async () => {
      try {
        const dbTenants = await getAllTenants();
        setTenants(dbTenants);
      } catch (err) {
        const saved = localStorage.getItem('sams_system_tenants');
        if (saved) setTenants(JSON.parse(saved));
      }
      try {
        const dbUsers = await getAllSystemUsers();"""
content = content.replace(load_users_old, load_users_new)

# Remove local load of tenants inside handleLogin
handle_login_old = """    // Load tenants list
    let tenants: any[] = [];
    try {
      const saved = localStorage.getItem('sams_system_tenants');
      if (saved) tenants = JSON.parse(saved);
    } catch (e) {}"""
handle_login_new = """    // Tenants are already loaded in state `tenants`"""
content = content.replace(handle_login_old, handle_login_new)

# In handleLogin, there's a shadowing variable `tenants` inside `handleLogin`?
# Wait, if `handleLogin_old` has `let tenants: any[] = [];`, replacing it with `// Tenants are already loaded in state` removes the shadowing, which is exactly what we want!

with open('src/components/LoginScreen.tsx', 'w') as f:
    f.write(content)

