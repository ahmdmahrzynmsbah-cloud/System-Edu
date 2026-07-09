import re

with open('src/lib/tenantsApi.ts', 'r') as f:
    content = f.read()

old_interface = """export interface Tenant {
  id: string;
  name: string;
  password?: string;
  joinedDate: string;
  expiryDate?: string;
  maxStudents?: number;
  maxSecretaries?: number;
  whatsappGatewayEnabled?: boolean;
  status: 'active' | 'suspended';
  appName?: string;
}"""

new_interface = """export interface Tenant {
  id: string;
  name: string;
  phone?: string;
  password?: string;
  joinedDate: string;
  expiryDate?: string;
  maxStudents?: number;
  maxSecretaries?: number;
  whatsappGatewayEnabled?: boolean;
  status: 'active' | 'suspended';
  appName?: string;
  features?: string[];
  pricePaid?: number;
}"""

content = content.replace(old_interface, new_interface)

with open('src/lib/tenantsApi.ts', 'w') as f:
    f.write(content)
