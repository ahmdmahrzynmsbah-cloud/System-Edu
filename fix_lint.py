import re

with open('src/components/LoginScreen.tsx', 'r') as f:
    content = f.read()

import_str = "import { Shield, Lock, Eye, EyeOff, UserCircle2, ArrowRight } from 'lucide-react';"
new_import = import_str + "\nimport { getSystemUsersByTenant, getAllSystemUsers } from '../lib/usersApi';\nimport { getAllTenants } from '../lib/tenantsApi';"

if "getAllTenants" not in content:
    content = content.replace(import_str, new_import)

with open('src/components/LoginScreen.tsx', 'w') as f:
    f.write(content)

with open('src/components/SuperAdminDashboard.tsx', 'r') as f:
    content = f.read()

import_str2 = "import { ShieldCheck, Plus, Search, Check, AlertTriangle, Users, Database, Globe, Play, Square, Settings, UploadCloud, LogOut, CheckCircle, DatabaseZap, Clock, FileWarning, Eye, Trash2, Edit3, X, Copy, Zap, Heart } from 'lucide-react';"
new_import2 = import_str2 + "\nimport { getAllTenants, saveTenant, deleteTenant, subscribeToTenants } from '../lib/tenantsApi';"

if "getAllTenants" not in content:
    content = content.replace(import_str2, new_import2)

with open('src/components/SuperAdminDashboard.tsx', 'w') as f:
    f.write(content)

with open('src/components/SystemRoles.tsx', 'r') as f:
    content = f.read()

# Fix interface SystemUser
content = content.replace(
    """interface SystemUser {
  id: string;
  name: string;
  role: 'teacher' | 'secretary';
  password: string;
  isDefault?: boolean;
  permissions?: string[];
}""",
    """interface SystemUser {
  id: string;
  name: string;
  role: 'teacher' | 'secretary';
  password: string;
  isDefault?: boolean;
  permissions?: string[];
  tenantId?: string;
}"""
)

# Fix async loadData
content = content.replace("const loadData = () => {\n    const tenantId", "const loadData = async () => {\n    const tenantId")

# Fix redeclared block-scoped variables tenantId
content = content.replace("const tenantId = localStorage.getItem('sams_current_tenant_id') || 'default';", "", 1) # First occurrence inside loadData might be okay since it's its own block, wait.
# Actually let's just rename them to avoid issues.

content = content.replace(
    "const tenantId = localStorage.getItem('sams_current_tenant_id') || 'default';",
    "const tId = localStorage.getItem('sams_current_tenant_id') || 'default';"
)
content = content.replace("tenantId", "tId")
content = content.replace("tId: tId", "tenantId: tId")
content = content.replace("tId?: string", "tenantId?: string")
content = content.replace("tenantId: string", "tenantId: string")

with open('src/components/SystemRoles.tsx', 'w') as f:
    f.write(content)

