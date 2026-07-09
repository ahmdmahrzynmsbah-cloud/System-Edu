import re
with open('src/lib/tenantsApi.ts', 'r') as f:
    content = f.read()

content = content.replace("maxStudents: number;", "maxStudents?: number;")
content = content.replace("maxSecretaries: number;", "maxSecretaries?: number;")
content = content.replace("whatsappGatewayEnabled: boolean;", "whatsappGatewayEnabled?: boolean;")

with open('src/lib/tenantsApi.ts', 'w') as f:
    f.write(content)

