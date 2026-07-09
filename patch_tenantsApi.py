with open('src/lib/tenantsApi.ts', 'w') as f:
    f.write('''import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export interface Tenant {
  id: string;
  name: string;
  password?: string;
  createdAt: string;
  expiryDate?: string;
  maxStudents: number;
  maxSecretaries: number;
  whatsappGatewayEnabled: boolean;
  status: 'active' | 'suspended';
  appName?: string;
}

export const getAllTenants = async (): Promise<Tenant[]> => {
  const tenantsRef = collection(db, 'system_tenants');
  const snapshot = await getDocs(tenantsRef);
  return snapshot.docs.map(doc => doc.data() as Tenant);
};

export const saveTenant = async (tenant: Tenant): Promise<void> => {
  const tenantRef = doc(db, 'system_tenants', tenant.id);
  await setDoc(tenantRef, tenant);
};

export const deleteTenant = async (tenantId: string): Promise<void> => {
  const tenantRef = doc(db, 'system_tenants', tenantId);
  await deleteDoc(tenantRef);
};

export const subscribeToTenants = (callback: (tenants: Tenant[]) => void) => {
  const tenantsRef = collection(db, 'system_tenants');
  return onSnapshot(tenantsRef, (snapshot) => {
    const tenants = snapshot.docs.map(doc => doc.data() as Tenant);
    callback(tenants);
  });
};
''')
