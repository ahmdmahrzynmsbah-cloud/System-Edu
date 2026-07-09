with open('src/components/SystemRoles.tsx', 'r') as f:
    lines = f.readlines()

out_lines = []
skip = False
for i, line in enumerate(lines):
    if "const loadUsers = () => {" in line:
        skip = True
        out_lines.append("""  const loadUsers = async () => {
    const tenantId = localStorage.getItem('sams_current_tenant_id') || 'default';
    try {
      const dbUsers = await getSystemUsersByTenant(tenantId);
      if (dbUsers.length > 0) {
        setUsers(dbUsers);
      } else {
        const defaultUsers: SystemUser[] = [
          { id: 'u-1', name: 'المدير الأكاديمي', role: 'teacher', password: '123', isDefault: true, tenantId: tenantId },
          { id: 'u-2', name: 'أ. سارة علي', role: 'secretary', password: '456', isDefault: true, tenantId: tenantId }
        ];
        setUsers(defaultUsers);
        // Save defaults to Firebase
        await Promise.all(defaultUsers.map(u => saveSystemUser(u)));
      }
    } catch (err) {
      console.error('Failed to load users from Firebase:', err);
    }
  };\n""")
        continue
    if skip:
        if "};" in line and "const saveUsers =" in lines[i+2]:
            skip = False
        continue
        
    out_lines.append(line)

with open('src/components/SystemRoles.tsx', 'w') as f:
    f.writelines(out_lines)

