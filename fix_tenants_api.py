with open('src/lib/tenantsApi.ts', 'r') as f:
    content = f.read()

content = content.replace("createdAt: string;", "joinedDate: string;")

with open('src/lib/tenantsApi.ts', 'w') as f:
    f.write(content)

