import re
with open('src/components/SystemRoles.tsx', 'r') as f:
    content = f.read()

# Fix currentTenantId usage that should have been derived from local storage in those specific blocks
content = content.replace("currentTenantId !== 'super-admin' && currentTenantId !== 'default'", "localStorage.getItem('sams_current_tenant_id') !== 'super-admin' && localStorage.getItem('sams_current_tenant_id') !== 'default'")
content = content.replace("const currentTenant = tenants.find((t: any) => t.id === currentTenantId);", "const currentTenant = tenants.find((t: any) => t.id === localStorage.getItem('sams_current_tenant_id'));")
content = content.replace("tenantId: currentTenantId", "tenantId: localStorage.getItem('sams_current_tenant_id') || 'default'")

with open('src/components/SystemRoles.tsx', 'w') as f:
    f.write(content)
