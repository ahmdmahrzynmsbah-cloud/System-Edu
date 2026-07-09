import re

with open('src/components/SuperAdminDashboard.tsx', 'r') as f:
    content = f.read()

old_interface = """interface Tenant {
  id: string;
  name: string;
  phone: string;
  password: string;
  status: 'active' | 'suspended';
  joinedDate: string;
  expiryDate: string;
  appName: string;
  features: string[];
  pricePaid: number;
  maxStudents?: number;
  maxSecretaries?: number;
  whatsappGatewayEnabled?: boolean;
}"""

new_interface = """interface Tenant {
  id: string;
  name: string;
  phone?: string;
  password?: string;
  status: 'active' | 'suspended';
  joinedDate: string;
  expiryDate?: string;
  appName?: string;
  features?: string[];
  pricePaid?: number;
  maxStudents?: number;
  maxSecretaries?: number;
  whatsappGatewayEnabled?: boolean;
}"""

content = content.replace(old_interface, new_interface)

with open('src/components/SuperAdminDashboard.tsx', 'w') as f:
    f.write(content)
