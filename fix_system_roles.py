with open('src/components/SystemRoles.tsx', 'r') as f:
    content = f.read()

# Fix redeclared block-scoped variable and the tId mess
content = content.replace("const tId = localStorage.getItem('sams_current_tenant_id') || 'default';", "")
content = content.replace("tId", "tenantId")

# Ensure loadData is async
content = content.replace("const loadData = () => {", "const loadData = async () => {\n    const tenantId = localStorage.getItem('sams_current_tenant_id') || 'default';")
content = content.replace("const loadData = async () => {\n    const tenantId = localStorage.getItem('sams_current_tenant_id') || 'default';\n    const tenantId", "const loadData = async () => {\n    const tenantId = localStorage.getItem('sams_current_tenant_id') || 'default';")

# Ensure handle submit is ok
# We'll just define tenantId inside each function block that needs it.

with open('src/components/SystemRoles.tsx', 'w') as f:
    f.write(content)

