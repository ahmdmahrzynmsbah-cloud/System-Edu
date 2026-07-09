with open('src/components/SystemRoles.tsx', 'r') as f:
    content = f.read()

content = content.replace("currentTenantId: currentTenantId", "tenantId: currentTenantId")
content = content.replace("currentTenantId?: string;", "tenantId?: string;")

# In SystemUser interface, ensure tenantId exists
if "tenantId?: string;" not in content:
    content = content.replace(
        "permissions?: string[];\n}",
        "permissions?: string[];\n  tenantId?: string;\n}"
    )

with open('src/components/SystemRoles.tsx', 'w') as f:
    f.write(content)

