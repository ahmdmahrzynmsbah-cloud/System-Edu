import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export interface Tenant {
  id: string;
  name: string;
  phone?: string;
  password?: string;
  joinedDate: string;
  expiryDate?: string;
  maxStudents?: number;
  maxSecretaries?: number;
  whatsappGatewayEnabled?: boolean;
  announcementsEnabled?: boolean;
  analyticsEnabled?: boolean;
  status: 'active' | 'suspended';
  appName?: string;
  features?: string[];
  pricePaid?: number;
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
