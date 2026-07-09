import re

with open('src/utils/db.ts', 'r') as f:
    content = f.read()

# Add imports
imports_add = "import { db } from '../lib/firebase';\nimport { doc, setDoc } from 'firebase/firestore';\n"
content = imports_add + content

old_save = """function saveToStorage<T>(key: string, data: T) {
  const tenantKey = getTenantKey(key);
  localStorage.setItem(tenantKey, JSON.stringify(data));
}"""

new_save = """function saveToStorage<T>(key: string, data: T) {
  const tenantKey = getTenantKey(key);
  const serialized = JSON.stringify(data);
  localStorage.setItem(tenantKey, serialized);
  
  // Realtime sync to Firebase for this tenant
  const tenantId = localStorage.getItem('sams_current_tenant_id') || 'default';
  if (tenantId !== 'super-admin') {
    setDoc(doc(db, 'system_tenant_data', tenantKey), {
      data: serialized,
      updatedAt: Date.now()
    }).catch(err => console.error('Firebase sync error:', err));
  }
}"""

content = content.replace(old_save, new_save)

with open('src/utils/db.ts', 'w') as f:
    f.write(content)
